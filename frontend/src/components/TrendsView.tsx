import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTrendsData } from '../lib/queries'; // Assuming this hook exists and works
import { Loader, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'; // Assuming these are ShadCN UI components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; // Assuming ShadCN Select

const AQI_LEVELS = [
	{ limit: 50, color: 'bg-green-500', textColor: 'text-green-700', label: 'Good' },
	{ limit: 100, color: 'bg-yellow-500', textColor: 'text-yellow-700', label: 'Moderate' },
	{ limit: 150, color: 'bg-orange-500', textColor: 'text-orange-700', label: 'Unhealthy for Sensitive Groups' },
	{ limit: 200, color: 'bg-red-500', textColor: 'text-red-700', label: 'Unhealthy' },
	{ limit: 300, color: 'bg-purple-500', textColor: 'text-purple-700', label: 'Very Unhealthy' },
	{ limit: Infinity, color: 'bg-fuchsia-800', textColor: 'text-fuchsia-900', label: 'Hazardous' },
];

const getAqiStyling = (aqi: number | undefined) => {
	if (aqi === undefined || isNaN(aqi)) return AQI_LEVELS[0]; // Default to 'Good' or a neutral style if undefined
	const level = AQI_LEVELS.find(l => aqi <= l.limit);
	return level || AQI_LEVELS[AQI_LEVELS.length - 1];
};


export const TrendsView: React.FC = () => {
	const [timeRange, setTimeRange] = useState('30d'); // Default to 30 days
	const selectedCity = 'New York'; // Hardcoded for now

	const { 
		data: trendDataResponse, 
		isLoading, 
		error 
	} = useTrendsData(selectedCity, timeRange);

	const formattedTrendData = useMemo(() => {
		if (!trendDataResponse || !Array.isArray(trendDataResponse.data)) return [];
		
		return trendDataResponse.data.map((item: any) => ({
			date: new Date(item.date || item.Date || item._id?.date || (item._id && new Date(item._id.year, item._id.month -1, item._id.day))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			aqi: Math.round(item.aqi || item.avgAQI || item['Daily AQI Value'] || 0),
		})).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	}, [trendDataResponse]);

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			const styling = getAqiStyling(data.aqi);
			return (
				<div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
					<p className="label text-sm font-semibold text-gray-700 dark:text-gray-300">{`Date: ${label}`}</p>
					<p className={`text-sm font-bold ${styling.textColor}`}>{`AQI: ${data.aqi}`}</p>
					<p className={`text-xs ${styling.textColor}`}>{styling.label}</p>
				</div>
			);
		}
		return null;
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-200px)]">
				<Loader className="h-12 w-12 animate-spin text-blue-600" />
				<p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading air quality trends...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4 text-center">
				<AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
				<h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">Failed to Load Data</h2>
				<p className="text-gray-700 dark:text-gray-300 mb-1">
					There was an issue fetching the air quality trends for {selectedCity}.
				</p>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
					Error: {error instanceof Error ? error.message : 'Unknown error'}
				</p>
				<button 
					onClick={() => window.location.reload()} 
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Try Again
				</button>
			</div>
		);
	}
	
	const yAxisDomain = useMemo(() => {
		if (!formattedTrendData || formattedTrendData.length === 0) return [0, 100];
		const maxAqi = Math.max(...formattedTrendData.map(d => d.aqi), 0);
		return [0, Math.max(maxAqi + 20, 50)]; // Ensure a minimum upper bound for small AQI values
	}, [formattedTrendData]);


	return (
		<div className="p-4 md:p-6 lg:p-8 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
			<header className="mb-8">
				<h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
					Air Quality Trends for {selectedCity}
				</h1>
				<p className="text-md text-gray-600 dark:text-gray-400 mt-1">
					Visualize historical air quality data and identify patterns.
				</p>
			</header>

			<Card className="mb-8 bg-white dark:bg-gray-800 shadow-xl">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-xl font-semibold text-gray-700 dark:text-gray-300">
						AQI Trend ({timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : timeRange === '90d' ? 'Last 90 Days' : timeRange === '1y' ? 'Last Year' : 'All Time'})
					</CardTitle>
					<div className="w-40">
						<Select value={timeRange} onValueChange={setTimeRange}>
							<SelectTrigger className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-md border-gray-200/50 dark:border-gray-600/50">
								<SelectValue placeholder="Select time range" />
							</SelectTrigger>
							<SelectContent className="bg-white dark:bg-gray-800">
								<SelectItem value="7d">Last 7 Days</SelectItem>
								<SelectItem value="30d">Last 30 Days</SelectItem>
								<SelectItem value="90d">Last 90 Days</SelectItem>
								<SelectItem value="1y">Last Year</SelectItem>
								<SelectItem value="all">All Time</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					{formattedTrendData && formattedTrendData.length > 0 ? (
						<ResponsiveContainer width="100%" height={400}>
							<LineChart data={formattedTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
								<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} className="stroke-gray-300 dark:stroke-gray-700" />
								<XAxis 
									dataKey="date" 
									tick={{ fontSize: 12, fill: 'currentColor' }} 
									className="text-gray-600 dark:text-gray-400"
									// Consider adding tickFormatter for better date display if needed
								/>
								<YAxis 
									tick={{ fontSize: 12, fill: 'currentColor' }} 
									className="text-gray-600 dark:text-gray-400"
									domain={yAxisDomain}
									allowDataOverflow={true}
								/>
								<Tooltip content={<CustomTooltip />} />
								<Line 
									type="monotone" 
									dataKey="aqi" 
									stroke="#3b82f6" // Blue color for the line
									strokeWidth={2} 
									dot={{ r: 3, fill: '#3b82f6' }} 
									activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} 
								/>
							</LineChart>
						</ResponsiveContainer>
					) : (
						<div className="flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
							<AlertTriangle className="h-12 w-12 mb-4 text-yellow-500" />
							<p className="text-lg">No trend data available for the selected period.</p>
							<p className="text-sm">Try selecting a different time range.</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Placeholder for future additional trend analyses or pollutant-specific charts */}
			{/* 
			<Card className="mt-8 bg-white dark:bg-gray-800 shadow-xl">
				<CardHeader>
					<CardTitle className="text-xl font-semibold text-gray-700 dark:text-gray-300">Additional Insights</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-gray-600 dark:text-gray-400">
						More detailed trend analyses and breakdowns by pollutant will be available here in the future.
					</p>
				</CardContent>
			</Card>
			*/}
			
			{/* 
				// City Comparison Chart - Temporarily Commented Out
				<div className="mt-12">
					<h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">City AQI Comparison (Average - Last 7 Days)</h2>
					{cityComparisonData.length > 0 ? (
						<ResponsiveContainer width="100%" height={400}>
							<BarChart data={cityComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
								<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
								<XAxis type="number" tick={{ fontSize: 12 }} />
								<YAxis dataKey="city" type="category" tick={{ fontSize: 12 }} width={80} />
								<Tooltip />
								<Bar dataKey="aqi" name="Average AQI" unit=" AQI">
									{cityComparisonData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={getAQIColor(entry.aqi)} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<p className="text-gray-600 dark:text-gray-400">Loading city comparison data or no data available...</p>
					)}
				</div> 
			*/}
		</div>
	);
};

export default TrendsView;
