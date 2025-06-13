const axios = require('axios');

const getWaqiFeedByCity = async (req, res) => {
  const { city } = req.params;
  const apiKey = process.env.WAQI_API_KEY; // Loaded from backend/.env

  if (!apiKey) {
    console.error('WAQI_API_KEY is not set in backend/.env');
    return res.status(500).json({ status: 'error', message: 'Server configuration error: WAQI API Key not found.' });
  }

  if (!city) {
    return res.status(400).json({ status: 'error', message: 'City parameter is required.' });
  }

  const waqiApiUrl = `https://api.waqi.info/feed/${city}/?token=${apiKey}`;

  try {
    const response = await axios.get(waqiApiUrl);
    // Forward the data and status from WAQI API
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching data from WAQI API:', error.response ? error.response.data : error.message);
    if (error.response) {
      // Forward the error status and data from WAQI API if available
      res.status(error.response.status).json(error.response.data || { status: 'error', message: 'Failed to fetch data from WAQI API.' });
    } else {
      res.status(500).json({ status: 'error', message: 'An unexpected error occurred while fetching WAQI data.' });
    }
  }
};

module.exports = {
  getWaqiFeedByCity,
};
