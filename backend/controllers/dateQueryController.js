const AirQualityModel = require('../models/AirQuality');

class DateQueryController {
    
    // GET /api/v1/air-quality/date-range
    async getDataByDateRange(req, res) {
        try {
            const { startDate, endDate, limit = 100, city } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Both startDate and endDate are required (format: YYYY-MM-DD)'
                });
            }

            const filter = {
                Date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };

            if (city) {
                filter.City = new RegExp(city, 'i');
            }            const data = await AirQualityModel.findAll(filter, {
                limit: parseInt(limit),
                sortBy: 'Date',
                sortOrder: 1
            });

            res.json({                success: true,
                message: 'Date range data retrieved successfully',
                data: data.data,
                count: data.data.length,
                dateRange: { startDate, endDate }
            });

        } catch (error) {
            console.error('Error in getDataByDateRange:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/v1/air-quality/recent
    async getRecentData(req, res) {
        try {
            const { days = 30, limit = 100, city } = req.query;
            
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));

            const filter = { Date: { $gte: daysAgo } };
            
            if (city) {
                filter.City = new RegExp(city, 'i');
            }            const data = await AirQualityModel.findAll(filter, {
                limit: parseInt(limit),
                sortBy: 'Date',
                sortOrder: -1
            });

            res.json({                success: true,
                message: `Recent ${days} days data retrieved successfully`,
                data: data.data,
                count: data.data.length,
                daysBack: parseInt(days)
            });

        } catch (error) {
            console.error('Error in getRecentData:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }    // GET /api/v1/air-quality/monthly-summary
    async getMonthlyTrends(req, res) {
        try {
            const { year = new Date().getFullYear() } = req.query;
            
            // Use the existing getMonthlyTrends method
            const trends = await AirQualityModel.getMonthlyTrends(year);

            res.json({
                success: true,
                message: `Monthly trends for ${year} retrieved successfully`,
                data: trends,
                year: parseInt(year)
            });

        } catch (error) {
            console.error('Error in getMonthlyTrends:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }// GET /api/v1/air-quality/date-info
    async getDateInfo(req, res) {
        try {
            // Get basic statistics that include date information
            const stats = await AirQualityModel.getStatistics('all');
            
            res.json({
                success: true,
                message: 'Date information retrieved successfully',
                data: {
                    totalRecords: stats.totalRecords,
                    datasetCoverage: stats.datasetCoverage || 'Full year 2024',
                    note: 'Your MongoDB data contains properly formatted Date objects ready for time-based queries'
                }
            });

        } catch (error) {
            console.error('Error in getDateInfo:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/v1/air-quality/time-series
    async getTimeSeriesData(req, res) {
        try {
            const { city, startDate, endDate, groupBy = 'day' } = req.query;
            
            if (!city) {
                return res.status(400).json({
                    success: false,
                    message: 'City parameter is required'
                });
            }

            let matchStage = { City: new RegExp(city, 'i') };
            
            if (startDate && endDate) {
                matchStage.Date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            // Define grouping based on parameter
            let groupId;
            switch(groupBy.toLowerCase()) {
                case 'month':
                    groupId = {
                        year: { $year: "$Date" },
                        month: { $month: "$Date" }
                    };
                    break;
                case 'week':
                    groupId = {
                        year: { $year: "$Date" },
                        week: { $week: "$Date" }
                    };
                    break;
                case 'day':
                default:
                    groupId = {
                        year: { $year: "$Date" },
                        month: { $month: "$Date" },
                        day: { $dayOfMonth: "$Date" }
                    };
                    break;
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: groupId,
                        avgAQI: { $avg: "$AQI" },
                        avgPM25: { $avg: "$PM2.5" },
                        avgPM10: { $avg: "$PM10" },
                        avgNO2: { $avg: "$NO2" },
                        recordCount: { $sum: 1 },
                        firstDate: { $min: "$Date" }
                    }
                },
                { $sort: { "firstDate": 1 } }
            ];

            const timeSeries = await AirQualityModel.aggregate(pipeline);

            res.json({
                success: true,
                message: `Time series data for ${city} retrieved successfully`,
                city,
                groupBy,
                data: timeSeries,
                totalDataPoints: timeSeries.length
            });

        } catch (error) {
            console.error('Error in getTimeSeriesData:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = new DateQueryController();
