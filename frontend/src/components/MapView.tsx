import React, { useRef, useEffect, useState } from 'react';
import { useGeoData } from '../lib/queries';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { getAqiColor, getAqiCategory, NYC_BOUNDS, POLLUTANTS, HEATMAP_GRADIENT } from '../lib/mapConfig';
import '../lib/mapConfig'; // Import for side effects (fixing marker icons)
import { getNycCoordinates } from '../lib/utils';
import { BarChart2, Layers, Map as MapIcon, HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent } from '@/components/ui/tooltip';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@radix-ui/react-tooltip'; // Corrected import path
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { GeoData } from '@/lib/api'; // Import GeoData
import { HeatmapPoint } from '../lib/mapConfig'; // Import HeatmapPoint

export interface MapViewProps { // Export the interface
  searchQuery: string;
  searchResults?: GeoData[]; // Use GeoData type
  searchInterpretation?: string;
  isLoading?: boolean;
  onMarkerClick?: (data: GeoData) => void; // Add callback for marker clicks
  selectedLocation?: GeoData | null; // For highlighting or focusing
  onViewportChange?: (center: [number, number], zoom: number) => void;
  mapViewportResetKey?: number; // Key to trigger viewport reset
  // center and zoom are managed internally or via search results now
  // heatmapData is managed internally based on selectedPollutant and data
  // nycBounds is imported directly
}

// Helper to generate popup content
const createPopupContent = (marker: GeoData) => { // Use GeoData type
  const location = marker.city || marker.name || marker['Geo Place Name'] || "Unknown Location";
  // Use a consistent value field, prefer 'value', then 'aqi'
  const value = marker.value !== undefined ? marker.value : (marker.aqi !== undefined ? marker.aqi : marker['Data Value']);
  const date = marker.date ? new Date(marker.date).toLocaleDateString() : "N/A";
  // Use a consistent pollutant field, prefer 'pollutant_name', then 'parameter', 'Measure', 'Name'
  const parameter = marker.pollutant_name || marker.parameter || marker.Measure || marker.Name || "N/A";
  
  return `
    <div class="p-2">
      <h3 class="font-bold text-lg mb-1">${location}</h3>
      <p><span class="font-semibold">${parameter}:</span> ${value !== undefined ? value.toFixed(2) : 'N/A'}</p>
      <p><span class="font-semibold">Date:</span> ${date}</p>
      ${marker.timePeriod ? `<p><span class="font-semibold">Time Period:</span> ${marker.timePeriod}</p>` : ''}
      ${marker.geoTypeName ? `<p><span class="font-semibold">Area Type:</span> ${marker.geoTypeName}</p>` : ''}
      ${marker.indicatorId ? `<p><span class="font-semibold">Indicator ID:</span> ${marker.indicatorId}</p>` : ''}
    </div>
  `;
};

type ViewMode = 'markers' | 'heatmap';
type PollutantType = 'aqi' | 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co';

export const MapView: React.FC<MapViewProps> = ({ 
  searchQuery, 
  searchResults, 
  isLoading = false, 
  onMarkerClick,
  selectedLocation, // Added selectedLocation
  mapViewportResetKey
}) => {
  const { data: geoDataFallback, isLoading: isGeoDataLoading, error: geoDataError } = useGeoData();
  
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('markers');
  const [selectedPollutant, setSelectedPollutant] = useState<PollutantType>('aqi');
  const [showNYCBoundary, setShowNYCBoundary] = useState(true);
  const [detailedResult, setDetailedResult] = useState<any | null>(null);

  // Create refs for map elements
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.HeatLayer | null>(null);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);
  const activeMarkersRef = useRef<L.CircleMarker[]>([]); // Keep track of active markers
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initialMapViewportResetKey = useRef(mapViewportResetKey); // Store initial key

  // Reset map view when reset key changes
  useEffect(() => {
    if (mapViewportResetKey !== undefined && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(NYC_BOUNDS);
    }
  }, [mapViewportResetKey]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current && !mapInitialized) {
      try {
        const map = L.map(mapRef.current, {
          minZoom: 10, // Prevent zooming out too far from NYC
          maxBoundsViscosity: 0.8 // Make the bounds somewhat sticky but not completely restrictive
        }).fitBounds(NYC_BOUNDS);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        map.setMaxBounds(NYC_BOUNDS.pad(0.2));
        
        if (showNYCBoundary && boundaryLayerRef.current === null) { // Ensure boundary is added only once or if cleared
          const boundaryStyle = {
            color: '#3b82f6', // blue-500
            weight: 2,
            opacity: 0.7,
            fill: true,
            fillColor: '#3b82f680',
            fillOpacity: 0.05
          };
          
          boundaryLayerRef.current = L.polygon([
            [NYC_BOUNDS.getSouthWest().lat, NYC_BOUNDS.getSouthWest().lng],
            [NYC_BOUNDS.getNorthWest().lat, NYC_BOUNDS.getNorthWest().lng],
            [NYC_BOUNDS.getNorthEast().lat, NYC_BOUNDS.getNorthEast().lng],
            [NYC_BOUNDS.getSouthEast().lat, NYC_BOUNDS.getSouthEast().lng]
          ], boundaryStyle).addTo(map);
          
          boundaryLayerRef.current.bindTooltip('New York City Area', { 
            permanent: false, 
            direction: 'center',
            className: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
          });
        }
        
        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        setMapInitialized(true);
        
        if (mapRef.current) {
          const mapContainer = mapRef.current;
          setTimeout(() => {
            mapInstanceRef.current?.invalidateSize();
            // console.log('Map container clientHeight after initial invalidateSize:', mapContainer.clientHeight);
          }, 100); 

          resizeObserverRef.current = new ResizeObserver(entries => {
            if (entries[0]) {
              const { height } = entries[0].contentRect;
              // console.log('Map container resized, new height:', height);
              if (mapInstanceRef.current && height > 0) {
                mapInstanceRef.current.invalidateSize();
              }
            }
          });
          resizeObserverRef.current.observe(mapContainer);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to initialize map');
      }
    }
  }, [mapInitialized, showNYCBoundary]); // Depend on mapInitialized and showNYCBoundary

  // Effect for unmounting
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapInitialized(false); // Reset for potential re-creation if component remounts
      }
      if (resizeObserverRef.current && mapRef.current) {
        resizeObserverRef.current.unobserve(mapRef.current);
      }
      resizeObserverRef.current = null;
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  // Effect to reset map viewport when mapViewportResetKey changes
  useEffect(() => {
    // Check if the key has actually changed from its initial value or previous value
    // and that the map instance exists.
    // We use initialMapViewportResetKey.current to avoid resetting on the very first render
    // if mapViewportResetKey starts at 0 and our initial ref is also 0.
    // The key should only trigger a reset when it's incremented.
    if (mapInstanceRef.current && mapViewportResetKey !== undefined && mapViewportResetKey !== initialMapViewportResetKey.current) {
      mapInstanceRef.current.fitBounds(NYC_BOUNDS, {
        padding: [50, 50],
        maxZoom: 13 
      });
      // Update the ref to the new key value so it doesn't reset again unless the key changes again
      initialMapViewportResetKey.current = mapViewportResetKey;
    }
  }, [mapViewportResetKey, mapInitialized]); // Depend on mapViewportResetKey and mapInitialized


  // Update markers or heatmap when data changes or view mode changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapInitialized) return;
    
    requestAnimationFrame(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    // Clear previous error messages when this effect re-runs due to data changes
    setError(null);

    try {
      // Handle loading states explicitly
      if (searchQuery && isLoading) { // isLoading is for search query
        // setError('Loading search results...'); // Optional: specific loading message
        if (markersLayerRef.current) markersLayerRef.current.clearLayers();
        if (heatmapLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
          heatmapLayerRef.current = null;
        }
        return; // Exit early if search is loading
      }

      if (!searchQuery && isGeoDataLoading) {
        // setError('Loading geographical data...'); // Optional: specific loading message
        if (markersLayerRef.current) markersLayerRef.current.clearLayers();
        if (heatmapLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
          heatmapLayerRef.current = null;
        }
        return; // Exit early if geoData is loading and no search is active
      }

      // Prioritize search results if a query exists, otherwise use geoDataFallback
      const currentData: GeoData[] = searchQuery ? (searchResults || []) : (geoDataFallback || []);
      
      // Handle errors from geoData fetching if no search is active and geoData has finished loading
      if (!searchQuery && !isGeoDataLoading && geoDataError) {
        setError(geoDataError instanceof Error ? geoDataError.message : 'Error loading geographical data');
        if (markersLayerRef.current) markersLayerRef.current.clearLayers();
        if (heatmapLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
          heatmapLayerRef.current = null;
        }
        return;
      }
      
      // Check if data is actually available after loading states and errors are handled
      if (!currentData || currentData.length === 0) {
        if (searchQuery) {
          // This is correct: search was performed, yielded no results
          // setError('No results match your search criteria'); // This is handled by a dedicated message overlay
        } else if (!isGeoDataLoading) { 
          // No search, geoData not loading, and geoData is empty (and no geoDataError)
          setError('No data available to display'); 
        }
        // Clear layers if no data
        if (markersLayerRef.current) markersLayerRef.current.clearLayers();
        if (heatmapLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
          heatmapLayerRef.current = null;
        }
        return;
      }
      
      // Clear previous error if data is available and processed (already done at the top)
      
      // Clear existing layers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }
      
      if (heatmapLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      
      // Create bounds to fit all data points
      const bounds = new L.LatLngBounds([]);
      let hasValidPoints = false;
      
      // Process data points with coordinates
      const pointsWithCoords = currentData
        .map((item: GeoData) => { // Use GeoData type
          let lat, lng;
          
          // Try to get coordinates
          if (item.latitude && item.longitude) {
            // Use exact coordinates if available
            lat = item.latitude;
            lng = item.longitude;
          } else {
            // For NYC data, use location name to get or generate coordinates
            const locationName = item.city || item['Geo Place Name'] || item.County || "New York";
            const coords = getNycCoordinates(locationName);
            lat = coords.lat;
            lng = coords.lng;
          }
          
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lat, lng]);
            hasValidPoints = true;
            
            let specificPollutantValue: number | undefined;
            // item here is the GeoData object from currentData
            switch (selectedPollutant) {
              case 'pm25': specificPollutantValue = item.pm25 ?? item['PM2.5'] ?? item['pm2.5']; break;
              case 'pm10': specificPollutantValue = item.pm10 ?? item['PM10']; break;
              case 'o3': specificPollutantValue = item.o3 ?? item['Ozone'] ?? item['o3_concentration']; break; // Added o3_concentration as a possible key
              case 'no2': specificPollutantValue = item.no2 ?? item['NO2'] ?? item['no2_concentration']; break; // Added no2_concentration
              case 'so2': specificPollutantValue = item.so2 ?? item['SO2'] ?? item['so2_concentration']; break; // Added so2_concentration
              case 'co': specificPollutantValue = item.co ?? item['CO'] ?? item['co_concentration']; break;   // Added co_concentration
              case 'aqi':
              default:
                specificPollutantValue = item.value !== undefined ? item.value : (item.aqi !== undefined ? item.aqi : item['Data Value']);
                break;
            }

            return {
              computedLat: lat,
              computedLng: lng,
              value: specificPollutantValue !== undefined && !isNaN(specificPollutantValue) ? specificPollutantValue : 0, // Use the dynamic value, ensure it's a number
              originalData: item 
            };
          }
          
          return null;
        })
        .filter(Boolean);
      
      // If no valid points, show error
      if (!hasValidPoints || pointsWithCoords.length === 0) {
        setError('Could not plot data - no valid coordinates found');
        return;
      }
      
      // Add visualization based on view mode
      if (viewMode === 'markers') {
        // Create circle markers
        activeMarkersRef.current = []; // Clear previous active markers
        pointsWithCoords.forEach((point: any) => { // point now includes originalData
          const circleMarker = L.circleMarker([point.computedLat, point.computedLng], {
            radius: 8,
            fillColor: getAqiColor(point.value),
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
          
          // Add popup with data (using originalData for full details)
          circleMarker.bindPopup(createPopupContent(point.originalData));

          // Handle marker click for sidebar
          if (onMarkerClick) {
            circleMarker.on('click', () => {
              onMarkerClick(point.originalData); // Pass the full original data
            });
          }
          
          // Add to layer
          if (markersLayerRef.current) {
            circleMarker.addTo(markersLayerRef.current);
            activeMarkersRef.current.push(circleMarker); // Add to active markers
          }
        });
      } else if (viewMode === 'heatmap') {
        // Create heatmap data points
        const heatmapDataForLayer: HeatmapPoint[] = pointsWithCoords.map((point: any) => {
          let intensity = 0.01; // Default low intensity, ensure it's not 0 to show something
          if (point.value && typeof point.value === 'number' && !isNaN(point.value)) { // Ensure point.value is a valid number
            // Normalize based on typical ranges for intensity (0-1)
            // These thresholds might need adjustment based on actual data ranges and desired sensitivity
            if (selectedPollutant === 'aqi') {
              intensity = Math.min(point.value / 300, 1); 
            } else if (selectedPollutant === 'pm25') {
              intensity = Math.min(point.value / 55, 1); 
            } else if (selectedPollutant === 'pm10') {
              intensity = Math.min(point.value / 155, 1);
            } else if (selectedPollutant === 'o3') { // Assuming O3 is in ppb
              intensity = Math.min(point.value / 150, 1); // Adjusted upper bound for O3
            } else if (selectedPollutant === 'no2') { // Assuming NO2 is in ppb
              intensity = Math.min(point.value / 100, 1); 
            } else if (selectedPollutant === 'so2') { // Assuming SO2 is in ppb
              intensity = Math.min(point.value / 75, 1);  
            } else if (selectedPollutant === 'co') { // Assuming CO is in ppm
              intensity = Math.min(point.value / 15, 1);  // Adjusted upper bound for CO (e.g. 15ppm)
            }
            intensity = Math.max(0, intensity); // Ensure intensity is not negative
          }
          return { lat: point.computedLat, lng: point.computedLng, value: intensity };
        });
        
        // console.log('Selected Pollutant for Heatmap:', selectedPollutant);
        // console.log('Raw pointsWithCoords for Heatmap:', JSON.stringify(pointsWithCoords.slice(0, 5), null, 2));
        // console.log('Processed heatmapDataForLayer (normalized intensity):', JSON.stringify(heatmapDataForLayer.slice(0, 5), null, 2));

        // Create heatmap layer
        if (mapInstanceRef.current && heatmapDataForLayer.length > 0) {
          const gradient = HEATMAP_GRADIENT[selectedPollutant as keyof typeof HEATMAP_GRADIENT] || HEATMAP_GRADIENT.default;
          
          const leafletHeatmapData: L.HeatLatLngTuple[] = heatmapDataForLayer
            .filter(p => typeof p.value === 'number' && !isNaN(p.value) && p.value > 0) // Filter out points with zero or invalid intensity
            .map(p => [p.lat, p.lng, p.value]);

          // console.log('LeafletHeatmapData (lat, lng, intensity):', JSON.stringify(leafletHeatmapData.slice(0, 5), null, 2));

          if (leafletHeatmapData.length > 0) {
            heatmapLayerRef.current = L.heatLayer(leafletHeatmapData, {
              radius: 25, // Consider making radius dynamic or configurable
              blur: 15,   // Same for blur
              maxZoom: 17,
              max: 1.0,   // Max intensity value (normalized)
              gradient
            }).addTo(mapInstanceRef.current);
            // console.log('Heatmap layer added.');
          } else {
            // console.log('No valid data points to render heatmap after filtering.');
            if (heatmapLayerRef.current && mapInstanceRef.current.hasLayer(heatmapLayerRef.current)) {
                mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
                heatmapLayerRef.current = null;
            }
          }
        } else {
            // console.log('No heatmap data or map instance not available.');
             if (heatmapLayerRef.current && mapInstanceRef.current && mapInstanceRef.current.hasLayer(heatmapLayerRef.current)) {
                mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
                heatmapLayerRef.current = null;
            }
        }
      }
      
      // Fit map to bounds if we have valid points
      if (hasValidPoints && bounds.isValid() && mapInstanceRef.current) {
        // If a specific location is selected (e.g. from search or click), prioritize its view
        // Do not automatically fit bounds if a viewport reset is pending or just occurred,
        // or if a specific location is selected.
        if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
            mapInstanceRef.current.setView([selectedLocation.latitude, selectedLocation.longitude], selectedLocation.zoom || 13);
        } else if (mapViewportResetKey === initialMapViewportResetKey.current) { // Only fit bounds if not resetting
            if (!searchQuery) { // Only fit bounds on initial load or when search is cleared (and not resetting)
                mapInstanceRef.current.fitBounds(bounds, { 
                    padding: [50, 50],
                    maxZoom: 13 
                });
            } else if (searchQuery && searchResults && searchResults.length > 0 && bounds.isValid()) {
                // If there's a search query with results, fit to those results
                mapInstanceRef.current.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 13
                });
            }
        }
      }
    } catch (error) {
      console.error('Error updating map visualization:', error);
      setError('Error updating map display');
    }
  }, [
    searchResults, 
    geoDataFallback, 
    searchQuery, 
    viewMode, 
    selectedPollutant, 
    mapInitialized, 
    isGeoDataLoading, 
    geoDataError, 
    isLoading, 
    onMarkerClick, // Add onMarkerClick to dependencies
    selectedLocation, // Add selectedLocation
    mapViewportResetKey // Add mapViewportResetKey to dependencies
]);

  // Effect to highlight selected marker
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || viewMode !== 'markers') {
      // Clear styles if not in marker view or if selectedLocation is null
      activeMarkersRef.current.forEach(marker => {
        const originalAqi = (marker as any).options?.originalData?.value ?? (marker as any).options?.originalData?.aqi ?? 0;
        marker.setStyle({
          weight: 1,
          fillColor: getAqiColor(originalAqi)
        });
      });
      return; // Exit if not in marker mode
    }

    activeMarkersRef.current.forEach(marker => {
      // Retrieve the original data stored with the marker to get its own AQI value
      const originalData = (marker as any).options?.originalData as GeoData | undefined;
      const markerAqi = originalData?.value ?? originalData?.aqi ?? 0;

      if (selectedLocation && 
          originalData && 
          originalData.latitude === selectedLocation.latitude && 
          originalData.longitude === selectedLocation.longitude &&
          // Use a more robust check, e.g., if IDs are available and match
          (originalData.id ? originalData.id === selectedLocation.id : true) 
          ) {
        marker.setStyle({
          weight: 3,
          fillColor: getAqiColor(markerAqi), // Use its own AQI for color
          color: '#0000ff' // Example: Blue border for selected
        });
        marker.bringToFront();
      } else {
        marker.setStyle({
          weight: 1,
          fillColor: getAqiColor(markerAqi),
          color: '#fff' // Default border color
        });
      }
    });
  // Ensure activeMarkersRef.current is stable or correctly handled in dependencies
  // For simplicity, if activeMarkersRef.current itself changes (e.g. new markers added), this should re-run.
  // However, direct mutation of refs doesn't trigger re-renders/effects. This effect relies on selectedLocation or viewMode changing.
  // If markers are re-rendered (triggering this effect again), activeMarkersRef will be up-to-date.
  }, [selectedLocation, viewMode, mapInitialized, searchResults, geoDataFallback]); // Added mapInitialized, searchResults, geoDataFallback to re-run if markers might change


  // If search query contains specific information about a contaminant and location,
  // extract and display detailed information
  useEffect(() => {
    if (!searchQuery || !searchResults || searchResults.length === 0) {
      setDetailedResult(null);
      return;
    }
    
    // Look for queries like "what is the NO2 contamination in Harlem"
    const contaminantMatch = searchQuery.match(/(?:what|show|tell me|display)\\s+(?:is|about)\\s+(?:the)?\\s*([a-z0-9\\.]+)\\s+(?:contamination|pollution|level|concentration)\\s+in\\s+([a-z\\s]+)/i);
    
    if (contaminantMatch) {
      const [_, contaminant, location] = contaminantMatch;
      
      // Find matching results
      const matchingResults = searchResults.filter((result: any) => {
        const resultLocation = result.city || result['Geo Place Name'] || '';
        const resultParameter = result.parameter || result.Measure || result.Name || '';
        
        return (
          resultLocation.toLowerCase().includes(location.toLowerCase()) &&
          resultParameter.toLowerCase().includes(contaminant.toLowerCase())
        );
      });
      
      if (matchingResults.length > 0) {
        // Get the most recent result
        const mostRecent = matchingResults.sort((a: any, b: any) => {
          const dateA = new Date(a.date || a['Start_Date'] || 0);
          const dateB = new Date(b.date || b['Start_Date'] || 0);
          return dateB.getTime() - dateA.getTime();
        })[0];
        
        setDetailedResult({
          contaminant: contaminant.toUpperCase(),
          location: location,
          value: mostRecent.aqi || mostRecent['Data Value'] || 0,
          date: mostRecent.date || mostRecent['Start_Date'],
          category: getAqiCategory(mostRecent.aqi || mostRecent['Data Value'] || 0),
          color: getAqiColor(mostRecent.aqi || mostRecent['Data Value'] || 0),
          fullData: mostRecent
        });
      } else {
        setDetailedResult(null);
      }
    } else {
      setDetailedResult(null);
    }
  }, [searchQuery, searchResults]);

  return (
    // MODIFIED: Ensured this div is also a flex column and can grow
    <div className="flex-1 flex flex-col relative w-full min-h-0"> 
      <div ref={mapRef} className="flex-grow h-full w-full" /> {/* MODIFIED: Added flex-grow */}
      
      {/* Map Controls */}
      {/* MODIFIED: Increased z-index from z-10 to z-[1000] */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <TooltipProvider>
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md w-auto">
            <CardHeader className="p-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                View Options
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Display Mode</label>
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)} className="flex justify-start">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="markers" aria-label="Markers view">
                          <MapIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Marker View</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="heatmap" aria-label="Heatmap view">
                          <BarChart2 className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>Heatmap View</TooltipContent>
                    </Tooltip>
                  </ToggleGroup>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium">Pollutant Type</label>
                  <Select 
                    value={selectedPollutant} 
                    onValueChange={(value) => setSelectedPollutant(value as PollutantType)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select pollutant" />
                    </SelectTrigger>
                    <SelectContent>
                      {POLLUTANTS.map(pollutant => (
                        <SelectItem key={pollutant.id} value={pollutant.id}>
                          {pollutant.name} ({pollutant.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">NYC Boundary</label>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="nycBoundary" 
                      checked={showNYCBoundary}
                      onChange={e => setShowNYCBoundary(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-700"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipProvider>
      </div>
      
      {/* Loading overlay */}
      {(isLoading || isGeoDataLoading) && (
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center z-[1100]"> {/* MODIFIED: Increased z-index */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Loading data...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {(error || geoDataError) && (
        // MODIFIED: Increased z-index from z-10 to z-[1000]
        <div className="absolute bottom-4 left-4 right-4 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg shadow-lg z-[1000]">
          <p className="text-red-800 dark:text-red-200">
            {error || (geoDataError instanceof Error ? geoDataError.message : 'Error loading map data')}
          </p>
        </div>
      )}
      
      {/* No results message */}
      {searchQuery && searchResults && searchResults.length === 0 && !isLoading && (
        // MODIFIED: Increased z-index from z-20 to z-[1000]
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-[1000]">
          <p className="text-gray-800 dark:text-gray-200">No results found for "{searchQuery}"</p>
        </div>
      )}
      
      {/* Detailed Result Card for specific search queries */}
      {detailedResult && (
        // MODIFIED: Increased z-index from z-20 to z-[1000]
        <div className="absolute top-24 left-4 z-[1000] max-w-md">
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg border-l-4" style={{ borderLeftColor: detailedResult.color }}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">
                {detailedResult.contaminant} in {detailedResult.location}
              </CardTitle>
              <CardDescription>
                Based on your search query
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold" style={{ color: detailedResult.color }}>
                    {detailedResult.value.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {detailedResult.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(detailedResult.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {detailedResult.fullData.timePeriod || 'Latest reading'}
                  </p>
                </div>
              </div>
              {detailedResult.fullData && (
                <button 
                  onClick={() => onMarkerClick && detailedResult.fullData && onMarkerClick(detailedResult.fullData)}
                  className="text-xs text-blue-500 hover:underline mt-2"
                >
                  Show on map / More details
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Legend */}
      {/* MODIFIED: Increased z-index from z-10 to z-[1000] */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg z-[1000]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
            {POLLUTANTS.find(p => p.id === selectedPollutant)?.name || 'AQI'} Legend
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Air Quality Index (AQI) is a measure of air pollution. Higher values indicate worse air quality.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Good (0-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Moderate (51-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Unhealthy (101-150)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Unhealthy (151-200)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Very Unhealthy (201-300)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-fuchsia-800 rounded-full"></div> {/* Changed from maroon to fuchsia for better dark mode visibility */}
            <span className="text-gray-700 dark:text-gray-300">Hazardous (301+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
