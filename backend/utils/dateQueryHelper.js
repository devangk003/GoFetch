// Date-based query utilities for Air Quality API
require('dotenv').config();
const { MongoClient } = require('mongodb');

class DateQueryHelper {
    constructor() {
        this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
        this.dbName = 'datainsight_db';
        this.collectionName = 'air_quality_data';
    }

    async connect() {
        this.client = new MongoClient(this.uri);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.collection = this.db.collection(this.collectionName);
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
        }
    }

    // Get data for a specific date range
    async getDataByDateRange(startDate, endDate, limit = 100) {
        return await this.collection.find({
            Date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).limit(limit).toArray();
    }

    // Get data for the last N days
    async getRecentData(days = 30, limit = 100) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        return await this.collection.find({
            Date: { $gte: startDate }
        }).sort({ Date: -1 }).limit(limit).toArray();
    }

    // Get monthly aggregated data
    async getMonthlyAverages(year = 2024) {
        return await this.collection.aggregate([
            {
                $match: {
                    Date: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${year + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$Date" },
                        month: { $month: "$Date" }
                    },
                    avgAQI: { $avg: "$AQI" },
                    avgPM25: { $avg: "$PM2.5" },
                    avgPM10: { $avg: "$PM10" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]).toArray();
    }

    // Get data for specific cities over time
    async getCityTrends(city, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        return await this.collection.find({
            City: new RegExp(city, 'i'),
            Date: { $gte: startDate }
        }).sort({ Date: 1 }).toArray();
    }

    // Get available date range in the dataset
    async getDateRange() {
        const minDate = await this.collection.findOne({}, { sort: { Date: 1 } });
        const maxDate = await this.collection.findOne({}, { sort: { Date: -1 } });
        
        return {
            earliest: minDate?.Date,
            latest: maxDate?.Date,
            totalDays: minDate && maxDate ? 
                Math.ceil((maxDate.Date - minDate.Date) / (1000 * 60 * 60 * 24)) : 0
        };
    }
}

module.exports = DateQueryHelper;

// Test the functionality
if (require.main === module) {
    async function test() {
        const helper = new DateQueryHelper();
        try {
            await helper.connect();
            
            console.log('=== Date Range Available ===');
            const range = await helper.getDateRange();
            console.log(range);
            
            console.log('\n=== Recent Data (Last 7 days) ===');
            const recent = await helper.getRecentData(7, 5);
            console.log(`Found ${recent.length} records`);
            recent.forEach(doc => {
                console.log(`${doc.City}: AQI ${doc.AQI} on ${doc.Date.toDateString()}`);
            });
            
            console.log('\n=== Monthly Averages for 2024 ===');
            const monthly = await helper.getMonthlyAverages(2024);
            monthly.slice(0, 3).forEach(month => {
                console.log(`${month._id.year}-${String(month._id.month).padStart(2, '0')}: Avg AQI ${Math.round(month.avgAQI)}`);
            });
            
        } catch (error) {
            console.error('Error:', error);
        } finally {
            await helper.disconnect();
        }
    }
    
    test();
}
