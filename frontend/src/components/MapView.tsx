import React, { useRef, useEffect, useState } from 'react';
import { fetchGeoData, searchData } from '../lib/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAqiColor, getAqiCategory } from '../lib/mapConfig';
import '../lib/mapConfig'; // Import for side effects (fixing marker icons)

interface MapViewProps {
  searchQuery: string;
}

// Helper to generate popup content
const createPopupContent = (marker: any) => {
  const location = marker.city || marker['Geo Place Name'] || "Unknown Location";
  const value = marker.aqi !== undefined ? marker.aqi : marker['Data Value']; // Use 'aqi' which is mapped to 'Data Value'
  const date = marker.date ? new Date(marker.date).toLocaleDateString() : "N/A";
  const parameter = marker.parameter || marker.Measure || "N/A";
  // AQI category logic might need adjustment if 'value' is not directly AQI
  // For now, we'll display the raw value and its parameter name.
  // const category = typeof value === 'number' ? getAqiCategory(value) : 'Unknown'; 

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

export const MapView: React.FC<MapViewProps> = ({ searchQuery }) => {
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Create refs for map elements
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current && !mapInitialized) {
      const map = L.map(mapRef.current).setView([40.7128, -74.0060], 10); // NYC default
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setMapInitialized(true); // Mark map as initialized
    }

    // No cleanup function here to persist map instance across re-renders unless component unmounts
  }, [mapInitialized]); // Depend on mapInitialized

  // Effect for unmounting
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapInitialized(false); // Reset for potential re-creation if component remounts
      }
    };
  }, []); // Empty dependency array means this runs only on mount and unmount

  // Load and display data
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      
      try {
        const data = searchQuery
          ? await searchData(searchQuery)
          : await fetchGeoData();
          
        const markersData = Array.isArray(data) ? data : [];
        setMarkers(markersData);
        
        // Update markers on the map
        if (markersLayerRef.current && mapInstanceRef.current) {
          // Clear existing markers
          markersLayerRef.current.clearLayers();
          
          // Create bounds to fit all markers
          const bounds = new L.LatLngBounds([]);
          let hasValidMarkers = false;
          
          // Add new markers
          markersData.forEach((m, index) => {
            // The new dataset does not have direct latitude/longitude per record.
            // We will rely on search returning data for a specific Geo Place Name,
            // and the map will center on NYC or the first available marker if any.
            // For now, we can't place individual markers accurately without lat/lng.
            // This section needs to be re-thought. 
            // For demonstration, if search results are for a specific area, we might just show info, not individual points.
            // OR, we need a way to get representative lat/lng for the 'Geo Place Name' values.

            // Placeholder: If we had lat/lng, it would look like this:
            // const lat = m.latitude;
            // const lng = m.longitude;
            // if (lat && lng && !isNaN(lat) && !isNaN(lng)) { ... }
            
            // Since we don't have lat/lng for each data point from the NLP search results directly,
            // we will not create individual markers. The map will remain centered on NYC.
            // We can display the results in a list or table elsewhere, or enhance this
            // to fetch representative coordinates for the Geo Place Names if possible.
          });

          // If markersData has items, but we can't plot them due to lack of lat/lng:
          if (markersData.length > 0) {
            // We won't try to fit bounds as we don't have individual marker coordinates.
            // The map remains centered on NYC (or its initial view).
            // We can update a message or a list view with the results.
            console.log("Data received for map view:", markersData);
            // Potentially set a state here to display these results in a non-map format if needed.
            if (mapInstanceRef.current) {
                // For now, let's just add one marker at the center of NYC as a placeholder
                // if there's data, to show *something* on the map.
                // This is a temporary measure.
                const centralLat = 40.7128;
                const centralLng = -74.0060;
                hasValidMarkers = true; // Assume we have data to show, even if not plotted accurately

                // Create a single marker or a summary popup
                // For simplicity, let's use the first result for the popup content
                const representativeData = markersData[0];
                const marker = L.marker([centralLat, centralLng]);
                marker.bindPopup(createPopupContent(representativeData));
                marker.addTo(markersLayerRef.current);
                bounds.extend([centralLat, centralLng]); // Add to bounds for fitting
            }
          }

          if (hasValidMarkers && mapInstanceRef.current && bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 12
            });
          } else if (markersData.length === 0) {
            // If no markers at all, show a message
            setError('No data points found for the current view');
          } else {
            // If data but no valid coordinates
            setError('Data found but no valid coordinates were available');
          }
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load map data');
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [searchQuery]);

  return (
    <div className="h-screen relative flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Map container */}
      <div ref={mapRef} className="flex-1 z-0" />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <p className="text-gray-700 dark:text-gray-300">Loading map data...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg shadow-lg z-10">
          {error}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg z-10">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-2">AQI Legend</h3>
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
            <span className="text-gray-700 dark:text-gray-300">Hazardous (200+)</span>
          </div>
        </div>
        
        {searchQuery && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Search: "{searchQuery}"
            </p>
          </div>
        )}
      </div>
      
      {/* Markers list (optional - can be hidden/toggled) */}
      <div className="absolute top-4 left-4 max-h-[60vh] w-64 overflow-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 z-10">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Locations ({markers.length})</h3>
        </div>
        <div className="overflow-y-auto max-h-96">
          {markers.length > 0 ? (
            markers.map((m, index) => {
              const aqi = m.aqi || m["Daily AQI Value"] || "N/A";
              return (
                <div 
                  key={m._id || m.id || `marker-${index}`} 
                  className="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  style={{
                    borderLeft: typeof aqi === 'number' ? `4px solid ${getAqiColor(aqi)}` : undefined
                  }}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {m.city || m.County || m["CBSA Name"] || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    AQI: {aqi}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Loading..." : "No data available"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
