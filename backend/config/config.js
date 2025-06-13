require('dotenv').config();

module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // MongoDB Configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
    DB_NAME: process.env.MONGODB_DB || 'datainsight_db',
    COLLECTION_NAME: 'air_quality_data',    // API Configuration
    API_VERSION: '/api/v1',
    CORS_ORIGIN: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Cache
    CACHE_TTL: 300, // 5 minutes
    
    // Security
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: 100, // requests per window
};
