import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, TrendingUp, TrendingDown, Loader } from 'lucide-react';
import { fetchPrediction } from '../lib/api';

export const PredictionsView: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('New York');
  const [selectedDays, setSelectedDays] = useState(7);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchPrediction(selectedCity);
        
        // Check if we received predictions in the expected format
        if (Array.isArray(data)) {
          setPredictions(data);
        } else if (data && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
        } else {
          console.error('Unexpected data format:', data);
          setError('Received unexpected data format from the API');
          setPredictions([]);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load prediction data');
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCity]);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10B981';
    if (aqi <= 100) return '#F59E0B';
    if (aqi <= 150) return '#F97316';
    if (aqi <= 200) return '#EF4444';
    if (aqi <= 300) return '#8B5CF6';
    return '#7C2D12';
  };

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const displayedPredictions = predictions.slice(0, selectedDays);

  return (
    <div className="min-h-screen p-4 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Air Quality Predictions
          </h1>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <MapPin size={20} className="text-gray-500" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-gray-500" />
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3 Days</option>
                <option value={5}>5 Days</option>
                <option value={7}>7 Days</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-blue-500" />
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}
        
        {!loading && !error && predictions.length > 0 && (
          <>
            {/* Current Status Card */}
            <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 dark:from-blue-500/5 dark:to-green-500/5 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Current AQI in {selectedCity}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl font-bold" style={{ color: getAQIColor(displayedPredictions[0]?.predicted_aqi ?? 0) }}>
                      {displayedPredictions[0]?.predicted_aqi ?? '--'}
                    </span>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {displayedPredictions[0]?.predicted_aqi ? getAQICategory(displayedPredictions[0].predicted_aqi) : 'Unknown'}
                      </p>
                      <p className={`text-xs ${getConfidenceColor(displayedPredictions[0]?.confidence_score ?? 0)}`}>
                        {Math.round((displayedPredictions[0]?.confidence_score ?? 0) * 100)}% confidence
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedPredictions.map((prediction, index) => (
                <div 
                  key={index} 
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4"
                >
                  <div className="mb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(prediction.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        AQI: <span style={{ color: getAQIColor(prediction.predicted_aqi) }}>{prediction.predicted_aqi}</span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {prediction.category || getAQICategory(prediction.predicted_aqi)}
                      </p>
                    </div>
                    
                    <div 
                      className={`rounded-full h-12 w-12 flex items-center justify-center border-2 ${
                        prediction.predicted_aqi <= 100 ? 'border-green-500' : 'border-yellow-500'
                      }`}
                      style={{ backgroundColor: `${getAQIColor(prediction.predicted_aqi)}20` }}
                    >
                      {index > 0 && prediction.predicted_aqi > displayedPredictions[index-1]?.predicted_aqi ? (
                        <TrendingUp className="text-red-500" size={18} />
                      ) : index > 0 && prediction.predicted_aqi < displayedPredictions[index-1]?.predicted_aqi ? (
                        <TrendingDown className="text-green-500" size={18} />
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Confidence</span>
                      <span className={`text-xs ${getConfidenceColor(prediction.confidence_score)}`}>
                        {Math.round(prediction.confidence_score * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${prediction.confidence_score * 100}%`,
                          backgroundColor: getAQIColor(prediction.predicted_aqi)
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {!loading && !error && predictions.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800/80 p-8 rounded-xl text-center">
            <p className="text-gray-700 dark:text-gray-300">No prediction data available for {selectedCity}</p>
          </div>
        )}
      </div>
    </div>
  );
};
