const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import modules
const config = require('./config/config');
const database = require('./database/connection');
const AirQualityModel = require('./models/AirQuality');
const routes = require('./routes/index');
const waqiRoutes = require('./routes/waqi'); // Added
const aiRoutes = require('./routes/aiRoutes'); // Import AI routes
const { errorHandler, notFound, requestLogger } = require('./middleware/middleware');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcAttr: ["'unsafe-inline'"], // Add this line
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080', '*'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Logging
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    app.use(requestLogger);
} else {
    app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (HTML test interface)
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'DataInsight API Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.NODE_ENV
    });
});

// API routes
app.use(`${config.API_VERSION}/ai`, aiRoutes); // Mount AI routes first
app.use(`${config.API_VERSION}/waqi`, waqiRoutes); // Mount WAQI routes
app.use(config.API_VERSION, routes); // General API routes

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to DataInsight Platform API',
        version: '1.0.0',
        documentation: '/api/v1',
        health: '/health'
    });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting DataInsight API Server...');
        
        // Connect to MongoDB
        await database.connect();
        
        // Initialize models
        await AirQualityModel.initialize();
        console.log('✅ Models initialized');
        
        // Start server
        const server = app.listen(config.PORT, () => {
            console.log(`🌟 DataInsight API Server running on port ${config.PORT}`);
            console.log(`📊 Environment: ${config.NODE_ENV}`);
            console.log(`🔗 API Base URL: http://localhost:${config.PORT}${config.API_VERSION}`);
            console.log(`❤️  Health Check: http://localhost:${config.PORT}/health`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('📴 SIGTERM received, shutting down gracefully...');
            server.close(async () => {
                await database.disconnect();
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('📴 SIGINT received, shutting down gracefully...');
            server.close(async () => {
                await database.disconnect();
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
