require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDateFormats() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db('datainsight_db');
        const collection = db.collection('air_quality_data');
        
        // Get sample documents
        const docs = await collection.find({}).limit(10).toArray();
        
        console.log('=== Date Format Analysis ===');
        console.log(`Total documents checked: ${docs.length}`);
        
        docs.forEach((doc, i) => {
            console.log(`Doc ${i+1}:`);
            console.log(`  Date: ${doc.Date}`);
            console.log(`  Type: ${typeof doc.Date}`);
            console.log(`  Is Date object: ${doc.Date instanceof Date}`);
            console.log('---');
        });
        
        // Check if there are any string dates that need conversion
        const stringDates = await collection.find({ Date: { $type: "string" } }).limit(5).toArray();
        console.log(`\nDocuments with string dates: ${stringDates.length}`);
        
        if (stringDates.length > 0) {
            console.log('Sample string dates:');
            stringDates.forEach((doc, i) => {
                console.log(`  ${i+1}: ${doc.Date}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkDateFormats();
