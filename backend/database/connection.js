const { MongoClient } = require('mongodb');
const config = require('../config/config');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.collection = null;
    }

    async connect() {
        try {
            console.log('🔌 Connecting to MongoDB...');
            this.client = new MongoClient(config.MONGODB_URI);
            await this.client.connect();
            
            this.db = this.client.db(config.DB_NAME);
            this.collection = this.db.collection(config.COLLECTION_NAME);
            
            // Test the connection
            await this.db.admin().ping();
            console.log('✅ MongoDB connected successfully');
            
            return this.collection;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 MongoDB connection closed');
        }
    }

    getCollection() {
        if (!this.collection) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.collection;
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }
}

// Export singleton instance
module.exports = new Database();
