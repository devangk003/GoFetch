const database = require('../database/connection');

class AirQualityModel {
    constructor() {
        this.collection = null;
    }
    async initialize() {
        this.collection = database.getCollection();
        await this.ensureIndexes();
    }

    // Ensure necessary (non-conflicting) indexes exist
    async ensureIndexes() {
        try {
            // The text_search_index is assumed to exist in Atlas with the correct definition
            // for fields: Geo Place Name, Measure, Message, Name.
            // We don't try to create it here to avoid conflicts.

            // Index: { 'Geo Place Name': 1, 'Start_Date': -1 }
            // This already exists in Atlas as 'Geo Place Name_1_Start_Date_-1'.
            // So, we comment out its creation here to avoid warnings/conflicts.
            // await this.collection.createIndex({ 'Geo Place Name': 1, 'Start_Date': -1 }, { background: true, name: "geo_start_date_idx" });

            // Index: { 'Data Value': 1 }
            // This already exists in Atlas as 'data_value_index'.
            // So, we comment out its creation here.
            // await this.collection.createIndex({ 'Data Value': 1 }, { background: true, name: "data_value_idx" });

            // Index: { 'Start_Date': -1 }
            // This is for general sorting/filtering by Start_Date.
            // Let's ensure it exists with a specific name if not already present with this name.
            await this.collection.createIndex({ 'Start_Date': -1 }, { background: true, name: "start_date_desc_idx" });

            // Index: { 'Geo Place Name': 1 }
            // This already exists as 'place_name_index'.
            // await this.collection.createIndex({ 'Geo Place Name': 1 }, { background: true, name: "geo_place_name_idx" });

            // Index: { 'Name': 1 } (for Indicator Name)
            // This already exists as 'indicator_name_index'.
            // await this.collection.createIndex({ 'Name': 1 }, { background: true, name: "indicator_name_idx" });

            // Index: { 'Geo Join ID': 1 }
            // This already exists as 'geographic_id_index'.
            // await this.collection.createIndex({ 'Geo Join ID': 1 }, { background: true, name: "geo_join_id_idx" });


            console.log('✅ Index check complete. Application relies on existing Atlas-managed indexes or creates specifically named ones if absent.');
        } catch (error) {
            if (error.codeName === 'IndexOptionsConflict' || error.codeName === 'IndexKeySpecsConflict' || error.message.includes("already exists with the same options") || error.message.includes("already exists with different options")) {
                console.warn(`⚠️ Index notice (likely already exists or name mismatch): ${error.message}`);
            } else {
                console.error('❌ Error creating/ensuring indexes:', error.message);
            }
        }
    }

    // Get all air quality data with pagination and filtering
    async findAll(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'Start_Date', // Changed from 'Date'
            sortOrder = -1,
            startDate, // Maps to Start_Date
            endDate,   // Maps to Start_Date
            location,  // New general location filter, maps to Geo Place Name
            minDataValue, // Changed from minAQI
            maxDataValue  // Changed from maxAQI
        } = options;

        const query = {};

        if (startDate || endDate) {
            query.Start_Date = {}; // Changed from Date
            if (startDate) query.Start_Date.$gte = new Date(startDate);
            if (endDate) query.Start_Date.$lte = new Date(endDate);
        }

        if (location) { // Changed from state filter
            query['Geo Place Name'] = new RegExp(location, 'i');
        }

        if (minDataValue !== undefined || maxDataValue !== undefined) {
            query['Data Value'] = {}; // Changed from 'Daily AQI Value'
            if (minDataValue !== undefined) query['Data Value'].$gte = parseFloat(minDataValue);
            if (maxDataValue !== undefined) query['Data Value'].$lte = parseFloat(maxDataValue);
        }

        Object.assign(query, filters);
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder;

        try {
            const [data, total] = await Promise.all([
                this.collection
                    .find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                this.collection.countDocuments(query)
            ]);

            return {
                data,
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total,
                    total_pages: Math.ceil(total / limit)
                },
                filters: query
            };
        } catch (error) {
            throw new Error(`Error fetching data: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            const { ObjectId } = require('mongodb');
            return await this.collection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            throw new Error(`Error finding record by ID: ${error.message}`);
        }
    }

    // Text search with advanced filtering, pagination, and sorting
    async search(searchTerm, options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'Start_Date',
            sortOrder = -1,
            startDate,
            endDate,
            location,       // For Geo Place Name
            measures,       // Changed from measure to measures (array for multiple pollutants)
            minDataValue,
            maxDataValue
        } = options;

        const query = {};

        if (searchTerm && searchTerm.trim() !== "") {
            query.$text = { $search: searchTerm };
        }

        // CRITICAL FIXES FOR DATE AND LOCATION:
        if (startDate || endDate) {
            query.Start_Date = {};
            if (startDate) {
                query.Start_Date.$gte = new Date(startDate); // Ensure Date object
            }
            if (endDate) {
                query.Start_Date.$lte = new Date(endDate);   // Ensure Date object
            }
        }

        if (location && location.trim() !== "") {
            let patternBase = this.escapeRegex(location);
            console.log(`[REGEX DEBUG] Initial patternBase: '${patternBase}'`);
            console.log(`[REGEX DEBUG] patternBase after escaping: '${patternBase}'`);

            // Test: let testReplace = patternBase.replace(/and/gi, 'AND_WAS_HERE');
            // console.log(`[REGEX DEBUG] Test replace 'and' directly: '${testReplace}'`);

            const flexibleAndOrAmpersand = '(\\s+and\\s+|\\s*&\\s*)';
            const andRegex = /\s+and\s+/gi; // Corrected regex
            let newPatternBase = patternBase.replace(andRegex, flexibleAndOrAmpersand);

            if (newPatternBase === patternBase) {
              // Only log a warning if "and" was actually present and not replaced
              if (patternBase.match(/and/i)) { // Check if "and" (case-insensitive) is in the string
                console.log(`[REGEX DEBUG] WARNING: The regex for 'and' (${String(andRegex)}) did NOT change patternBase, though 'and' seems present.`);
                console.log(`[REGEX DEBUG] patternBase for failed 'and' replace: "${patternBase}" (length ${patternBase.length})`);
              }
            } else {
              console.log(`[REGEX DEBUG] The regex for 'and' (${String(andRegex)}) successfully changed patternBase.`);
            }
            patternBase = newPatternBase;
            console.log(`[REGEX DEBUG] patternBase after s+and+s replace (expected flexible 'and'/'&'): '${patternBase}'`);

            const flexibleAmpersand = '(\\s*&\\s*|\\s+and\\s+)';
            const ampersandRegex = /\s*&\s*/gi; // Corrected regex (assuming it might have had the same issue)
            // In the previous log, this was referred to as "s+&+s replace", which might be a shorthand.
            // The actual regex for ampersand should be flexible with spaces.
            newPatternBase = patternBase.replace(ampersandRegex, flexibleAmpersand);

            if (newPatternBase === patternBase) {
              // Only log a warning if "&" was actually present and not replaced
              if (patternBase.includes('&')) {
                console.log(`[REGEX DEBUG] WARNING: The regex for '&' (${String(ampersandRegex)}) did NOT change patternBase, though '&' was present.`);
              } else {
                // This is normal if no ampersand exists in the string
                // console.log(`[REGEX DEBUG] No '&' found to replace with ${String(ampersandRegex)} (this is OK).`);
              }
            } else {
              console.log(`[REGEX DEBUG] The regex for '&' (${String(ampersandRegex)}) successfully changed patternBase.`);
            }
            patternBase = newPatternBase;
            console.log(`[REGEX DEBUG] patternBase after s*&*s replace: '${patternBase}'`); // Updated log label to s*&*s

    const finalRegexPattern = `^${patternBase}(?:\\s*\\(CD\\d+\\))?$`;
    const geoPlaceNameRegex = new RegExp(finalRegexPattern, 'i');
    console.log(`[MODEL SEARCH DEBUG] Constructed Geo Place Name Regex: ${geoPlaceNameRegex}`);
    query['Geo Place Name'] = { $regex: geoPlaceNameRegex }; // Assign the regex to the query
  } else if (searchTerm) {
            query.$text = { $search: searchTerm };
        }

        // CRITICAL FIXES FOR DATE AND LOCATION:
        if (startDate || endDate) {
            query.Start_Date = {};
            if (startDate) {
                query.Start_Date.$gte = new Date(startDate); // Ensure Date object
            }
            if (endDate) {
                query.Start_Date.$lte = new Date(endDate);   // Ensure Date object
            }
        }

        if (location && location.trim() !== "") {
            let patternBase = this.escapeRegex(location);
            console.log(`[REGEX DEBUG] Initial patternBase: '${patternBase}'`);
            console.log(`[REGEX DEBUG] patternBase after escaping: '${patternBase}'`);

            // Test: let testReplace = patternBase.replace(/and/gi, 'AND_WAS_HERE');
            // console.log(`[REGEX DEBUG] Test replace 'and' directly: '${testReplace}'`);

            const flexibleAndOrAmpersand = '(\\s+and\\s+|\\s*&\\s*)';
            const andRegex = /\s+and\s+/gi; // Corrected regex
            let newPatternBase = patternBase.replace(andRegex, flexibleAndOrAmpersand);

            if (newPatternBase === patternBase) {
              // Only log a warning if "and" was actually present and not replaced
              if (patternBase.match(/and/i)) { // Check if "and" (case-insensitive) is in the string
                console.log(`[REGEX DEBUG] WARNING: The regex for 'and' (${String(andRegex)}) did NOT change patternBase, though 'and' seems present.`);
                console.log(`[REGEX DEBUG] patternBase for failed 'and' replace: "${patternBase}" (length ${patternBase.length})`);
              }
            } else {
              console.log(`[REGEX DEBUG] The regex for 'and' (${String(andRegex)}) successfully changed patternBase.`);
            }
            patternBase = newPatternBase;
            console.log(`[REGEX DEBUG] patternBase after s+and+s replace (expected flexible 'and'/'&'): '${patternBase}'`);

            const flexibleAmpersand = '(\\s*&\\s*|\\s+and\\s+)';
            const ampersandRegex = /\s*&\s*/gi; // Corrected regex (assuming it might have had the same issue)
            // In the previous log, this was referred to as "s+&+s replace", which might be a shorthand.
            // The actual regex for ampersand should be flexible with spaces.
            newPatternBase = patternBase.replace(ampersandRegex, flexibleAmpersand);

            if (newPatternBase === patternBase) {
              // Only log a warning if "&" was actually present and not replaced
              if (patternBase.includes('&')) {
                console.log(`[REGEX DEBUG] WARNING: The regex for '&' (${String(ampersandRegex)}) did NOT change patternBase, though '&' was present.`);
              } else {
                // This is normal if no ampersand exists in the string
                // console.log(`[REGEX DEBUG] No '&' found to replace with ${String(ampersandRegex)} (this is OK).`);
              }
            } else {
              console.log(`[REGEX DEBUG] The regex for '&' (${String(ampersandRegex)}) successfully changed patternBase.`);
            }
            patternBase = newPatternBase;
            console.log(`[REGEX DEBUG] patternBase after s*&*s replace: '${patternBase}'`); // Updated log label to s*&*s

    const finalRegexPattern = `^${patternBase}(?:\\s*\\(CD\\d+\\))?$`;
    const geoPlaceNameRegex = new RegExp(finalRegexPattern, 'i');
    console.log(`[MODEL SEARCH DEBUG] Constructed Geo Place Name Regex: ${geoPlaceNameRegex}`);
    query['Geo Place Name'] = { $regex: geoPlaceNameRegex }; // Assign the regex to the query
  }

        if (measures && measures.length > 0) {
            query.Name = { $in: measures }; // Corrected field: Was MeasureName, should be Name based on schema
        }

        if (minDataValue !== undefined || maxDataValue !== undefined) {
            query['Data Value'] = {};
            if (minDataValue !== undefined) query['Data Value'].$gte = parseFloat(minDataValue);
            if (maxDataValue !== undefined) query['Data Value'].$lte = parseFloat(maxDataValue);
        }

        const skip = (page - 1) * limit;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder;

        console.log('[MODEL SEARCH DEBUG] Final MongoDB Query:', JSON.stringify(query, null, 2));
        console.log('[MODEL SEARCH DEBUG] Sort Options:', JSON.stringify(sortOptions, null, 2));

        try {
            const [data, total] = await Promise.all([
                this.collection
                    .find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                this.collection.countDocuments(query)
            ]);

            return {
                data,
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total,
                    total_pages: Math.ceil(total / limit)
                },
                filters_applied: query, // Return the actual query filters used
                sort_applied: sortOptions
            };
        } catch (error) {
            console.error(`Error during search operation: ${error.message}`, error);
            // Check for specific MongoDB errors, e.g., if a text index doesn't exist and $text search is attempted.
            if (error.message.includes("text index required for $text query")) {
                throw new Error("Text search is not available. A text index is required on the collection.");
            }
            if (error.message.includes("$search had the wrong type")) {
                console.error("Attempted to use a non-string value for $text.$search. SearchTerm:", searchTerm);
                throw new Error("Invalid search term provided for text search.");
            }
            throw new Error(`Error searching data: ${error.message}`);
        }
    }

    // Simplified GeoData - returns distinct locations and their latest reading
    // Actual map plotting would require Latitude/Longitude fields in the data.
    async getGeoData() {
        try {
            console.log('🔍 Starting simplified geo data aggregation (distinct Geo Place Names)...');

            const distinctLocations = await this.collection.distinct('Geo Place Name');
            console.log(`📊 Found ${distinctLocations.length} distinct Geo Place Names`);

            const locationData = [];
            for (const locName of distinctLocations) {
                const latestRecord = await this.collection
                    .findOne(
                        { 'Geo Place Name': locName },
                        { sort: { 'Start_Date': -1 } } // Changed from Date
                    );

                if (latestRecord) {
                    locationData.push({
                        'Geo Place Name': latestRecord['Geo Place Name'],
                        'Latest Data Value': latestRecord['Data Value'], // Changed from Daily AQI Value
                        'Latest Date': latestRecord['Start_Date'], // Changed from Date
                        'Measure': latestRecord['Measure'],
                        'Name': latestRecord['Name']
                        // Add other relevant fields if needed
                    });
                }
            }

            locationData.sort((a, b) => (b['Latest Data Value'] || 0) - (a['Latest Data Value'] || 0));
            console.log(`✅ GeoData: Found ${locationData.length} locations with latest readings.`);
            return locationData;

        } catch (error) {
            console.error('❌ Error in getGeoData (simplified):', error);
            throw new Error(`Error fetching simplified geo data: ${error.message}`);
        }
    }

    async getStatistics(timeframe = 'all') {
        try {
            const pipeline = [];
            if (timeframe !== 'all') {
                const now = new Date();
                let startDateBoundary;
                switch (timeframe) {
                    case 'week': startDateBoundary = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
                    case 'month': startDateBoundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
                    case 'year': startDateBoundary = new Date(now.getFullYear(), 0, 1); break; // Start of current year
                }
                if (startDateBoundary) {
                    pipeline.push({ $match: { Start_Date: { $gte: startDateBoundary } } }); // Changed from Date
                }
            }

            pipeline.push({
                $group: {
                    _id: null,
                    avgDataValue: { $avg: '$Data Value' }, // Changed from avgAQI
                    maxDataValue: { $max: '$Data Value' }, // Changed from maxAQI
                    minDataValue: { $min: '$Data Value' }, // Changed from minAQI
                    totalRecords: { $sum: 1 }
                    // Removed CO and Percent Complete stats as fields are not in new schema
                }
            });

            const stats = await this.collection.aggregate(pipeline).toArray();
            return stats[0] || {};
        } catch (error) {
            throw new Error(`Error getting statistics: ${error.message}`);
        }
    }

    async getMonthlyTrends(year = null) { // Year parameter might be a specific year (number)
        try {
            const pipeline = [];
            const matchStage = {};

            if (year) {
                const specificYear = parseInt(year);
                matchStage.Start_Date = { // Changed from Date
                    $gte: new Date(specificYear, 0, 1), // January 1st of the year
                    $lt: new Date(specificYear + 1, 0, 1) // January 1st of the next year
                };
            }
            if (Object.keys(matchStage).length > 0) {
                pipeline.push({ $match: matchStage });
            }

            pipeline.push(
                {
                    $group: {
                        _id: {
                            year: { $year: '$Start_Date' }, // Changed from direct field
                            month: { $month: '$Start_Date' } // Changed from direct field
                        },
                        avgDataValue: { $avg: '$Data Value' }, // Changed from avgAQI
                        maxDataValue: { $max: '$Data Value' }, // Changed from maxAQI
                        recordCount: { $sum: 1 }
                        // Removed CO stats
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            );

            return await this.collection.aggregate(pipeline).toArray();
        } catch (error) {
            throw new Error(`Error getting monthly trends: ${error.message}`);
        }
    }

    // Simplified from getByState, now getByGeoPlaceName
    async getByGeoPlaceName(geoPlaceName, options = {}) {
        const query = { 'Geo Place Name': new RegExp(geoPlaceName, 'i') };
        return await this.findAll(query, options);
    }

    // Renamed from getHighPollutionEvents to getHighValueEvents
    async getHighValueEvents(threshold = 100, options = {}) { // Threshold is for Data Value
        const query = { 'Data Value': { $gt: parseFloat(threshold) } }; // Changed from 'Daily AQI Value'
        return await this.findAll(query, {
            ...options,
            sortBy: 'Data Value', // Changed
            sortOrder: -1
        });
    }

    // Helper function to escape special characters for regex
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}

module.exports = new AirQualityModel();
