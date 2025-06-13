# verify.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv("MONGODB_URI")
client = MongoClient(uri)
col = client[os.getenv("MONGODB_DB")]["air_quality_data"]

print("Total documents:", col.count_documents({}))
print("High NO2 (>30 ppb):", col.count_documents({
    "Name": "Nitrogen dioxide (NO2)",
    "Data Value": {"$gt": 30}
}))
print("Sample Flushing record:", col.find_one({
    "Geo Place Name": {"$regex": "Flushing", "$options": "i"}
}))

client.close()