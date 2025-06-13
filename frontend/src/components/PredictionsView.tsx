import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Cloud, Wind, Thermometer, Sun, AlertTriangle, Info, BarChart3,
  Droplets, BrainCircuit, Zap, Leaf, Gauge, Clock, Eye, Users, ShieldCheck, Smile, Meh, Frown, Angry, CloudFog, Waves // Added new icons
} from 'lucide-react';
import { WaqiData, fetchWaqiData, WaqiForecastDailyValue } from '../lib/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';

interface AQIInfo {
  color: string; // Tailwind background color class
  textColor: string; // Tailwind text color class
  category: string;
  icon: React.ReactNode;
  healthImplications: string;
  cautionaryStatement: string;
}

const getAQIInfo = (aqi: number): AQIInfo => {
  if (aqi <= 50) return { color: 'bg-green-500', textColor: 'text-green-700 dark:text-green-300', category: 'Good', icon: <Smile className="h-5 w-5 text-green-100" />, healthImplications: 'Air quality is considered satisfactory, and air pollution poses little or no risk.', cautionaryStatement: 'None.' };
  if (aqi <= 100) return { color: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-300', category: 'Moderate', icon: <Meh className="h-5 w-5 text-yellow-100" />, healthImplications: 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.', cautionaryStatement: 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.' };
  if (aqi <= 150) return { color: 'bg-orange-500', textColor: 'text-orange-700 dark:text-orange-300', category: 'Unhealthy for Sensitive Groups', icon: <Frown className="h-5 w-5 text-orange-100" />, healthImplications: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.', cautionaryStatement: 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.' };
  if (aqi <= 200) return { color: 'bg-red-500', textColor: 'text-red-700 dark:text-red-300', category: 'Unhealthy', icon: <Angry className="h-5 w-5 text-red-100" />, healthImplications: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.', cautionaryStatement: 'Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion; everyone else, especially children, should limit prolonged outdoor exertion.' };
  if (aqi <= 300) return { color: 'bg-purple-600', textColor: 'text-purple-700 dark:text-purple-300', category: 'Very Unhealthy', icon: <CloudFog className="h-5 w-5 text-purple-100" />, healthImplications: 'Health warnings of emergency conditions. The entire population is more likely to be affected.', cautionaryStatement: 'Active children and adults, and people with respiratory disease, such as asthma, should avoid all outdoor exertion; everyone else, especially children, should limit outdoor exertion.' };
  return { color: 'bg-maroon-700', textColor: 'text-maroon-700 dark:text-maroon-300', category: 'Hazardous', icon: <ShieldCheck className="h-5 w-5 text-maroon-100" />, healthImplications: 'Health alert: everyone may experience more serious health effects.', cautionaryStatement: 'Everyone should avoid all outdoor exertion.' };
};

interface PollutantUIDetail {
  displayName: string;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
}

const pollutantUIDetails: Record<string, PollutantUIDetail> = {
  pm25: { displayName: 'PM2.5', unit: 'µg/m³', icon: <Cloud className="h-5 w-5" />, colorClass: 'text-slate-500' },
  pm10: { displayName: 'PM10', unit: 'µg/m³', icon: <Cloud className="h-5 w-5" />, colorClass: 'text-slate-600' },
  o3: { displayName: 'Ozone (O₃)', unit: 'ppb', icon: <Sun className="h-5 w-5" />, colorClass: 'text-amber-500' },
  no2: { displayName: 'NO₂', unit: 'ppb', icon: <CloudFog className="h-5 w-5" />, colorClass: 'text-red-500' },
  so2: { displayName: 'SO₂', unit: 'ppb', icon: <CloudFog className="h-5 w-5" />, colorClass: 'text-orange-500' },
  co: { displayName: 'CO', unit: 'ppm', icon: <Zap className="h-5 w-5" />, colorClass: 'text-gray-500' },
  t: { displayName: 'Temperature', unit: '°C', icon: <Thermometer className="h-5 w-5" />, colorClass: 'text-red-600' },
  h: { displayName: 'Humidity', unit: '%', icon: <Droplets className="h-5 w-5" />, colorClass: 'text-sky-500' },
  w: { displayName: 'Wind', unit: 'm/s', icon: <Wind className="h-5 w-5" />, colorClass: 'text-cyan-500' },
  p: { displayName: 'Pressure', unit: 'hPa', icon: <Gauge className="h-5 w-5" />, colorClass: 'text-indigo-500' },
  uvi: { displayName: 'UV Index', unit: '', icon: <Eye className="h-5 w-5" />, colorClass: 'text-purple-500' }, // For UVI forecast chart
};


const PollutantCard: React.FC<{ pollutantKey: string; value?: number; }> = ({ pollutantKey, value }) => {
  const detail = pollutantUIDetails[pollutantKey];
  if (!detail) return null;

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{detail.displayName}</CardTitle>
        {React.cloneElement(detail.icon as React.ReactElement, { className: `h-5 w-5 ${detail.colorClass}` })}
      </CardHeader>
      <CardContent className="pb-4 pt-1 px-4">
        <div className={`text-2xl font-bold ${value === undefined || isNaN(Number(value)) ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
          {value !== undefined && !isNaN(Number(value)) ? Number(value).toFixed(1) : 'N/A'}
        </div>
        <p className="text-xs text-muted-foreground">{detail.unit}</p>
      </CardContent>
    </Card>
  );
};

interface ExtendedWaqiForecastDailyValue extends WaqiForecastDailyValue {
  dayShort: string;
}

const ForecastChart: React.FC<{ data: ExtendedWaqiForecastDailyValue[]; pollutantKey: keyof WaqiData['forecast']['daily'] | 'uvi'; pollutantName: string; lineColor: string }> = ({ data, pollutantName, lineColor }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No forecast data available for {pollutantName}.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600 opacity-60" />
        <XAxis dataKey="dayShort" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={11} />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '0.375rem', // rounded-md
            boxShadow: 'var(--tw-shadow)',
          }}
          labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
          itemStyle={{ color: lineColor }}
        />
        <Legend iconType="plainline" wrapperStyle={{fontSize: "12px"}} />
        <Line type="monotone" dataKey="avg" stroke={lineColor} name={`Avg ${pollutantName}`} strokeWidth={2} activeDot={{ r: 5 }} dot={{ r: 2 }} />
        <Line type="monotone" dataKey="min" stroke={lineColor} name={`Min ${pollutantName}`} strokeDasharray="2 2" strokeOpacity={0.5} dot={false} />
        <Line type="monotone" dataKey="max" stroke={lineColor} name={`Max ${pollutantName}`} strokeDasharray="2 2" strokeOpacity={0.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const getCurrentTimeInNewYork = () => {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', /* second: '2-digit', */ hour12: true,
  });
};

const getNewYorkTimeZoneAbbreviation = () => {
  const options = { timeZone: 'America/New_York', timeZoneName: 'short' } as Intl.DateTimeFormatOptions;
  const dateTimeFormat = new Intl.DateTimeFormat('en-US', options);
  const parts = dateTimeFormat.formatToParts(new Date());
  const timeZoneName = parts.find(part => part.type === 'timeZoneName');
  return timeZoneName ? timeZoneName.value : 'ET';
};

export const PredictionsView: React.FC = () => {
  const cityToFetch = 'NewYork';
  const [waqiData, setWaqiData] = useState<WaqiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeNY, setCurrentTimeNY] = useState(getCurrentTimeInNewYork());
  const [nyTimeZoneAbbr, setNyTimeZoneAbbr] = useState(getNewYorkTimeZoneAbbreviation());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTimeNY(getCurrentTimeInNewYork());
      setNyTimeZoneAbbr(getNewYorkTimeZoneAbbreviation());
    }, 60000); // Update every minute
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const loadWaqiData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // fetchWaqiData throws on errors; returns WaqiData on success
        const data = await fetchWaqiData(cityToFetch);
        setWaqiData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setWaqiData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadWaqiData();
  }, []);

  const transformForecastData = (forecastEntries?: WaqiForecastDailyValue[]): ExtendedWaqiForecastDailyValue[] | undefined => {
    return forecastEntries?.map(item => ({
      ...item,
      dayShort: new Date(item.day).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/New_York' }),
    }));
  };

  const { city, aqi, dominentpol, time, iaqi, attributions, forecast } = waqiData || {};
  const aqiInfo = aqi !== undefined ? getAQIInfo(aqi) : undefined;

  const lastUpdatedInNewYork = useMemo(() => {
    if (!time) return 'N/A';
    return time.v 
      ? new Date(time.v * 1000).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      : new Date(time.s).toLocaleString('en-US', { timeZone: 'America/New_York' });
  }, [time]);

  const transformedForecasts = useMemo(() => ({
    pm25: transformForecastData(forecast?.daily?.pm25),
    o3: transformForecastData(forecast?.daily?.o3),
    pm10: transformForecastData(forecast?.daily?.pm10),
    uvi: transformForecastData(forecast?.daily?.uvi),
  }), [forecast]);

  const pollutantKeys = useMemo(() => iaqi ? Object.keys(iaqi).filter(key => pollutantUIDetails[key]) : [], [iaqi]);
  const weatherKeys = useMemo(() => pollutantKeys.filter(key => ['t', 'h', 'w', 'p'].includes(key)), [pollutantKeys]);
  const airPollutantKeys = useMemo(() => pollutantKeys.filter(key => !weatherKeys.includes(key)), [pollutantKeys, weatherKeys]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] p-4 text-center bg-slate-50 dark:bg-slate-900">
        <BrainCircuit className="h-16 w-16 text-blue-500 mb-4 animate-pulse" />
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Forecasting Air Quality
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Our AI is analyzing the latest data for New York...
        </p>
        <Progress value={undefined} className="w-1/2 max-w-xs mt-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-160px)] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Alert variant="destructive" className="max-w-lg shadow-xl">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Data Retrieval Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p>We encountered an issue fetching air quality data for New York:</p>
            <p className="font-mono text-sm bg-red-100 dark:bg-red-900 p-2 rounded my-2">{error}</p>
            Please try refreshing the page or check back later.
          </AlertDescription>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Refresh Page</Button>
        </Alert>
      </div>
    );
  }

  if (!waqiData || !city || aqi === undefined || !aqiInfo) {
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-160px)] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Alert className="max-w-lg shadow-lg">
          <Info className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">No Data Available</AlertTitle>
          <AlertDescription className="mt-2">
            Air quality data could not be loaded for New York at this moment. This might be a temporary issue or the city might not be reporting data currently.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const forecastDisplayItems = [
    { key: 'pm25', name: 'PM2.5', data: transformedForecasts.pm25, color: '#3b82f6' },
    { key: 'o3', name: 'Ozone (O₃)', data: transformedForecasts.o3, color: '#f59e0b' },
    { key: 'pm10', name: 'PM10', data: transformedForecasts.pm10, color: '#10b981' },
    { key: 'uvi', name: 'UV Index', data: transformedForecasts.uvi, color: '#8b5cf6' },
  ] as const;


  return (
    <div className="min-h-[calc(100vh-120px)] p-3 md:p-6 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100">
            Air Quality Forecast: <span className="text-blue-600 dark:text-blue-400">{city.name}</span>
          </h1>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
            <Clock size={13} className="inline mr-1.5" /> 
            <span>{currentTimeNY} ({nyTimeZoneAbbr})</span>
            <span className="mx-2">|</span>
            <Calendar size={13} className="inline mr-1.5" />
            <span>Last updated: {lastUpdatedInNewYork} ({getNewYorkTimeZoneAbbreviation()})</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column: AQI & Health Info */}
          <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <Card className={`shadow-xl ${aqiInfo.color} text-white overflow-hidden`}>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-xl font-semibold flex items-center">
                  {aqiInfo.icon} <span className="ml-2">{aqiInfo.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-6xl font-bold my-1">{aqi}</div>
                <div className="text-sm opacity-90">US AQI {dominentpol && `(Dominant: ${dominentpol.toUpperCase()})`}</div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-white dark:bg-slate-800">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                  <Users size={20} className="mr-2 text-blue-500" /> Health Implications
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">
                <p>{aqiInfo.healthImplications}</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-white dark:bg-slate-800">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                  <ShieldCheck size={20} className="mr-2 text-green-500" /> Cautionary Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">
                <p>{aqiInfo.cautionaryStatement}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Pollutants & Forecasts */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Air Pollutants Section */}
            {airPollutantKeys.length > 0 && (
              <Card className="shadow-lg bg-white dark:bg-slate-800">
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                    <Leaf size={22} className="mr-2 text-green-600 dark:text-green-400" /> Air Pollutants
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 p-4">
                  {airPollutantKeys.map(key => (
                    <PollutantCard key={key} pollutantKey={key} value={iaqi[key]?.v} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Weather Section */}
            {weatherKeys.length > 0 && (
              <Card className="shadow-lg bg-white dark:bg-slate-800">
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                    <Waves size={22} className="mr-2 text-sky-500" /> Weather Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4">
                  {weatherKeys.map(key => (
                    <PollutantCard key={key} pollutantKey={key} value={iaqi[key]?.v} />
                  ))}
                </CardContent>
              </Card>
            )}
            
            {/* Forecast Section */}
            <Card className="shadow-lg bg-white dark:bg-slate-800">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                   <BarChart3 size={22} className="mr-2 text-indigo-500" /> 7-Day Forecasts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {forecastDisplayItems.map(item => 
                  item.data && item.data.length > 0 ? (
                    <div key={item.key}>
                      <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">{item.name}</h4>
                      <ForecastChart data={item.data} pollutantKey={item.key as any} pollutantName={item.name} lineColor={item.color} />
                    </div>
                  ) : null
                )}
                {forecastDisplayItems.every(item => !item.data || item.data.length === 0) && (
                   <p className="text-muted-foreground text-center py-4">Detailed forecast charts are not available at this time.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {attributions && attributions.length > 0 && (
          <footer className="mt-8 md:mt-12 pt-6 border-t border-slate-300 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Air quality data provided by:</p>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
              {attributions.map((attr, index) => (
                <a key={index} href={attr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors">
                  {attr.logo && <img src={attr.logo.startsWith('http') ? attr.logo : `https://www.iqair.com/assets/aqi/logo/${attr.logo}`} alt={`${attr.name} logo`} className="inline h-4 mr-1.5 align-middle" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                  {attr.name}
                </a>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Data is for informational purposes only. Consult official sources for health decisions.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};
