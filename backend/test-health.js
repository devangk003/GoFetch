console.log('Testing API health check');
const controller = require('./controllers/airQualityController');
const mockReq = {};
const mockRes = {
  json: (data) => console.log(JSON.stringify(data, null, 2)),
  status: (code) => ({ json: mockRes.json })
};
console.log('Calling health check...');
controller.healthCheck(mockReq, mockRes);
