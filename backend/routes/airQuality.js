const express = require('express');
const router = express.Router();
const airQualityController = require('../controllers/airQualityController');
const dateQueryController = require('../controllers/dateQueryController');

// Health check endpoint
router.get('/health-check', airQualityController.healthCheck);

// Date-based query endpoints
router.get('/date-range', dateQueryController.getDataByDateRange);
router.get('/recent', dateQueryController.getRecentData);
router.get('/monthly-summary', dateQueryController.getMonthlyTrends);
router.get('/date-info', dateQueryController.getDateInfo);
router.get('/time-series', dateQueryController.getTimeSeriesData);

// Main data endpoints
router.get('/', airQualityController.getAllData);
router.get('/search', airQualityController.searchData);
router.post('/search', airQualityController.postSearchData);
router.get('/geo', airQualityController.getGeoData);
router.get('/statistics', airQualityController.getStatistics);
router.get('/trends', airQualityController.getMonthlyTrends);
router.get('/alerts', airQualityController.getHighValueEvents); // Corrected to getHighValueEvents

// NLP Search endpoint
router.post('/nlp-search', airQualityController.nlpSearch);

// State-specific data
router.get('/location/:location', airQualityController.getDataByLocation); // Changed getDataByState to getDataByLocation and path to /location/:location

// AI Prediction endpoint
router.get('/predict/:location', airQualityController.predictAirQuality); // Changed :city to :location to match controller

// Individual record
router.get('/:id', airQualityController.getDataById);

module.exports = router;
