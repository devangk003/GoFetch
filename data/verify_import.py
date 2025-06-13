#!/usr/bin/env python3
"""
Quick verification script for MongoDB import
"""

from pymongo import MongoClient
from datetime import datetime
import json

def verify_import():
    """Verify the MongoDB import was successful"""
    print("🔍 Verifying MongoDB Import...")
    
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        db = client['datainsight_db']
        collection = db['air_quality_data']
        
        # Basic statistics
        total_docs = collection.count_documents({})
        print(f"📊 Total documents: {total_docs:,}")
        
        # Sample document
        sample = collection.find_one()
        if sample:
            print("\n📋 Sample document structure:")
            for key, value in sample.items():
                if key == '_id':
                    continue
                print(f"  • {key}: {type(value).__name__} = {str(value)[:50]}...")
        
        # Date range
        date_range = list(collection.aggregate([
            {"$group": {
                "_id": None,
                "min_date": {"$min": "$Date"},
                "max_date": {"$max": "$Date"},
                "unique_states": {"$addToSet": "$State"},
                "avg_aqi": {"$avg": "$Daily AQI Value"}
            }}
        ]))
        
        if date_range:
            stats = date_range[0]
            print(f"\n📅 Date range: {stats['min_date'].strftime('%Y-%m-%d')} to {stats['max_date'].strftime('%Y-%m-%d')}")
            print(f"🌍 States: {', '.join(stats['unique_states'])}")
            print(f"📈 Average AQI: {stats['avg_aqi']:.1f}")
        
        # Index information
        indexes = list(collection.list_indexes())
        print(f"\n🔗 Indexes created: {len(indexes)}")
        for idx in indexes:
            print(f"  • {idx['name']}")
        
        print("\n✅ MongoDB import verification completed!")
        print("🚀 Ready for DataInsight platform development!")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == "__main__":
    verify_import()
