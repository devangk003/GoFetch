const express = require('express');
const router = express.Router();
const { getWaqiFeedByCity, getWaqiStationsByBounds } = require('../controllers/waqiController');

// Route to get WAQI feed for a specific city
// GET /api/v1/waqi/feed/:city
router.get('/feed/:city', getWaqiFeedByCity);

// Route to get WAQI stations within map bounds
// GET /api/v1/waqi/bounds?swLat&swLng&neLat&neLng
router.get('/bounds', getWaqiStationsByBounds);

module.exports = router;
