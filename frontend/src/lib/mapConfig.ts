import L from 'leaflet';

// Fix the marker icon issue in Leaflet when used with webpack/vite
// Default marker icons don't show up because Leaflet's CSS assumes specific paths
const fixLeafletMarker = () => {
  // Get the URL to the marker icon images
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  // Set the paths for the default icon images manually
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
    iconUrl: '/images/leaflet/marker-icon.png',
    shadowUrl: '/images/leaflet/marker-shadow.png',
  });
};

// Function to get a color for an AQI value
export const getAqiColor = (aqi: number): string => {
  if (aqi <= 50) return '#10b981'; // green-500 - Good
  if (aqi <= 100) return '#eab308'; // yellow-500 - Moderate
  if (aqi <= 150) return '#f97316'; // orange-500 - Unhealthy for Sensitive Groups
  if (aqi <= 200) return '#ef4444'; // red-500 - Unhealthy
  if (aqi <= 300) return '#8b5cf6'; // purple-500 - Very Unhealthy
  return '#7f1d1d'; // red-900 - Hazardous
};

// Function to get a category name for an AQI value
export const getAqiCategory = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Call the function to fix Leaflet marker icons
fixLeafletMarker();

export default {
  fixLeafletMarker,
  getAqiColor,
  getAqiCategory
};
