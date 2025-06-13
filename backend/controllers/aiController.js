// backend/controllers/aiController.js
const axios = require('axios');
require('dotenv').config();
const AirQualityModel = require('../models/AirQuality');

// Mock fallback suggestions
const generateMockSuggestions = () => {
  return [
    { id: 'ai-sugg-1', query: 'Average PM2.5 in Manhattan last week?' },
    { id: 'ai-sugg-2', query: 'Areas with high ozone concentration today?' },
    { id: 'ai-sugg-3', query: 'Compare air quality: Brooklyn vs Queens (last month).' },
    { id: 'ai-sugg-4', query: 'Health impact of current SO2 levels in The Bronx?' },
    { id: 'ai-sugg-5', query: 'Air quality forecast for Financial District tomorrow?' },
    { id: 'ai-sugg-6', query: 'Trends for CO in Staten Island over the past year?' },
  ];
};

exports.getAiSearchSuggestions = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment');

    // Fetch all distinct locations from air quality data
    const allLocations = await AirQualityModel.distinct('Geo Place Name');
    // Randomly sample up to 20 locations for the prompt
    const sampleCount = Math.min(20, allLocations.length);
    const shuffled = allLocations.sort(() => 0.5 - Math.random());
    const sampleLocations = shuffled.slice(0, sampleCount).join(', ');

    const url = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';
    const promptText = `Your dataset contains the following locations: ${sampleLocations}, and more through March 11, 2025. Generate 10 concise, actionable search queries referencing only these locations. Example: 'PM2.5 levels in Brooklyn on March 10, 2025'.`;

    const response = await axios.post(
      `${url}?key=${apiKey}`,
      {
        prompt: { text: promptText },
        temperature: 0.7,
        candidateCount: 10,
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const candidates = response.data.candidates || [];
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error('No suggestions returned from Gemini API');
    }
    const suggestions = candidates.map((c, idx) => ({
      id: `ai-sugg-gemini-${idx}`,
      query: c.output.trim(),
    }));
    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error fetching AI search suggestions:', error.message || error);
    // Fallback to mock suggestions
    const suggestions = generateMockSuggestions();
    res.status(200).json({ suggestions });
  }
};
