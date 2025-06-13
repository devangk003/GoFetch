import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { NavigationBar } from '../components/NavigationBar';
import { MapView, MapViewProps } from '../components/MapView'; // MapViewProps is now exported
import Sidebar, { SearchResultData } from '../components/Sidebar';
import { PredictionsView } from '../components/PredictionsView'; // Import PredictionsView
import { useToast } from '../components/ui/use-toast';
// GeoData is now exported from api.ts
// initialCenter, initialZoom, NYC_BOUNDS are now exported from mapConfig.ts
import { searchData, GeoData, fetchGeoData } from '../lib/api'; 
import { initialCenter, initialZoom, NYC_BOUNDS, HeatmapData } from '../lib/mapConfig';
import L from 'leaflet';

type ViewType = 'map' | 'trends' | 'predictions';

const IndexPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoData[]>([]);
  const [searchInterpretation, setSearchInterpretation] = useState<string>('');
  // mapCenter and mapZoom are now managed by MapView or by search/selection events
  // const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  // const [mapZoom, setMapZoom] = useState<number>(initialZoom);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  const [selectedMapData, setSelectedMapData] = useState<GeoData | null>(null); // For data selected on map
  // heatmapData is managed within MapView based on pollutant selection
  // const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState<SearchResultData[] | null>(null);
  const [navbarHeight, setNavbarHeight] = useState(0); // State for navbar height
  const headerRef = useRef<HTMLElement>(null); // Ref for the header/navbar
  const [mapViewportResetKey, setMapViewportResetKey] = useState<number>(0); // Key to trigger map viewport reset

  useEffect(() => {
    if (headerRef.current) {
      setNavbarHeight(headerRef.current.offsetHeight);
    }
    // Optional: Add a resize listener if navbar height can change dynamically
    const handleResize = () => {
      if (headerRef.current) {
        setNavbarHeight(headerRef.current.offsetHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchInterpretation('');
      // Potentially reset map to default view or clear highlights
      setSelectedMapData(null); 
      // Do not close sidebar here, let user close it or a new search close it.
      // Reset map view if search is cleared
      // setMapViewportResetKey(prev => prev + 1); // Optionally reset map on clear search
      return;
    }

    setIsLoadingSearch(true);
    setSearchError(null);
    setSearchQuery(query); // Store the active query

    try {
      const response = await searchData(query);
      setSearchResults(response.results);
      setSearchInterpretation(response.interpretation);

      if (response.results.length > 0) {
        // Display all search results as markers on the map
        setSelectedMapData(null);
        // Prepare sidebar entries for each result
        const sidebarEntries = response.results.map((res) => ({
          name: res.name || res.city || 'Search Result',
          pollutant: res.pollutant_name || res.parameter || 'AQI',
          value: res.value !== undefined ? res.value : res.aqi,
          date: res.date || new Date().toLocaleDateString(),
          timePeriod: res.timePeriod || res.time_period,
          areaType: res.geoTypeName || res.geo_entity_name,
          indicatorId: res.indicatorId || res.indicator_id,
          imageUrl: `https://source.unsplash.com/400x200/?${encodeURIComponent(res.name || res.city || 'cityscape')}`,
          latitude: res.latitude,
          longitude: res.longitude,
        }));
        setSidebarData(sidebarEntries);
        setIsSidebarOpen(true);
      } else {
        toast({
          title: "No Results",
          description: `No air quality data found for "${query}".`,
          variant: "default",
        });
        // Don't close sidebar, let user see "no results" or clear it manually
        // setIsSidebarOpen(false); 
        // setSidebarData(null);
        setSelectedMapData(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch air quality data.";
      setSearchError(new Error(errorMessage));
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive",
      });
      // setIsSidebarOpen(false); // Don't close sidebar on error
      // setSidebarData(null);
      // Keep sidebar open but clear data on error, or close it
      setSidebarData(null);
      setSelectedMapData(null);
      // If you want to close it on error:
      // setIsSidebarOpen(false);
    }
    setIsLoadingSearch(false);
  };

  const handleMapMarkerClick = useCallback((data: GeoData) => {
    // Collect all entries matching this marker's location
    const matchingEntries: SearchResultData[] = searchResults
      .filter(item => item.latitude === data.latitude && item.longitude === data.longitude)
      .map(item => ({
        name: item.name || item.city || 'Selected Location',
        pollutant: item.pollutant_name || item.parameter || 'AQI',
        value: item.value !== undefined ? item.value : item.aqi,
        date: item.date || new Date().toLocaleDateString(),
        timePeriod: item.timePeriod || item.time_period,
        areaType: item.geoTypeName || item.geo_entity_name,
        indicatorId: item.indicatorId || item.indicator_id,
        imageUrl: `https://source.unsplash.com/400x200/?${encodeURIComponent(item.name || item.city || 'location')}`,
        latitude: item.latitude,
        longitude: item.longitude,
      }));
    setSidebarData(matchingEntries);
    setIsSidebarOpen(true); // Ensure sidebar opens on marker click
    setSelectedMapData(data); 
  }, [searchResults]); // include searchResults

  // For the X button in the sidebar - full close and reset map selection
  const handleCloseSidebarAndReset = () => {
    setIsSidebarOpen(false);
    setSidebarData(null);
    setSelectedMapData(null);
    // Clear any active search so default NYC data re-renders
    setSearchQuery('');
    setSearchResults([]);
    setSearchInterpretation('');
    // Reset map viewport to default
    setMapViewportResetKey(prev => prev + 1);
  };

  // For the new toggle arrow button - just opens/closes sidebar
  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Debounced search input change handler
  const [internalSearchValue, setInternalSearchValue] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      // This is where you might trigger a search if you want live suggestions
      // For now, onSearch is triggered by SearchBar's explicit onSearch prop
    }, 500);
    return () => clearTimeout(handler);
  }, [internalSearchValue]);


  // Props for MapView
  const mapViewProps: MapViewProps = {
    searchQuery: searchQuery, // Pass the current search query
    searchResults: searchResults,
    isLoading: isLoadingSearch, // Pass search loading state
    onMarkerClick: handleMapMarkerClick,
    selectedLocation: selectedMapData, // Pass selected data for highlighting
    // searchInterpretation is handled by NavigationBar/SearchBar
    mapViewportResetKey: mapViewportResetKey, // Pass the reset key
  };
  
  // Props for NavigationBar
  const navBarProps = {
    currentView: currentView,
    onViewChange: setCurrentView,
    searchValue: internalSearchValue, // Controlled input for SearchBar
    onSearchChange: setInternalSearchValue, // Update internal state on change
    onSearch: handleSearch, // Actual search execution
    isSearchLoading: isLoadingSearch,
    searchError: searchError,
    searchInterpretation: searchInterpretation,
    showSearch: currentView === 'map', // Only show search bar in map view
  };

  return (
    <div className="flex flex-col h-screen min-h-screen bg-background text-foreground"> {/* Removed overflow-hidden */}
      <header ref={headerRef} className="p-4 bg-background/80 backdrop-blur-md shadow-sm z-[1050] flex-shrink-0"> {/* Added flex-shrink-0 */}
        <NavigationBar {...navBarProps} />
      </header>
      <main className="flex-grow flex flex-col min-h-0 relative overflow-y-auto"> {/* Added overflow-y-auto */}
        {currentView === 'map' && (
          <>
            <MapView {...mapViewProps} />
            <Sidebar 
              isOpen={isSidebarOpen} 
              onClose={handleCloseSidebarAndReset} // X button action
              onToggle={handleToggleSidebar}      // Arrow button action
              data={sidebarData}
              // Pass navbarHeight to Sidebar for correct positioning
              topOffset={navbarHeight} 
            />
          </>
        )}
        {currentView === 'predictions' && (
          <PredictionsView />
        )}
        {currentView === 'trends' && (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-2xl text-muted-foreground">Trends View - Coming Soon!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default IndexPage;
