// Utility functions to call backend API endpoints

export async function fetchGeoData() {
  const res = await fetch('/api/v1/air-quality/geo');
  if (!res.ok) throw new Error('Failed to fetch geo data');
  const json = await res.json();
  
  // Transform the data for the map
  if (json.data && Array.isArray(json.data)) {
    return json.data.map((item: any) => ({
      id: item['Site ID'] || item._id,
      latitude: item['Site Latitude'],
      longitude: item['Site Longitude'],
      city: item['Local Site Name'] || item.County || item.State,
      aqi: item['Daily AQI Value'] || item['Average AQI'],
      state: item.State,
      date: item.Date,
      parameter: item['AQS Parameter Description'],
      county: item.County
    }));
  }
  
  return json.data || []; // return array of geo markers
}

export async function searchData(query: string) {
  const res = await fetch(`/api/v1/air-quality/nlp-search`, {
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

  // Transform search results. The NLP endpoint returns data under json.data.data
  if (json.data && json.data.data && Array.isArray(json.data.data)) {
    return json.data.data.map((item: any) => ({
      id: item._id, // MongoDB ObjectId
      // latitude: item['Site Latitude'], // Not available in new dataset per record
      // longitude: item['Site Longitude'], // Not available in new dataset per record
      city: item['Geo Place Name'], // Location name from new dataset
      aqi: item['Data Value'], // Actual data value, used as 'aqi' for display
      // state: item.State, // Not directly available in new dataset per record
      date: item['Start_Date'], // Date of the record
      parameter: item.Measure, // Pollutant measure
      // county: item.County, // Not directly available in new dataset per record
      // Add any other relevant fields that the frontend might use
      indicatorId: item['Indicator ID'],
      geoTypeName: item['Geo Type Name'],
      geoJoinId: item['Geo Join ID'],
      timePeriod: item['Time Period'],
    }));
  }

  // Support nested structures or direct data if the shape varies slightly
  if (json.data && Array.isArray(json.data)) { // Fallback for slightly different structure
     return json.data.map((item: any) => ({
      id: item._id,
      city: item['Geo Place Name'],
      aqi: item['Data Value'],
      date: item['Start_Date'],
      parameter: item.Measure,
      indicatorId: item['Indicator ID'],
      geoTypeName: item['Geo Type Name'],
      geoJoinId: item['Geo Join ID'],
      timePeriod: item['Time Period'],
    }));
  }
  
  return json.data?.data || json.data || []; // Ensure an array is returned
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
    const res = await fetch(`/api/v1/air-quality/trends?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed with status: ${res.status}`);
    }
    
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data; // extract data array
    }
    
    // If data is empty or not in expected format, check if there's data property inside data
    if (json.data?.data && Array.isArray(json.data.data)) {
      return json.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error in fetchTrends:', error);
    
    // Fallback to standard monthly-trends endpoint
    try {
      const fallbackRes = await fetch(`/api/v1/air-quality/monthly-trends?${params.toString()}`);
      if (!fallbackRes.ok) throw new Error(`Failed with status: ${fallbackRes.status}`);
      
      const fallbackJson = await fallbackRes.json();
      return fallbackJson.data || [];
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Failed to fetch trends data');
    }
  }
}

export async function fetchPrediction(city: string) {
  try {
    const res = await fetch(`/api/v1/air-quality/predict/${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error(`Failed with status: ${res.status}`);
    
    const json = await res.json();
    
    // Extract predictions array based on API response structure
    if (json.predictions && Array.isArray(json.predictions)) {
      return json.predictions; // Extract directly if it's at the top level
    } else if (json.data && Array.isArray(json.data)) {
      return json.data; // Common structure where data is the array
    } else if (json.data?.predictions && Array.isArray(json.data.predictions)) {
      return json.data.predictions; // Nested structure
    }
    
    // If we can't find a predictions array, return the data property or an empty array
    return json.data || [];
  } catch (error) {
    console.error('Error in fetchPrediction:', error);
    throw new Error('Failed to fetch prediction data');
  }
}
