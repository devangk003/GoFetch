# GoFetch MongoDB Import Guide

This directory contains tools for importing air quality data into MongoDB for the GoFetch platform.

## 📁 Files Overview

- `ad_viz_plotval_data.csv` - Air quality dataset (CO concentration and AQI data)
- `air_quality_dataset_analysis.ipynb` - Jupyter notebook for data analysis and MongoDB import
- `mongodb_import.py` - Standalone Python script for MongoDB import
- `requirements.txt` - Python dependencies
- `.env.template` - Environment configuration template

## 🚀 Quick Start

### Option 1: Using Jupyter Notebook (Recommended for analysis)

1. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

2. **Start Jupyter:**
   ```powershell
   jupyter notebook air_quality_dataset_analysis.ipynb
   ```

3. **Run all cells** to analyze data and import to MongoDB

### Option 2: Using Standalone Script (Recommended for production)

1. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

2. **Configure environment (optional):**
   ```powershell
   # Copy environment template
   copy .env.template .env
   # Edit .env with your MongoDB settings
   notepad .env
   ```

3. **Run the import:**
   ```powershell
   python mongodb_import.py
   ```

## 🗄️ MongoDB Setup

### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```powershell
   mongod
   ```
3. The script will automatically connect to `mongodb://localhost:27017/`

### MongoDB Atlas (Cloud)
1. Create a free MongoDB Atlas account
2. Get your connection string
3. Add to `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   ```

## 📊 What Gets Imported

The import process will:

- ✅ Load and clean the air quality CSV data
- ✅ Convert data types for optimal MongoDB storage
- ✅ Add temporal and geospatial indexes
- ✅ Create location coordinates for mapping
- ✅ Add metadata fields for better querying
- ✅ Test queries to ensure everything works

**Database Structure:**
- **Database:** `gofetch_db`
- **Collection:** `air_quality_data`
- **Documents:** ~105 air quality measurements
- **Indexes:** Date, State, AQI, Geospatial, Compound

## 🔍 Sample Queries

After import, you can query the data:

```javascript
// MongoDB shell examples

// Find high AQI days
db.air_quality_data.find({"Daily AQI Value": {$gt: 100}})

// Get data for a specific date range
db.air_quality_data.find({
  "Date": {
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-02-01")
  }
})

// Geographic query (near NYC)
db.air_quality_data.find({
  "location": {
    $geoWithin: {
      $box: [[-74.5, 40.5], [-73.5, 41.0]]
    }
  }
})

// Monthly averages
db.air_quality_data.aggregate([
  {
    $group: {
      _id: {year: "$year", month: "$month"},
      avgAQI: {$avg: "$Daily AQI Value"},
      count: {$sum: 1}
    }
  }
])
```

## 🚀 Integration with GoFetch Platform

The imported data is ready for:

- **🗺️ Interactive Maps** - Use `location` field for geospatial queries
- **📈 Time Series** - Query by `Date`, `year`, `month` fields
- **🔍 Search** - Full-text search on `State`, `County`, `Local Site Name`
- **🤖 AI Predictions** - Historical data for ML model training
- **📊 Dashboards** - Pre-indexed data for fast aggregations

## 🛠️ Troubleshooting

### Connection Issues
- **Local MongoDB:** Ensure MongoDB service is running
- **Atlas:** Check connection string and network access
- **Firewall:** Ensure port 27017 is open for local connections

### Import Issues
- **File not found:** Ensure CSV file is in the same directory
- **Permission errors:** Run PowerShell as administrator if needed
- **Memory issues:** Reduce batch size in the script

### Query Performance
- The script creates optimal indexes automatically
- For custom queries, consider adding specific indexes
- Use MongoDB Compass for visual query building

## 📈 Next Steps

After successful import:

1. **Backend API** - Use this data in your Node.js/Express backend
2. **Frontend** - Connect React/Vue frontend to query this data
3. **ML Models** - Train prediction models on historical patterns
4. **Real-time** - Set up data pipelines for live air quality feeds

## 🤝 Support

For issues or questions:
1. Check the console output for specific error messages
2. Verify MongoDB connection and permissions
3. Ensure all dependencies are installed correctly
4. Review the Jupyter notebook for detailed analysis steps

---

**Happy coding! 🎉 Your air quality data is ready for the GoFetch platform!**
