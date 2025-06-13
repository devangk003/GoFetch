import { useQuery } from '@tanstack/react-query';
import { searchData, fetchGeoData, fetchTrends, fetchPrediction } from './api';

// Hook for NLP searches
export function useNlpSearch(query: string) {
  return useQuery({
    queryKey: ['nlpSearch', query],
    queryFn: () => searchData(query),
    enabled: !!query, // Only run the query if there's a search string
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
}

// Hook for geo data
export function useGeoData() {
  return useQuery({
    queryKey: ['geoData'],
    queryFn: fetchGeoData,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false
  });
}

// Hook for trends data
export function useTrendsData(city: string, range: string) {
  return useQuery({
    queryKey: ['trends', city, range],
    queryFn: () => fetchTrends(city, range),
    enabled: !!city, // Only run if city is provided
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false
  });
}

// Hook for prediction data
export function usePredictionData(city: string) {
  return useQuery({
    queryKey: ['prediction', city],
    queryFn: () => fetchPrediction(city),
    enabled: !!city, // Only run if city is provided
    staleTime: 1000 * 60 * 30, // 30 minutes since predictions don't change often
    refetchOnWindowFocus: false
  });
}
