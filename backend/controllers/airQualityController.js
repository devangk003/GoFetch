const AirQualityModel = require('../models/AirQuality');
const axios = require('axios');
const chrono = require('chrono-node'); // Import chrono-node
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Define a list of known pollutants/measures for keyword spotting
const KNOWN_POLLUTANTS = {
    "pm2.5": "Fine particles (PM 2.5)",
    "pm 2.5": "Fine particles (PM 2.5)",
    "fine particles": "Fine particles (PM 2.5)",
    "ozone": "Ozone (O3)",
    "o3": "Ozone (O3)",
    "nitrogen dioxide": "Nitrogen dioxide (NO2)",
    "no2": "Nitrogen dioxide (NO2)",
    "carbon monoxide": "Carbon Monoxide (CO)", // Assuming CO might be in data
    "co": "Carbon Monoxide (CO)",
    "sulfur dioxide": "Sulfur Dioxide (SO2)", // Assuming SO2 might be in data
    "so2": "Sulfur Dioxide (SO2)"
};

const RELATIVE_TERMS = {
    highest: { sortOrder: -1, limit: 1 },
    max: { sortOrder: -1, limit: 1 },
    maximum: { sortOrder: -1, limit: 1 },
    peak: { sortOrder: -1, limit: 1 },
    top: { sortOrder: -1, limit: 5 }, // top 5
    worst: { sortOrder: -1, limit: 1 }, // worst air quality often means highest pollutant value
    lowest: { sortOrder: 1, limit: 1 },
    min: { sortOrder: 1, limit: 1 },
    minimum: { sortOrder: 1, limit: 1 },
    best: { sortOrder: 1, limit: 1 }, // best air quality often means lowest pollutant value
    cleanest: { sortOrder: 1, limit: 1 },
};

class AirQualityController {
    
    async getAllData(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                sortBy = 'Start_Date', // Default to new date field
                sortOrder = -1,
                startDate, // Will be mapped to Start_Date in model
                endDate,   // Will be mapped to Start_Date in model
                location,  // New general location filter for Geo Place Name
                minDataValue, // Was minAQI
                maxDataValue  // Was maxAQI
            } = req.query;

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            const options = {
                page: pageNum,
                limit: limitNum,
                sortBy,
                sortOrder: parseInt(sortOrder),
                startDate,
                endDate,
                location,
                minDataValue,
                maxDataValue
            };

            const result = await AirQualityModel.findAll({}, options);

            res.json({
                success: true,
                message: 'Data retrieved successfully',
                ...result
            });

        } catch (error) {
            console.error('Error in getAllData:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    async getDataById(req, res) {
        try {
            const { id } = req.params;
            const data = await AirQualityModel.findById(id);

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Record not found'
                });
            }
            res.json({ success: true, message: 'Record retrieved successfully', data });
        } catch (error) {
            console.error('Error in getDataById:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // GET /api/v1/air-quality/search?q=searchTerm (Text search via query param)
    async searchData(req, res) { // This is the GET search
        try {
            const { 
                q: searchTerm, 
                page = 1, 
                limit = 20,
                sortBy = 'Start_Date',
                sortOrder = -1,
                startDate,
                endDate,
                location, // For Geo Place Name
                measure,  // For Measure (pollutant)
                minDataValue,
                maxDataValue
            } = req.query;

            if (!searchTerm) {
                return res.status(400).json({ success: false, message: 'Search term is required' });
            }

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            const searchOptions = {
                page: pageNum,
                limit: limitNum,
                sortBy,
                sortOrder: parseInt(sortOrder),
                startDate,
                endDate,
                location,
                measure,
                minDataValue,
                maxDataValue
            };
            
            const result = await AirQualityModel.search(searchTerm, searchOptions);
            res.json({ success: true, message: 'Search completed successfully', ...result });

        } catch (error) {
            console.error('Error in searchData (GET):', error);
            res.status(500).json({ success: false, message: 'Search failed', error: error.message });
        }
    }
    
    // POST /api/v1/air-quality/search (Advanced text search with body parameters)
    async postSearchData(req, res) { // This is the POST search
        try {
            const { 
                query: searchTerm, 
                filters = {}, // Filters like location, measure, dateRange, valueRange
                page = 1, 
                limit = 20,
                sortBy = 'Start_Date',
                sortOrder = -1 
            } = req.body;

            if (!searchTerm && Object.keys(filters).length === 0) {
                return res.status(400).json({ success: false, message: 'Search query or filters are required' });
            }

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            
            const searchOptions = {
                page: pageNum,
                limit: limitNum,
                sortBy,
                sortOrder: parseInt(sortOrder),
                startDate: filters.startDate,
                endDate: filters.endDate,
                location: filters.location, // for Geo Place Name
                measure: filters.measure,   // for Measure (pollutant)
                minDataValue: filters.minDataValue,
                maxDataValue: filters.maxDataValue,
                ...filters // Spread any other specific filters from the body
            };
            
            // If searchTerm is provided, use it for text search, otherwise use findAll with filters
            const result = searchTerm ? 
                await AirQualityModel.search(searchTerm, searchOptions) :
                await AirQualityModel.findAll({}, searchOptions); // Corrected: Pass empty query, use filters from searchOptions


            res.json({
                success: true,
                message: 'Advanced search completed successfully',
                search_term: searchTerm,
                filters_applied: searchOptions,
                ...result
            });

        } catch (error) {
            console.error('Error in postSearchData (POST):', error);
            res.status(500).json({ success: false, message: 'Advanced search failed', error: error.message });
        }
    }


    // GET /api/v1/air-quality/geo (Simplified)
    async getGeoData(req, res) {
        try {
            // This is simplified as Lat/Lon are not in the new schema
            // It returns distinct locations and their latest reading.
            const data = await AirQualityModel.getGeoData();
            res.json({
                success: true,
                message: 'Simplified geographic data (distinct locations) retrieved successfully',
                data,
                count: data.length
            });
        } catch (error) {
            console.error('Error in getGeoData (simplified):', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve geographic data', error: error.message });
        }
    }

    // GET /api/v1/air-quality/statistics
    async getStatistics(req, res) {
        try {
            const { timeframe = 'all' } = req.query; // e.g., week, month, year
            const validTimeframes = ['all', 'week', 'month', 'year'];
            if (!validTimeframes.includes(timeframe)) {
                return res.status(400).json({ success: false, message: 'Invalid timeframe.' });
            }
            const stats = await AirQualityModel.getStatistics(timeframe);
            res.json({ success: true, message: 'Statistics retrieved successfully', data: stats, timeframe });
        } catch (error) {
            console.error('Error in getStatistics:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve statistics', error: error.message });
        }
    }

    // GET /api/v1/air-quality/trends
    async getMonthlyTrends(req, res) {
        try {
            const { year } = req.query; // Optional: filter by a specific year
            const trends = await AirQualityModel.getMonthlyTrends(year);
            res.json({ success: true, message: 'Monthly trends retrieved successfully', data: trends, year: year || 'all years' });
        } catch (error) {
            console.error('Error in getMonthlyTrends:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve trends', error: error.message });
        }
    }
    
    // GET /api/v1/air-quality/by-location/:location (Was getDataByState)
    async getDataByLocation(req, res) { // Renamed from getDataByState
        try {
            const { location } = req.params; // Using 'location' for Geo Place Name
            const {
                page = 1,
                limit = 20,
                sortBy = 'Start_Date',
                sortOrder = -1
            } = req.query;

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

            const options = {
                page: pageNum,
                limit: limitNum,
                sortBy,
                sortOrder: parseInt(sortOrder)
            };
            // Using the refactored model method
            const result = await AirQualityModel.getByGeoPlaceName(location, options); 

            res.json({
                success: true,
                message: `Data for location ${location} retrieved successfully`,
                location,
                ...result
            });

        } catch (error) {
            console.error('Error in getDataByLocation:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve location-specific data', error: error.message });
        }
    }

    // GET /api/v1/air-quality/high-value-events (Was getHighPollutionEvents)
    async getHighValueEvents(req, res) { // Renamed
        try {
            const { threshold = 100, page = 1, limit = 20 } = req.query; // Threshold for Data Value

            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const thresholdNum = parseFloat(threshold);

            const options = { page: pageNum, limit: limitNum };
            // Using the refactored model method
            const result = await AirQualityModel.getHighValueEvents(thresholdNum, options); 

            res.json({
                success: true,
                message: `High value events (Data Value > ${thresholdNum}) retrieved successfully`,
                threshold: thresholdNum,
                ...result
            });

        } catch (error) {
            console.error('Error in getHighValueEvents:', error);
            res.status(500).json({ success: false, message: 'Failed to retrieve high value events', error: error.message });
        }
    }
    
    // GET /api/v1/air-quality/health-check
    async healthCheck(req, res) {
        try {
            const stats = await AirQualityModel.getStatistics(); // Basic check
            res.json({
                success: true,
                message: 'API is healthy',
                timestamp: new Date().toISOString(),
                database_status: 'connected', // Assumed if getStatistics works
                total_records_in_stat_sample: stats.totalRecords || 0,
            });
        } catch (error) {
            res.status(503).json({ success: false, message: 'Service unavailable', error: error.message });
        }
    }

    // POST /api/v1/air-quality/nlp-search - NLP-powered search using Gemini API
    async nlpSearch(req, res) {
        try {
            const { query } = req.body;
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

            if (!query) {
                return res.status(400).json({ success: false, message: 'Natural language query is required' });
            }
            if (!GEMINI_API_KEY) {
                console.error('Gemini API key not configured.');
                return res.status(500).json({ success: false, message: 'NLP service not configured (Gemini Key Missing)' });
            }

            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Or your preferred Gemini model

            const currentDate = new Date().toISOString();

            // Define the schema of your airQuality collection for the prompt
            const schemaDescription = `
                MongoDB Collection: airQuality
                Fields:
                - _id: ObjectId (Primary key)
                - Unique ID: String (Original unique ID from dataset)
                - Indicator ID: Number (e.g., 365 for PM2.5, 38 for Ozone)
                - Name: String (Pollutant name, e.g., "Fine particles (PM 2.5)", "Ozone (O3)", "Nitrogen dioxide (NO2)")
                - Measure: String (Type of measurement, e.g., "Mean", "Max")
                - Measure Info: String (Units, e.g., "mcg/m3", "ppb")
                - Geo Type Name: String (Type of geographical area, e.g., "CD" for Community District, "Borough", "UHF42")
                - Geo Join ID: Number (ID for the geographical area)
                - Geo Place Name: String (Name of the location, e.g., "Greenpoint (CD1)", "Financial District (CD1)", "Rockaway and Broad Channel (CD14)")
                - Time Period: String (Description of the time period, e.g., "Annual Average 2020", "Winter 2020-21", "Summer 2021")
                - Start_Date: ISODate (The start date of the data record, crucial for date filtering. Format: YYYY-MM-DDTHH:mm:ss.sssZ)
                - Data Value: Number (The actual air quality data value)
                
                When filtering by 'Geo Place Name', use a case-insensitive regex match if the user provides a partial name or doesn't include parenthetical details like "(CD14)".
                For example, if user says "Greenpoint", the filter for "Geo Place Name" should be { "$regex": "Greenpoint", "$options": "i" }.
                If user says "Rockaway and Broad Channel", the filter for "Geo Place Name" should be { "$regex": "Rockaway and Broad Channel", "$options": "i" }.
                If user specifies a pollutant like "PM2.5", filter on the "Name" field (e.g., "Fine particles (PM 2.5)")
                If user specifies "ozone" or "O3", filter on "Name" field for "Ozone (O3)".
                If user specifies "nitrogen dioxide" or "NO2", filter on "Name" field for "Nitrogen dioxide (NO2)".
            `;

            // Few-shot examples
            const examples = `
                Example 1:
                User Query: "PM2.5 in Greenpoint last March"
                Current Date: "${currentDate}" 
                Expected MongoDB Filter (JSON):
                {
                  "Name": "Fine particles (PM 2.5)",
                  "Geo Place Name": { "$regex": "Greenpoint", "$options": "i" },
                  "Start_Date": { 
                    "$gte": /* ISODate for start of last March */, 
                    "$lte": /* ISODate for end of last March */ 
                  }
                }
                (Note: Gemini should calculate the actual ISODates for 'last March' based on the Current Date. If current date is 2025-06-13, last March is March 2025.)

                Example 2:
                User Query: "highest ozone in Financial District during summer 2021"
                Current Date: "${currentDate}"
                Expected MongoDB Filter (JSON): 
                {
                  "Name": "Ozone (O3)",
                  "Geo Place Name": { "$regex": "Financial District", "$options": "i" },
                  "Time Period": { "$regex": "Summer 2021", "$options": "i" }
                }
                (Note: For 'highest', the sorting will be handled separately, just provide the filter)

                Example 3:
                User Query: "Data for Rockaway and Broad Channel (CD14) for December 2020"
                Current Date: "${currentDate}"
                Expected MongoDB Filter (JSON):
                {
                  "Geo Place Name": { "$regex": "Rockaway and Broad Channel (CD14)", "$options": "i" },
                  "Start_Date": {
                    "$gte": "2020-12-01T00:00:00.000Z",
                    "$lte": "2020-12-31T23:59:59.999Z"
                  }
                }
            `;

            const prompt = `
                You are an expert at converting natural language queries into MongoDB query filter objects.
                Based on the user's query, the provided MongoDB collection schema, and the current date, generate a valid JSON object that can be used as a filter in a MongoDB find() operation.
                The current date is: ${currentDate}. Use this to resolve relative dates like "last month", "yesterday", "next year".
                Ensure all date strings in the output are valid ISODate strings (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ").
                For month-only queries (e.g., "December 2020"), the date range should span the entire month.
                If a user query implies sorting (e.g., "highest", "lowest", "most recent"), do NOT include sort parameters in the filter object. Sorting will be handled separately. Just provide the filter criteria.
                If the user query is too vague or does not provide enough information to form a specific filter, return an empty JSON object {}.

                Schema:
                ${schemaDescription}

                Examples:
                ${examples}

                User Query: "${query}"
                MongoDB Filter (JSON):
            `;

            console.log("[GEMINI DEBUG] Prompt being sent to Gemini:", prompt); // For debugging

            let geminiResponseText = '';
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                geminiResponseText = response.text();
            } catch (geminiError) {
                console.error('Gemini API Error:', geminiError);
                return res.status(500).json({ success: false, message: 'Error calling Gemini NLP service.', error: geminiError.message });
            }
            
            console.log("[GEMINI DEBUG] Raw response text from Gemini:", geminiResponseText);

            let mongoFilter = {};
            try {
                // Gemini might wrap the JSON in backticks or add "json" prefix
                // More robust cleaning for newlines and markdown code blocks
                let cleanedResponse = geminiResponseText.trim();
                if (cleanedResponse.startsWith("```json")) {
                    cleanedResponse = cleanedResponse.substring(7);
                } else if (cleanedResponse.startsWith("```")) {
                    cleanedResponse = cleanedResponse.substring(3);
                }
                if (cleanedResponse.endsWith("```")) {
                    cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
                }
                cleanedResponse = cleanedResponse.trim();
                
                mongoFilter = JSON.parse(cleanedResponse);
                console.log("[GEMINI DEBUG] Parsed MongoDB filter from Gemini:", mongoFilter);
            } catch (parseError) {
                console.error('Error parsing MongoDB filter from Gemini response:', parseError);
                console.error('[GEMINI DEBUG] Failed to parse this text from Gemini:', geminiResponseText);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error parsing NLP response. The AI returned a malformed filter.',
                    rawResponse: geminiResponseText 
                });
            }

            // Basic validation: ensure it's an object
            if (typeof mongoFilter !== 'object' || mongoFilter === null) {
                console.error('[GEMINI DEBUG] Gemini returned a non-object filter:', mongoFilter);
                return res.status(500).json({ 
                    success: false, 
                    message: 'NLP service returned an invalid filter format.',
                    returnedFilter: mongoFilter
                });
            }
            
            // --- Pagination and Sorting (can be adapted from your previous nlpSearch) ---
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            // Default sort or allow user to specify via query params (e.g., ?sortBy=Data Value&sortOrder=desc)
            // For "highest X" type queries, Gemini won't add sort, so we might need separate logic
            // or instruct Gemini to also suggest sort fields if the query implies it.
            // For now, let's use a default sort or allow client to specify.
            const sortBy = req.query.sortBy || 'Start_Date'; 
            const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

            const searchOptions = {
                page: page,
                limit: limit,
                sortBy: sortBy,
                sortOrder: sortOrder,
                // We are not passing specific filter fields like location, startDate to AirQualityModel.findAll
                // as mongoFilter from Gemini should contain all necessary query conditions.
            };
            
            // If Gemini identified a "highest" or "lowest" type query, we might need to adjust sortBy and sortOrder here.
            // This part requires more sophisticated handling or clearer instructions to Gemini.
            // For example, if the original query was "highest PM2.5", we should sort by "Data Value" descending.
            // This logic is NOT yet implemented here and would be an enhancement.

            console.log(`[GEMINI DEBUG] Using filter for MongoDB: ${JSON.stringify(mongoFilter)}`);
            console.log(`[GEMINI DEBUG] Using options for MongoDB: ${JSON.stringify(searchOptions)}`);

            // Use findAll with the Gemini-generated filter.
            // The 'searchTerm' (first param) for AirQualityModel.search is not directly applicable here
            // unless Gemini also provides a general search term.
            // We'll use findAll which is more suited for applying a filter object.
            const searchResult = await AirQualityModel.findAll(mongoFilter, searchOptions);

            res.json({
                success: true,
                message: 'NLP query processed using Gemini API.',
                originalQuery: query,
                geminiRawResponse: geminiResponseText, // For debugging
                interpretedMongoFilter: mongoFilter,
                data: searchResult.data,
                pagination: searchResult.pagination
            });

        } catch (error) {
            console.error('Error in nlpSearch (Gemini):', error);
            // Avoid sending detailed internal errors or stack traces to the client in production
            const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'NLP search failed due to an internal error.';
            res.status(500).json({ success: false, message: 'NLP search failed', error: errorMessage });
        }
    }
    
    // GET /api/v1/air-quality/date-range (This might be redundant if getAllData and search cover it)
    async getDataByDateRange(req, res) {
        try {
            const { startDate, endDate, limit = 100, location } = req.query; // location for Geo Place Name
            
            if (!startDate || !endDate) {
                return res.status(400).json({ success: false, message: 'Both startDate and endDate are required' });
            }

            const filter = {
                Start_Date: { $gte: new Date(startDate), $lte: new Date(endDate) } // Changed from Date
            };
            if (location) {
                filter['Geo Place Name'] = new RegExp(location, 'i'); // Changed from City
            }

            const data = await AirQualityModel.findAll(filter, { limit: parseInt(limit), sortBy: 'Start_Date', sortOrder: 1 });


            res.json({
                success: true,
                message: 'Date range data retrieved successfully',
                data: data.data, // Accessing data from findAll's structure
                count: data.pagination.total,
                dateRange: { startDate, endDate }
            });

        } catch (error) {
            console.error('Error in getDataByDateRange:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // GET /api/v1/air-quality/recent (This might be redundant)
    async getRecentData(req, res) {
        try {
            const { days = 30, limit = 100, location } = req.query; // location for Geo Place Name
            
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));

            const filter = { Start_Date: { $gte: daysAgo } }; // Changed from Date
            if (location) {
                filter['Geo Place Name'] = new RegExp(location, 'i'); // Changed from City
            }

            const data = await AirQualityModel.findAll(filter, { limit: parseInt(limit), sortBy: 'Start_Date', sortOrder: -1 });

            res.json({
                success: true,
                message: `Recent ${days} days data retrieved successfully`,
                data: data.data, // Accessing data from findAll's structure
                count: data.pagination.total,
                daysBack: parseInt(days)
            });

        } catch (error) {
            console.error('Error in getRecentData:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
    
    // Placeholder for AI predictions - to be refined or replaced
    async predictAirQuality(req, res) {
        try {
            const { location } = req.params; 
            const { days = 7 } = req.query; // OpenWeatherMap provides ~4 days of hourly forecast
            const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_TOKEN; // Corrected to match typical .env naming

            if (!location) {
                return res.status(400).json({ success: false, message: 'Location parameter is required' });
            }
            if (!OPENWEATHERMAP_API_KEY) {
                console.error('OpenWeatherMap API key not configured.');
                return res.status(500).json({ success: false, message: 'Prediction service not configured' });
            }

            // --- Geocoding Step (Simplified for NYC) ---
            // In a real app, you\'d geocode the \'location\' string to lat/lon.
            // Or, if \'location\' is a known Geo Place Name, have a mapping.
            // For this example, we\'ll use a representative lat/lon for NYC.
            // This should be improved for specific locations.
            const nycCoordinates = { lat: 40.7128, lon: -74.0060 }; 
            // TODO: Implement a proper geocoding solution or lookup for \'location\'
            console.log(`[PREDICT DEBUG] Using representative NYC coordinates for location: ${location}`);

            const forecastUrl = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${nycCoordinates.lat}&lon=${nycCoordinates.lon}&appid=${OPENWEATHERMAP_API_KEY}`;
            
            let owmResponse;
            try {
                owmResponse = await axios.get(forecastUrl);
            } catch (owmError) {
                console.error('OpenWeatherMap API Error:', owmError.response ? owmError.response.data : owmError.message);
                let errorMessage = 'Error calling prediction service.';
                if (owmError.response && owmError.response.status === 401) {
                    errorMessage = 'Prediction service authentication failed. Check API key.';
                } else if (owmError.response && owmError.response.data && owmError.response.data.message) {
                    errorMessage = `Prediction service error: ${owmError.response.data.message}`;
                }
                return res.status(500).json({ success: false, message: errorMessage });
            }

            if (!owmResponse.data || !owmResponse.data.list) {
                return res.status(500).json({ success: false, message: 'Prediction service returned invalid data format.' });
            }

            // Transform OpenWeatherMap forecast data to a simpler format
            const predictions = owmResponse.data.list.map(item => ({
                date_timestamp: item.dt, // Unix timestamp, UTC
                date_iso: new Date(item.dt * 1000).toISOString(),
                aqi: item.main.aqi, // Air Quality Index (1-5)
                components: { // Raw pollutant concentrations in μg/m³
                    co: item.components.co,
                    no: item.components.no,
                    no2: item.components.no2,
                    o3: item.components.o3,
                    so2: item.components.so2,
                    pm2_5: item.components.pm2_5,
                    pm10: item.components.pm10,
                    nh3: item.components.nh3,
                }
            }));
            
            // The API returns hourly data for several days. We can limit it if needed.
            // The \'days\' parameter from query isn\'t directly used here as OWM returns a fixed forecast length.
            // We can filter or select a subset if required. For now, return all available forecast points.

            res.json({
                success: true,
                message: `Air quality predictions retrieved for ${location} (using general NYC area)`,
                location_used_for_forecast: location,
                coordinates_used: nycCoordinates,
                prediction_source: 'OpenWeatherMap Air Pollution API',
                forecast_points: predictions.length,
                predictions: predictions,
            });

        } catch (error) {
            console.error('Error in predictAirQuality:', error);
            res.status(500).json({ success: false, message: 'Prediction generation failed', error: error.message });
        }
    }

    // Helper for placeholder predictions (can be removed or kept for fallback
    generateSimplePredictions(historicalData, numDays) {
        const predictions = [];
        if (historicalData.length === 0) return predictions;

        // Use the most recent data point's value as a naive forecast
        const lastValue = historicalData[0]['Data Value']; // Assuming sorted descending by date
        const lastDate = new Date(historicalData[0]['Start_Date']);

        for (let i = 1; i <= numDays; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            predictions.push({
                date: nextDate.toISOString().split('T')[0],
                predicted_value: lastValue 
                // Add more sophisticated logic here, e.g., simple linear regression or moving average
            });
        }
        return predictions;
    }
}

module.exports = new AirQualityController();
