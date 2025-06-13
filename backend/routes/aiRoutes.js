// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// GET /api/v1/ai/suggestions
router.get('/suggestions', aiController.getAiSearchSuggestions);

module.exports = router;
