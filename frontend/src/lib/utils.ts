import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// NYC neighborhood coordinates data
interface GeoData {
  [key: string]: { lat: number; lng: number };
}

// Function to get consistent coordinates for NYC neighborhoods
export function getNycCoordinates(locationName: string): { lat: number; lng: number } {
  if (!locationName) {
    return { lat: 40.7128, lng: -74.0060 }; // NYC center point if no location
  }
  
  // Normalize the location name for comparison
  const normalizedName = locationName.toLowerCase().trim();
  
  // NYC center point as fallback
  const nycDefault = { lat: 40.7128, lng: -74.0060 };
  
  // Common NYC boroughs and neighborhoods with approximate coordinates
  const nycLocations: GeoData = {
    'bronx': { lat: 40.8448, lng: -73.8648 },
    'brooklyn': { lat: 40.6782, lng: -73.9442 },
    'manhattan': { lat: 40.7831, lng: -73.9712 },
    'queens': { lat: 40.7282, lng: -73.7949 },
    'staten island': { lat: 40.5795, lng: -74.1502 },
    'chelsea': { lat: 40.7465, lng: -74.0014 },
    'chelsea-village': { lat: 40.7421, lng: -74.0018 },
    'village': { lat: 40.7343, lng: -74.0036 },
    'greenwich village': { lat: 40.7343, lng: -74.0036 },
    'lower manhattan': { lat: 40.7128, lng: -74.0060 },
    'downtown': { lat: 40.7128, lng: -74.0060 },    'midtown': { lat: 40.7549, lng: -73.9840 },
    'upper east side': { lat: 40.7736, lng: -73.9566 },
    'upper west side': { lat: 40.7870, lng: -73.9754 },
    'harlem': { lat: 40.8116, lng: -73.9465 },
    'east harlem': { lat: 40.7957, lng: -73.9422 },
    'central harlem': { lat: 40.8116, lng: -73.9465 },
    'central park': { lat: 40.7829, lng: -73.9654 },
    'williamsburg': { lat: 40.7081, lng: -73.9571 },
    'park slope': { lat: 40.6710, lng: -73.9814 },
    'dumbo': { lat: 40.7033, lng: -73.9881 },
    'long island city': { lat: 40.7447, lng: -73.9485 },
    'astoria': { lat: 40.7643, lng: -73.9235 },
    'flushing': { lat: 40.7654, lng: -73.8318 },
    'jamaica': { lat: 40.7020, lng: -73.8007 },
    'st. george': { lat: 40.6445, lng: -74.0766 },
    'new york': nycDefault, // For general "New York" references
    'new york city': nycDefault,
    'nyc': nycDefault,
    'tribeca': { lat: 40.7163, lng: -74.0086 },
    'soho': { lat: 40.7234, lng: -74.0014 },
    'financial district': { lat: 40.7075, lng: -74.0113 },
    'chinatown': { lat: 40.7158, lng: -73.9970 },
    'little italy': { lat: 40.7196, lng: -73.9971 },
    'east village': { lat: 40.7265, lng: -73.9815 },
    'gramercy': { lat: 40.7368, lng: -73.9845 },
    'kips bay': { lat: 40.7419, lng: -73.9777 },
    'murray hill': { lat: 40.7479, lng: -73.9756 },
    'hells kitchen': { lat: 40.7637, lng: -73.9918 },
    'clinton': { lat: 40.7637, lng: -73.9918 },
    'yorkville': { lat: 40.7768, lng: -73.9498 },
    'lenox hill': { lat: 40.7668, lng: -73.9607 },
    'carnegie hill': { lat: 40.7835, lng: -73.9559 },
    'morningside heights': { lat: 40.8089, lng: -73.9637 },
    'washington heights': { lat: 40.8417, lng: -73.9393 },
    'inwood': { lat: 40.8673, lng: -73.9215 },
    'fort greene': { lat: 40.6920, lng: -73.9760 },
    'downtown brooklyn': { lat: 40.6935, lng: -73.9852 },
    'carroll gardens': { lat: 40.6795, lng: -73.9986 },
    'boerum hill': { lat: 40.6848, lng: -73.9843 },
    'cobble hill': { lat: 40.6864, lng: -73.9958 },
    'red hook': { lat: 40.6744, lng: -74.0110 },
    'bedford-stuyvesant': { lat: 40.6872, lng: -73.9496 },
    'bed-stuy': { lat: 40.6872, lng: -73.9496 },
    'bushwick': { lat: 40.6953, lng: -73.9165 },
    'greenpoint': { lat: 40.7312, lng: -73.9542 },
    'crown heights': { lat: 40.6737, lng: -73.9442 },
    'prospect heights': { lat: 40.6774, lng: -73.9668 },
    'flatbush': { lat: 40.6413, lng: -73.9615 },
    'bay ridge': { lat: 40.6262, lng: -74.0286 },
    'coney island': { lat: 40.5755, lng: -73.9707 },
    'sunset park': { lat: 40.6480, lng: -74.0048 },
    'jackson heights': { lat: 40.7556, lng: -73.8830 },
    'elmhurst': { lat: 40.7365, lng: -73.8761 },
    'forest hills': { lat: 40.7195, lng: -73.8463 },
    'rego park': { lat: 40.7254, lng: -73.8616 },
    'sunnyside': { lat: 40.7432, lng: -73.9196 },
    'woodside': { lat: 40.7524, lng: -73.9040 },
    'bayside': { lat: 40.7628, lng: -73.7716 },
    'fresh meadows': { lat: 40.7335, lng: -73.7846 },
    'st. albans': { lat: 40.6895, lng: -73.7654 },
    'howard beach': { lat: 40.6574, lng: -73.8438 },
    'far rockaway': { lat: 40.6057, lng: -73.7558 }
  };
  
  // Check if we have exact match (case-insensitive)
  for (const [key, coords] of Object.entries(nycLocations)) {
    if (key.toLowerCase() === normalizedName) {
      return coords;
    }
  }
  
  // Check for partial matches
  for (const [key, coords] of Object.entries(nycLocations)) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      return coords;
    }
  }
  
  // Generate a consistent "random" position based on the location name
  // This ensures the same location name always gets the same coordinates
  const hash = locationName.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Use the hash to generate a small offset from NYC center
  const latOffset = (hash % 100) / 1000 - 0.05; // Range: -0.05 to 0.05
  const lngOffset = ((hash * 31) % 100) / 1000 - 0.05; // Range: -0.05 to 0.05
  
  return {
    lat: nycDefault.lat + latOffset,
    lng: nycDefault.lng + lngOffset
  };
}

// Format a date string in a consistent way
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
}
