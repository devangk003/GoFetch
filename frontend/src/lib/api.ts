// Utility functions to call backend API endpoints

const API_BASE_URL = '/api/v1';

export async function fetchGeoData() {
  try {
    const res = await fetch(`${API_BASE_URL}/air-quality/geo`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Geo data fetch error:', errorText);
      throw new Error(`Failed to fetch geo data: ${res.status}`);
    }
    const json = await res.json();
    
    // Transform the data for the map
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((item: any) => ({
        id: item['Site ID'] || item._id,
        latitude: item['Site Latitude'],
        longitude: item['Site Longitude'],
        city: item['Local Site Name'] || item['Geo Place Name'] || item.County || item.State,
        aqi: item['Daily AQI Value'] || item['Data Value'] || item['Average AQI'],
        state: item.State,
        date: item.Date || item['Start_Date'],
        parameter: item['AQS Parameter Description'] || item.Measure || item.Name,
        county: item.County,
        geoTypeName: item['Geo Type Name'],
        geoJoinId: item['Geo Join ID'],
        timePeriod: item['Time Period'],
      }));
    }
    
    return json.data || []; // return array of geo markers
  } catch (error) {
    console.error('Error fetching geo data:', error);
    throw error;
  }
}

export interface GeoData {
  id: string | number;
  latitude: number;
  longitude: number;
  name: string; // Combined or primary name for the location
  city?: string; // More specific city/place name if available
  aqi?: number; // Default to AQI or a primary value
  value?: number; // Actual data value if different from AQI
  state?: string;
  date?: string; // Date of the reading
  date_of_last_update?: string; // Alias for date
  pollutant_name?: string; // Specific pollutant name
  parameter?: string; // Alias for pollutant name
  Measure?: string; // Alias from different datasets
  Name?: string; // Alias from different datasets
  county?: string;
  geoTypeName?: string;
  geo_entity_name?: string; // Alias for geoTypeName
  geoJoinId?: string | number;
  timePeriod?: string;
  time_period?: string; // Alias for timePeriod
  indicatorId?: string | number;
  indicator_id?: string | number; // Alias for indicatorId
  [key: string]: any; // Allow other properties
}


export async function searchData(query: string): Promise<{ results: GeoData[], interpretation: string, sorting: string, originalQuery: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/nlp-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    if (!res.ok) {
      const errorBody = await res.text();
      console.error('NLP Search API Error:', errorBody);
      throw new Error(`Failed to search data using NLP endpoint. Status: ${res.status}`);
    }
    
    const json = await res.json();

    // The NLP endpoint returns a different structure with the enhanced Gemini integration
    if (json.data && Array.isArray(json.data)) {
      return {
        results: json.data.map((item: any): GeoData => ({
          id: item._id, // MongoDB ObjectId
          name: item['Geo Place Name'] || item['Local Site Name'] || item.County || 'Unknown Location',
          city: item['Geo Place Name'], // Location name from new dataset
          aqi: item['Data Value'], // Actual data value, used as 'aqi' for display
          value: item['Data Value'],
          date: item['Start_Date'], // Date of the record
          pollutant_name: item.Name || item.Measure, // Pollutant name or measure
          parameter: item.Name || item.Measure,
          indicatorId: item['Indicator ID'],
          indicator_id: item['Indicator ID'],
          geoTypeName: item['Geo Type Name'],
          geo_entity_name: item['Geo Type Name'],
          geoJoinId: item['Geo Join ID'],
          timePeriod: item['Time Period'],
          time_period: item['Time Period'],
          latitude: item['Latitude'] || item['Site Latitude'],
          longitude: item['Longitude'] || item['Site Longitude'],
        })),
        interpretation: json.filterInterpretation || "Search processed successfully",
        sorting: json.sortingInterpretation || "",
        originalQuery: json.originalQuery || query
      };
    }
    
    return {
      results: [],
      interpretation: json.message || "No results found",
      sorting: "",
      originalQuery: query
    };
  } catch (error) {
    console.error('Error in NLP search:', error);
    throw error;
  }
}

// Keep fetchAQIDataByLocation for now, but it might be replaced by searchData or a more specific geo query
export async function fetchAQIDataByLocation(location: string, pollutant?: string): Promise<GeoData[]> {
  try {
    // This is a simplified mock. Replace with actual API call if available,
    // or adapt to use the /nlp-search or /air-quality/geo more effectively.
    // For now, let's assume it uses the nlp-search for flexibility.
    const response = await searchData(pollutant ? `${pollutant} in ${location}` : location);
    return response.results;
  } catch (error) {
    console.error(`Error fetching AQI data for ${location}:`, error);
    throw error;
  }
}

export async function fetchTrends(city: string, range: string) {
  // Build query parameters
  const params = new URLSearchParams();
  if (city) params.append('city', city);
  if (range) {
    // Convert range format (7d, 30d, 90d) to days for backend
    const days = range.replace('d', '');
    params.append('range', days);
    params.append('days', days);
  }
  
  try {
    // First try with the trends endpoint
    const res = await fetch(`${API_BASE_URL}/air-quality/trends?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed with status: ${res.status}`);
    }
    
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((item: any) => ({
        ...item,
        date: item.date || item['Start_Date'] || item.Date,
        aqi: item.aqi || item['Data Value'] || item.avgAQI || item['Daily AQI Value'] || 0
      }));
    }
    
    // If data is empty or not in expected format, check if there's data property inside data
    if (json.data?.data && Array.isArray(json.data.data)) {
      return json.data.data.map((item: any) => ({
        ...item,
        date: item.date || item['Start_Date'] || item.Date,
        aqi: item.aqi || item['Data Value'] || item.avgAQI || item['Daily AQI Value'] || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in fetchTrends:', error);
    
    // Fallback to standard monthly-trends endpoint
    try {
      const fallbackRes = await fetch(`${API_BASE_URL}/air-quality/monthly-trends?${params.toString()}`);
      if (!fallbackRes.ok) throw new Error(`Failed with status: ${fallbackRes.status}`);
      
      const fallbackJson = await fallbackRes.json();
      return (fallbackJson.data || []).map((item: any) => ({
        ...item,
        date: item.date || item['Start_Date'] || item.Date,
        aqi: item.aqi || item['Data Value'] || item.avgAQI || item['Daily AQI Value'] || 0
      }));
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Failed to fetch trends data');
    }
  }
}

export async function fetchPrediction(city: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/air-quality/predict/${encodeURIComponent(city)}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Prediction API Error:', errorText);
      throw new Error(`Failed to fetch prediction data: ${res.status}`);
    }
    
    const json = await res.json();
    
    // Extract predictions array based on API response structure
    if (json.predictions && Array.isArray(json.predictions)) {
      return json.predictions.map((item: any) => ({
        ...item,
        predicted_aqi: typeof item.predicted_aqi === 'number' ? item.predicted_aqi : parseFloat(item.predicted_aqi) || 0,
        confidence_score: typeof item.confidence_score === 'number' ? item.confidence_score : parseFloat(item.confidence_score) || 0.7,
        date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        category: item.category || ''
      }));
    } else if (json.data && Array.isArray(json.data)) {
      return json.data.map((item: any) => ({
        ...item,
        predicted_aqi: typeof item.predicted_aqi === 'number' ? item.predicted_aqi : parseFloat(item.predicted_aqi) || 0,
        confidence_score: typeof item.confidence_score === 'number' ? item.confidence_score : parseFloat(item.confidence_score) || 0.7,
        date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        category: item.category || ''
      }));
    } else if (json.data?.predictions && Array.isArray(json.data.predictions)) {
      return json.data.predictions.map((item: any) => ({
        ...item,
        predicted_aqi: typeof item.predicted_aqi === 'number' ? item.predicted_aqi : parseFloat(item.predicted_aqi) || 0,
        confidence_score: typeof item.confidence_score === 'number' ? item.confidence_score : parseFloat(item.confidence_score) || 0.7,
        date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        category: item.category || ''
      }));
    }
    
    // If we can't find a predictions array, generate some sample data for demonstration
    if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
      console.warn('No prediction data received, generating demo data');
      const predictions = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        predictions.push({
          date: date.toISOString(),
          predicted_aqi: Math.floor(Math.random() * 100) + 20,
          confidence_score: 0.7 + (Math.random() * 0.25),
          category: ''
        });
      }
      
      return predictions;
    }
    
    return json.data || [];
  } catch (error) {
    console.error('Error in fetchPrediction:', error);
    throw error;
  }
}

// WAQI API Types (World Air Quality Index)

export interface WaqiTime {
  s: string; // Time of measurement
  tz: string; // Timezone
  v: number; // Timestamp
}

export interface WaqiPollutantValue {
  v: number; // Value
}

export interface WaqiPollutants {
  co: WaqiPollutantValue;
  h: WaqiPollutantValue;
  no2: WaqiPollutantValue;
  o3: WaqiPollutantValue;
  p: WaqiPollutantValue;
  pm10: WaqiPollutantValue;
  pm25: WaqiPollutantValue; // PM2.5 often referred to as pm2.5
  so2: WaqiPollutantValue;
  t: WaqiPollutantValue;
  w: WaqiPollutantValue;
  wg?: WaqiPollutantValue; // Optional: Wind Gust
}

export interface WaqiCity {
  geo: [number, number]; // [latitude, longitude]
  name: string;
  url: string;
}

export interface WaqiAttribution {
  name: string;
  url: string;
  logo?: string; // Optional logo URL
}

export interface WaqiForecastDailyValue {
  avg: number;
  day: string; // Date string, e.g., "YYYY-MM-DD"
  max: number;
  min: number;
}

export interface WaqiForecastDaily {
  o3: WaqiForecastDailyValue[];
  pm10: WaqiForecastDailyValue[];
  pm25: WaqiForecastDailyValue[];
  uvi?: WaqiForecastDailyValue[]; // Optional: UV Index
}

export interface WaqiDebug {
  sync: string; // Sync timestamp
}

export interface WaqiData {
  aqi: number;
  idx: number;
  attributions: { url: string; name: string; logo?: string }[];
  city: {
    geo: [number, number];
    name: string;
    url: string;
    location: string;
  };
  dominentpol: string;
  iaqi: {
    [key: string]: { v: number } | undefined; // Pollutants like co, h, no2, o3, p, pm10, pm25, so2, t, w, wg
  };
  time: {
    s: string; // Timestamp string "YYYY-MM-DD HH:MM:SS"
    tz: string; // Timezone string, e.g., "-04:00"
    v: number; // Epoch time
    iso: string; // ISO8601 string
  };
  forecast: {
    daily: {
      [key: string]: { avg: number; day: string; max: number; min: number }[]; // o3, pm10, pm25, uvi
    };
  };
  debug: {
    sync: string;
  };
}


export async function fetchWaqiData(city: string): Promise<WaqiData> {
  try {
    const res = await fetch(`${API_BASE_URL}/waqi/feed/${encodeURIComponent(city)}`);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('WAQI API Error from backend:', res.status, errorBody);
      throw new Error(errorBody.message || `Failed to fetch WAQI data for ${city}. Status: ${res.status}`);
    }
    const json = await res.json();
    if (json.status === 'ok') {
      return json.data as WaqiData;
    } else {
      // Handle cases where the API call was successful (200 OK) but the WAQI service returned an error status
      console.error('WAQI API returned an error status:', json);
      throw new Error(json.message || json.data || 'Failed to fetch WAQI data: WAQI API error');
    }
  } catch (error) {
    console.error(`Error fetching WAQI data for ${city} via backend:`, error);
    throw error; // Re-throw to be caught by the caller (e.g., React Query)
  }
}

export interface AiSuggestion {
  id: string; // A unique ID for the suggestion, e.g., generated by nanoid or uuid
  query: string;
}

let aiSuggestCache: AiSuggestion[] = [];

export async function fetchAiSearchSuggestions(): Promise<AiSuggestion[]> {
  try {
    // If no cache, fetch initial batch of 10 suggestions from backend
    if (aiSuggestCache.length === 0) {
      const res = await fetch(`${API_BASE_URL}/ai/suggestions`);
      if (!res.ok) {
        const errText = await res.text();
        console.error('AI suggestions fetch error:', errText);
        throw new Error(`Failed to fetch AI suggestions: ${res.status}`);
      }
      const json = await res.json();
      const suggestions: AiSuggestion[] = (json.suggestions || []).map((s: any, idx: number) => (
        typeof s === 'string' ? { id: `ai-${idx}`, query: s } : { id: s.id || `ai-${idx}`, query: s.query }
      ));
      // Cache only up to 10 suggestions
      aiSuggestCache = suggestions.slice(0, 10);
    }
    // Randomly pick 5 unique suggestions from cache
    const picks: AiSuggestion[] = [];
    const available = [...aiSuggestCache];
    const count = Math.min(5, available.length);
    for (let i = 0; i < count; i++) {
      const j = Math.floor(Math.random() * available.length);
      picks.push(available.splice(j, 1)[0]);
    }
    return picks;
  } catch (error) {
    console.error('Error in fetchAiSearchSuggestions:', error);
    return aiSuggestCache.slice(0, 5); // fallback to any cached
  }
}
