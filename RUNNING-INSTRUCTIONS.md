# Running the GoFetch Application

## Prerequisites

- Node.js (v16+)
- MongoDB Atlas account
- Google Gemini API key

## Starting the Backend

1. Navigate to the backend directory:
```powershell
cd e:\Git\GoFetch\backend
```

2. Install dependencies:
```powershell
npm install
```

3. Create or update the `.env` file with the following:
```
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
```

4. Start the backend server:
```powershell
npm start
```

## Starting the Frontend

1. Navigate to the frontend directory:
```powershell
cd e:\Git\GoFetch\frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Using the Application

### Natural Language Search

- Use the search bar at the top of the map view to enter natural language queries
- Example queries:
  - "Show me nitrogen dioxide levels in Chelsea-Village in 2013"
  - "What was the air quality like in Brooklyn last summer?"
  - "Compare PM2.5 pollution between Manhattan and Queens"

### Map View

- The map shows air quality data as color-coded circles
- Click on a circle to see detailed information
- The legend in the bottom right explains the color coding

### Trends View

- Select a city and time range to see historical air quality trends
- The chart shows AQI values over time
- The city comparison shows average AQI across major cities

### Predictions View

- Select a city to see air quality predictions
- The cards show predicted AQI values for upcoming days
- Confidence levels indicate the reliability of the prediction

## Troubleshooting

- If the map doesn't load properly, try refreshing the page
- If search results don't appear, check the browser console for errors
- Ensure both backend and frontend servers are running
- Verify that your MongoDB Atlas connection and Gemini API key are correct

## Layout Fixes Implemented

The following layout issues have been fixed:

1. Search bar is now properly positioned using sticky positioning
2. Map view has been adjusted to fit within the viewport
3. Header is now sticky to improve navigation
4. Proper spacing and padding have been added throughout the app
5. Components have consistent height calculations
