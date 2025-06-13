const express = require('express');
const router = express.Router();

// Import route modules
const airQualityRoutes = require('./airQuality');
const airQualityController = require('../controllers/airQualityController');

// Mount routes
router.use('/air-quality', airQualityRoutes);

// General search endpoint (alias for air-quality search)
router.post('/search', airQualityController.postSearchData);

// General predict endpoint (alias for air-quality predict)
router.get('/predict/:city', airQualityController.predictAirQuality);

// General NLP Search endpoint (alias for air-quality nlp-search)
router.post('/nlp-search', airQualityController.nlpSearch);

// Data endpoint (alias for air-quality)
router.get('/data', airQualityController.getAllData);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'DataInsight Platform API',
        version: 'v1',
        timestamp: new Date().toISOString(),        endpoints: {
            'GET /data': 'Get all air quality data with pagination',
            'POST /search': 'Advanced search with filters',
            'POST /nlp-search': 'Natural language search for air quality data',
            'GET /predict/:city': 'AI predictions for city air quality',
            'GET /air-quality': 'Get all air quality data with pagination',
            'GET /air-quality/search?q=term': 'Search air quality data',
            'POST /air-quality/search': 'Advanced search with body filters',
            'GET /air-quality/predict/:city': 'AI predictions for air quality',
            'GET /air-quality/geo': 'Get geographic data for mapping',
            'GET /air-quality/statistics': 'Get statistical summaries',
            'GET /air-quality/trends': 'Get monthly trends',
            'GET /air-quality/alerts': 'Get high pollution events',
            'GET /air-quality/state/:state': 'Get data by state',
            'GET /air-quality/:id': 'Get specific record',
            'GET /air-quality/health-check': 'API health status'
        }
    });
});

module.exports = router;
