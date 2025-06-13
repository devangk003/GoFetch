const express = require('express');
const router = express.Router();
const { getWaqiFeedByCity } = require('../controllers/waqiController');

// Route to get WAQI feed for a specific city
// GET /api/v1/waqi/feed/:city
router.get('/feed/:city', getWaqiFeedByCity);

module.exports = router;
