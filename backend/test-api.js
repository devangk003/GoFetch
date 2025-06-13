// Simple script to test API functionality

const AirQualityController = require('./controllers/airQualityController');
const database = require('./database/connection');

// Mock Express response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Initialize database
async function init() {
  console.log('Initializing connection...');
  try {
    await database.connect();
    console.log('Database connected successfully');
    
    // Test health check endpoint
    console.log('\nTesting health-check endpoint:');
    const res = mockResponse();
    await AirQualityController.healthCheck({}, res);
    console.log('Response:', res.json.mock.calls[0][0]);
    
    // Close database connection
    await database.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
init();
