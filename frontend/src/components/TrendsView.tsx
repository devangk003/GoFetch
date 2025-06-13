import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchTrends } from '../lib/api';
import { Loader } from 'lucide-react';

export const TrendsView: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('New York');
  const [timeRange, setTimeRange] = useState('7d');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [cityComparisonData, setCityComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchTrends(selectedCity, timeRange);
        
        if (Array.isArray(data)) {
          // Process and format the data if needed
          const formattedData = data.map(item => ({
            ...item,
            date: item.date || item.Date || new Date(item._id?.year, item._id?.month - 1).toISOString(),
            aqi: item.aqi || item.avgAQI || item['Daily AQI Value'] || 0
          }));
          
          setTrendData(formattedData);
        } else {
          console.error('Unexpected data format:', data);
          setError('Received unexpected data format from the API');
          setTrendData([]);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load trend data');
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    }
    
    // Also load city comparison data
    async function loadCityComparison() {
      try {
        // Cities to compare
        const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
        const comparisonData = [];
        
        for (const city of cities) {
          try {
            const data = await fetchTrends(city, '7d');
            
            if (Array.isArray(data) && data.length > 0) {
              // Calculate average AQI from the trend data
              const avgAqi = data.reduce((sum, item) => sum + (item.aqi || item.avgAQI || 0), 0) / data.length;
              const maxAqi = Math.max(...data.map(item => item.aqi || item.avgAQI || item.maxAQI || 0));
              
              comparisonData.push({
                city,
                aqi: Math.round(avgAqi),
                maxAqi: Math.round(maxAqi)
              });
            }
          } catch (cityError) {
            console.error(`Error loading data for ${city}:`, cityError);
          }
        }
        
        if (comparisonData.length > 0) {
          setCityComparisonData(comparisonData);
        }
      } catch (e) {
        console.error('Error loading city comparison:', e);
      }
    }
    
    load();
    loadCityComparison();
  }, [selectedCity, timeRange]);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10B981';
    if (aqi <= 100) return '#F59E0B';
    if (aqi <= 150) return '#F97316';
    if (aqi <= 200) return '#EF4444';
    if (aqi <= 300) return '#8B5CF6';
    return '#7C2D12';
  };

  return (
    <div className="min-h-screen p-4 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Air Quality Trends
          </h1>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="New York">New York</option>
              <option value="Los Angeles">Los Angeles</option>
              <option value="Chicago">Chicago</option>
              <option value="Houston">Houston</option>
              <option value="Phoenix">Phoenix</option>
            </select>
            
            <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-1">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
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

        {!loading && !error && trendData.length > 0 && (
          <>
            {/* Main Chart */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                AQI Trend - {selectedCity}
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(156, 163, 175, 0.7)"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="rgba(156, 163, 175, 0.7)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(229, 231, 235, 0.5)',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => [`AQI: ${value}`, 'Air Quality']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="aqi" 
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {cityComparisonData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* City Comparison Chart */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    City Comparison
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cityComparisonData} layout="vertical">
                        <CartesianGrid horizontal strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.3)" />
                        <XAxis type="number" fontSize={12} stroke="rgba(156, 163, 175, 0.7)" />
                        <YAxis 
                          dataKey="city" 
                          type="category" 
                          fontSize={12} 
                          tick={{ fill: 'rgba(156, 163, 175, 0.9)' }}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(229, 231, 235, 0.5)',
                            borderRadius: '12px',
                          }}
                        />
                        <Bar 
                          dataKey="aqi" 
                          fill="#3B82F6" 
                          label={{ 
                            position: 'right', 
                            fill: 'rgba(107, 114, 128, 0.8)',
                            fontSize: 12,
                            formatter: (value: number) => `${value}`
                          }}
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cityComparisonData.slice(0, 4).map((city) => (
                    <div 
                      key={city.city}
                      className={`bg-gradient-to-br p-6 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50`}
                      style={{ backgroundColor: `${getAQIColor(city.aqi)}15` }}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{city.city}</h3>
                      <div className="flex items-end mt-3 justify-between">
                        <div>
                          <span 
                            className="text-2xl font-bold" 
                            style={{ color: getAQIColor(city.aqi) }}
                          >
                            {city.aqi}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">AQI</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Max AQI</span>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{city.maxAqi}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {!loading && !error && trendData.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800/80 p-8 rounded-xl text-center">
            <p className="text-gray-700 dark:text-gray-300">No trend data available for {selectedCity}</p>
          </div>
        )}
      </div>
    </div>
  );
};
