require('dotenv').config();
const { MongoClient } = require('mongodb');

async function analyzeDataset() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db('datainsight_db');
        const collection = db.collection('air_quality_data');
        
        // Get sample documents
        const docs = await collection.find({}).limit(5).toArray();
        
        console.log('=== Dataset Analysis ===');
        console.log('Sample records:');
        docs.forEach((doc, i) => {
            console.log(`Record ${i+1}:`);
            console.log(`  City: ${doc.City || doc['Local Site Name'] || 'N/A'}`);
            console.log(`  State: ${doc.State || 'N/A'}`);
            console.log(`  County: ${doc.County || 'N/A'}`);
            console.log(`  Date: ${doc.Date}`);
            console.log(`  AQI: ${doc.AQI || doc['Daily AQI Value'] || 'N/A'}`);
            console.log(`  Latitude: ${doc.latitude || doc.Latitude || 'N/A'}`);
            console.log(`  Longitude: ${doc.longitude || doc.Longitude || 'N/A'}`);
            console.log('---');
        });
        
        // Get summary statistics
        const totalCount = await collection.countDocuments();
        console.log(`\nTotal records: ${totalCount}`);
        
        // Get unique locations
        const uniqueCities = await collection.distinct('City');
        const uniqueStates = await collection.distinct('State');
        const uniqueCounties = await collection.distinct('County');
        
        console.log(`\nGeographic Coverage:`);
        console.log(`  Unique states: ${uniqueStates.length}`);
        console.log(`  States: ${uniqueStates.join(', ')}`);
        console.log(`  Unique counties: ${uniqueCounties.length}`);
        console.log(`  Counties: ${uniqueCounties.slice(0, 10).join(', ')}`);
        console.log(`  Unique cities: ${uniqueCities.length}`);
        console.log(`  Cities (first 20): ${uniqueCities.slice(0, 20).join(', ')}`);
        
        // Date range analysis
        const dateRange = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    minDate: { $min: "$Date" },
                    maxDate: { $max: "$Date" }
                }
            }
        ]).toArray();
        
        if (dateRange.length > 0) {
            console.log(`\nDate Range:`);
            console.log(`  From: ${dateRange[0].minDate}`);
            console.log(`  To: ${dateRange[0].maxDate}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

analyzeDataset();
