import L from 'leaflet';

// NYC Bounding Box Coordinates
export const NYC_BOUNDS = L.latLngBounds(
  [40.4961, -74.2557], // Southwest coordinates
  [40.9155, -73.7002]  // Northeast coordinates
);

// Initial map settings
export const initialCenter: [number, number] = [40.7128, -74.0060]; // NYC center
export const initialZoom: number = 10;

// Define HeatmapData type
export type HeatmapPoint = { lat: number; lng: number; value: number };
export type HeatmapData = HeatmapPoint[];

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

// Pollutant Data
export const POLLUTANTS = [
  { id: 'aqi', name: 'AQI (Overall)', unit: 'index' },
  { id: 'pm25', name: 'PM2.5', unit: 'μg/m³' },
  { id: 'pm10', name: 'PM10', unit: 'μg/m³' },
  { id: 'o3', name: 'Ozone (O₃)', unit: 'ppb' },
  { id: 'no2', name: 'Nitrogen Dioxide (NO₂)', unit: 'ppb' },
  { id: 'so2', name: 'Sulfur Dioxide (SO₂)', unit: 'ppb' },
  { id: 'co', name: 'Carbon Monoxide (CO)', unit: 'ppm' }
];

// Heat map gradient for different pollutants
export const HEATMAP_GRADIENT = {
  aqi: {
    0.4: '#10b981', // Good
    0.6: '#eab308', // Moderate
    0.7: '#f97316', // Unhealthy for Sensitive Groups
    0.8: '#ef4444', // Unhealthy
    0.9: '#8b5cf6', // Very Unhealthy
    1.0: '#7f1d1d'  // Hazardous
  },
  pm25: {
    0.4: '#10b981',
    0.6: '#eab308',
    0.7: '#f97316',
    0.8: '#ef4444',
    0.9: '#8b5cf6',
    1.0: '#7f1d1d'
  },
  default: {
    0.4: '#10b981',
    0.6: '#eab308',
    0.7: '#f97316',
    0.8: '#ef4444',
    0.9: '#8b5cf6',
    1.0: '#7f1d1d'
  }
};
