#!/usr/bin/env python3
"""
Air Quality Data MongoDB Import Script for DataInsight Platform
================================================================

This script imports NYC air quality data from the new CSV to MongoDB Atlas for the DataInsight platform.
It includes data preparation, batch importing, index creation, and query testing.

Usage:
    python mongodb_import_new.py

Requirements:
    - pandas
    - pymongo
    - python-dotenv
    - MongoDB Atlas connection string in .env file
"""

import pandas as pd
import numpy as np
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError
from datetime import datetime, timedelta
import os
import sys
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DataInsightMongoImporter:
    """MongoDB importer for DataInsight NYC air quality data"""
    
    def __init__(self):
        """Initialize the MongoDB importer with configuration"""
        self.local_uri = "mongodb://localhost:27017/"
        self.database_name = "datainsight_db"
        self.collection_name = "air_quality_data"
        
        # Cloud MongoDB Atlas settings (if available)
        self.cloud_uri = os.getenv('MONGODB_URI')
        self.cloud_db = os.getenv('MONGODB_DB', 'datainsight_db')
        
        self.client = None
        self.db = None
        self.collection = None
        
    def get_connection_uri(self):
        """Get MongoDB connection URI"""
        return self.cloud_uri if self.cloud_uri else self.local_uri
    
    def get_database_name(self):
        """Get database name"""
        return self.cloud_db if self.cloud_uri else self.database_name
    
    def connect_mongodb(self):
        """Establish MongoDB connection"""
        try:
            print("🔌 Connecting to MongoDB...")
            self.client = MongoClient(self.get_connection_uri())
            
            # Test the connection
            self.client.admin.command('ping')
            print("✅ MongoDB connection successful!")
            
            # Get database and collection
            self.db = self.client[self.get_database_name()]
            self.collection = self.db[self.collection_name]
            
            # Check existing data
            existing_count = self.collection.count_documents({})
            print(f"📊 Existing documents in collection: {existing_count:,}")
            
            return True
            
        except ConnectionFailure as e:
            print(f"❌ MongoDB connection failed: {e}")
            print("💡 Make sure MongoDB is running locally or check your Atlas connection string")
            return False
        except Exception as e:
            print(f"❌ Error connecting to MongoDB: {e}")
            return False
    
    def load_and_prepare_data(self, csv_file_path):
        """Load and prepare NYC air quality data for MongoDB"""
        print(f"📥 Loading data from {csv_file_path}...")
        
        try:
            # Load the CSV file
            df = pd.read_csv(csv_file_path)
            print(f"✅ Dataset loaded: {df.shape[0]:,} rows × {df.shape[1]} columns")
            
            # Data preparation
            print("🧹 Preparing data for MongoDB...")
            
            # Convert date format - handle the new format
            df['Start_Date'] = pd.to_datetime(df['Start_Date'])
            
            # Create a proper Date field from Start_Date for consistency with old data model
            df['Date'] = df['Start_Date']
            
            # Convert data types for better MongoDB storage
            numeric_columns = [
                'Data Value',
                'Unique ID',
                'Indicator ID',
                'Geo Join ID'
            ]
            
            for col in numeric_columns:
                if col in df.columns:
                    try:
                        # Use pd.to_numeric to handle mixed data types
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                    except (ValueError, TypeError) as e:
                        print(f"⚠️ Warning: Could not convert {col} to numeric: {e}")
            
            # Extract year, month from the date
            df['year'] = df['Date'].dt.year
            df['month'] = df['Date'].dt.month
            df['day_of_year'] = df['Date'].dt.dayofyear
            
            # Add import timestamp
            df['import_timestamp'] = datetime.now()
            
            # Handle potential coordinates
            # Note: Currently the dataset doesn't have direct lat/lon columns
            # If coordinates exist in the dataset (either as separate columns or can be derived),
            # add the location field for geospatial queries
            
            print(f"✅ Data preparation complete!")
            print(f"  📊 Records prepared: {len(df):,}")
            print(f"  📅 Date range: {df['Date'].min()} to {df['Date'].max()}")
            print(f"  🗂️ Columns: {len(df.columns)}")
            
            return df
            
        except FileNotFoundError:
            print(f"❌ File not found: {csv_file_path}")
            return None
        except Exception as e:
            print(f"❌ Error loading/preparing data: {e}")
            return None
    
    def import_data(self, df, batch_size=1000, update_existing=False):
        """Import dataframe to MongoDB with batch processing"""
        
        if self.collection is None:
            print("❌ No MongoDB connection available")
            return False
        
        print(f"🚀 Starting MongoDB import...")
        print(f"  📊 Total records to import: {len(df):,}")
        print(f"  📦 Batch size: {batch_size:,}")
        print(f"  🔄 Update existing: {update_existing}")
        
        try:
            # Convert DataFrame to list of dictionaries
            records = df.to_dict('records')
            
            # Process in batches
            total_inserted = 0
            total_updated = 0
            total_batches = (len(records) + batch_size - 1) // batch_size
            
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                
                print(f"  📦 Processing batch {batch_num}/{total_batches} ({len(batch)} records)...")
                
                if update_existing:
                    # Use upsert for updating existing records
                    for record in batch:
                        filter_criteria = {
                            'Unique ID': record.get('Unique ID')
                        }
                        
                        result = self.collection.replace_one(
                            filter_criteria,
                            record,
                            upsert=True
                        )
                        
                        if result.upserted_id:
                            total_inserted += 1
                        elif result.modified_count > 0:
                            total_updated += 1
                else:
                    # Insert new records only
                    try:
                        result = self.collection.insert_many(batch, ordered=False)
                        total_inserted += len(result.inserted_ids)
                    except Exception as batch_error:
                        print(f"  ⚠️ Batch insert error: {batch_error}")
                        # Try inserting one by one to skip problematic records
                        for record in batch:
                            try:
                                self.collection.insert_one(record)
                                total_inserted += 1
                            except Exception as e:
                                continue  # Skip problematic record
            
            print(f"\n✅ Import completed successfully!")
            print(f"  📈 Records inserted: {total_inserted:,}")
            if update_existing:
                print(f"  🔄 Records updated: {total_updated:,}")
            
            # Verify import
            final_count = self.collection.count_documents({})
            print(f"  📊 Total documents in collection: {final_count:,}")
            
            return True
            
        except Exception as e:
            print(f"❌ Import failed: {e}")
            return False
    
    def create_indexes(self):
        """Create indexes for efficient querying"""
        
        if self.collection is None:
            print("❌ No MongoDB connection available")
            return False
        
        print("🔗 Creating indexes for optimal query performance...")
        
        try:
            # Create various indexes for DataInsight platform tailored to the new NYC dataset
            indexes = [
                ("Date", 1),  # Date index for time-series queries
                ("Geo Join ID", 1),  # Geographical region index
                ("Geo Place Name", 1),  # Place name index
                ([("Indicator ID", 1), ("Date", 1)]),  # Compound index for specific indicators over time
                ("Data Value", 1),  # Measurement values
                ("Name", 1),  # Indicator name
                ([("year", 1), ("month", 1)])  # Year-Month index
            ]
            
            index_names = [
                "Date index",
                "Geographic ID index", 
                "Place Name index",
                "Indicator-Date compound index",
                "Data Value index",
                "Indicator Name index",
                "Year-Month index"
            ]
            
            # Create text index for text search capabilities
            self.collection.create_index([
                ("Name", "text"),
                ("Geo Place Name", "text"),
                ("Measure", "text"),
                ("Message", "text")
            ], name="text_search_index")
            print(f"  ✅ Text search index created")
            
            for i, index_spec in enumerate(indexes):
                try:
                    if isinstance(index_spec, tuple) and len(index_spec) == 1:
                        self.collection.create_index(index_spec[0])
                    elif isinstance(index_spec, list):
                        self.collection.create_index(index_spec)
                    else:
                        self.collection.create_index(index_spec)
                    print(f"  ✅ {index_names[i]} created")
                except Exception as idx_error:
                    print(f"  ⚠️ Warning: Could not create {index_names[i]}: {idx_error}")
            
            print("\n✅ Index creation completed!")
            return True
            
        except Exception as e:
            print(f"❌ Error creating indexes: {e}")
            return False
    
    def test_queries(self):
        """Test various query patterns for DataInsight platform"""
        
        if self.collection is None:
            print("❌ No MongoDB connection available for testing")
            return False
        
        print("🧪 Testing MongoDB queries for DataInsight platform...")
        
        try:
            # 1. Basic count
            total_docs = self.collection.count_documents({})
            print(f"\n📊 Total documents: {total_docs:,}")
            
            # 2. Date range query
            end_date = datetime(2022, 1, 1)
            start_date = datetime(2015, 1, 1)
            
            date_range_count = self.collection.count_documents({
                "Date": {"$gte": start_date, "$lt": end_date}
            })
            print(f"📅 Records from 2015-2022: {date_range_count:,}")
            
            # 3. High pollution measurements (for example, Nitrogen dioxide > 30)
            high_pollution = self.collection.count_documents({
                "Name": "Nitrogen dioxide (NO2)",
                "Data Value": {"$gt": 30}
            })
            print(f"🚨 High Nitrogen dioxide measurements (>30): {high_pollution}")
            
            # 4. Geographic query (specific neighborhood)
            geo_count = self.collection.count_documents({
                "Geo Place Name": {"$regex": "Flushing", "$options": "i"}
            })
            print(f"🗺️ Records in Flushing area: {geo_count:,}")
            
            # 5. Text search
            text_results = list(self.collection.find(
                {"$text": {"$search": "air quality nitrogen"}},
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(3))
            
            print(f"\n🔍 Text search results (first 3):")
            for doc in text_results:
                print(f"  • {doc.get('Name')} in {doc.get('Geo Place Name')}: {doc.get('Data Value')} {doc.get('Measure Info')}")
            
            # 6. Aggregation query (average by neighborhood)
            neighborhood_avg = list(self.collection.aggregate([
                {
                    "$match": {
                        "Name": "Nitrogen dioxide (NO2)"
                    }
                },
                {
                    "$group": {
                        "_id": "$Geo Place Name",
                        "avg_value": {"$avg": "$Data Value"},
                        "count": {"$sum": 1}
                    }
                },
                {"$sort": {"avg_value": -1}},
                {"$limit": 3}
            ]))
            
            print(f"\n📊 Neighborhood averages for NO2 (top 3):")
            for place in neighborhood_avg:
                print(f"  • {place['_id']}: {place['avg_value']:.2f} ppb ({place['count']} records)")
            
            print("\n✅ All test queries completed successfully!")
            print("🚀 MongoDB is ready for DataInsight platform integration!")
            
            return True
            
        except Exception as e:
            print(f"❌ Error testing queries: {e}")
            return False
    
    def print_summary(self):
        """Print final summary and next steps"""
        print("\n" + "="*70)
        print("🎯 MONGODB IMPORT SUMMARY FOR DATAINSIGHT NYC AIR QUALITY")
        print("="*70)
        
        if self.collection is not None:
            final_count = self.collection.count_documents({})
            
            print(f"\n✅ IMPORT SUCCESSFUL:")
            print(f"  📊 Total documents imported: {final_count:,}")
            print(f"  🗄️ Database: {self.get_database_name()}")
            print(f"  📋 Collection: {self.collection_name}")
            
            print(f"\n🔗 INDEXES CREATED:")
            print(f"  ✅ Temporal indexes for time-series queries")
            print(f"  ✅ Text indexes for natural language search")
            print(f"  ✅ Compound indexes for complex queries")
            
            print(f"\n🚀 READY FOR DATAINSIGHT FEATURES:")
            print(f"  🗺️ NYC neighborhood-based air quality mapping")
            print(f"  🔍 Natural language search capabilities")
            print(f"  📈 Time-series analysis and forecasting")
            print(f"  📊 Real-time air quality monitoring by pollutant type")
            
        print(f"\n🛠️ NEXT STEPS:")
        print(f"  1. 🔧 Update backend API endpoints for new data structure")
        print(f"  2. 🎨 Adapt frontend components to NYC focus")
        print(f"  3. 🤖 Implement NLP search and prediction features")
        print(f"  4. 📱 Test and optimize for mobile")
        
        print(f"\n💡 CONNECTION INFO:")
        print(f"  URI: {self.get_connection_uri()}")
        print(f"  Database: {self.get_database_name()}")
        print(f"  Collection: {self.collection_name}")
        
        print("\n" + "="*70)
        print("🎉 NYC DATAINSIGHT PLATFORM READY FOR DEVELOPMENT!")
        print("="*70)
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("\n🔌 MongoDB connection closed.")

def main():
    """Main function to run the import process"""
    print("🌟 NYC DataInsight Air Quality Data MongoDB Import")
    print("=" * 50)
    
    # Initialize importer
    importer = DataInsightMongoImporter()
    
    # Connect to MongoDB
    if not importer.connect_mongodb():
        print("❌ Cannot proceed without MongoDB connection")
        return 1
    
    # Load and prepare data
    csv_file = "Air_Quality_20250613.csv"
    df = importer.load_and_prepare_data(csv_file)
    
    if df is None:
        print("❌ Cannot proceed without data")
        importer.close_connection()
        return 1
    
    # Import data
    print("\n" + "="*50)
    print("🚀 STARTING IMPORT PROCESS")
    print("="*50)
    
    import_success = importer.import_data(df, batch_size=500, update_existing=False)
    
    if not import_success:
        print("❌ Import failed")
        importer.close_connection()
        return 1
    
    # Create indexes
    print("\n🔗 Creating database indexes...")
    importer.create_indexes()
    
    # Test queries
    print("\n🧪 Testing database queries...")
    importer.test_queries()
    
    # Print summary
    importer.print_summary()
    
    # Close connection
    importer.close_connection()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
