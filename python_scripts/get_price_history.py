import sys
import json
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def normalize_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, str):
        return value
    return str(value)

def get_price_history(product_id):
    # Connect to MongoDB using the URL from the .env file
    client = MongoClient(os.getenv("MONGODB_URL"))
    db = client["ConnectDB"]
    products_collection = db["products"]

    # Fetch product price history
    product = products_collection.find_one({"_id": ObjectId(product_id)}, {"priceHistory": 1, "price": 1})
    if not product or "priceHistory" not in product:
        return {"error": "Price history not found for this product"}

    history = [
        {
            "date": normalize_date(entry.get("date")),
            "price": float(entry.get("price", 0)),
        }
        for entry in product["priceHistory"]
    ]

    if not history:
        return {"error": "Price history not found for this product"}

    highest_price = max(entry["price"] for entry in history)
    lowest_price = min(entry["price"] for entry in history)
    average_price = sum(entry["price"] for entry in history) / len(history)

    return {
        "history": history,
        "highest_price": highest_price,
        "lowest_price": lowest_price,
        "average_price": average_price,
        "current_price": float(product.get("price", history[-1]["price"])),
    }

if __name__ == "__main__":
    product_id = sys.argv[1]
    result = get_price_history(product_id)
    print(json.dumps(result))
