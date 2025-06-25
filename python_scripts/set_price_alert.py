import sys
import json
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def set_price_alert(product_id, user_id, target_price):
    # Connect to MongoDB using the URL from the .env file
    client = MongoClient(os.getenv("MONGODB_URL"))
    db = client["ConnectDB"]
    alerts_collection = db["priceAlerts"]

    # Insert the price alert into the database
    alert = {
        "productId": product_id,
        "userId": user_id,
        "targetPrice": float(target_price),
    }
    alerts_collection.insert_one(alert)

    return {
        "message": "Alert set successfully",
        "productId": product_id,
        "userId": user_id,
        "targetPrice": target_price,
    }

if __name__ == "__main__":
    product_id = sys.argv[1]
    user_id = sys.argv[2]
    target_price = sys.argv[3]
    result = set_price_alert(product_id, user_id, target_price)
    print(json.dumps(result))
