import sys
import json
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def get_price_history(product_id):
    # Connect to MongoDB using the URL from the .env file
    client = MongoClient(os.getenv("MONGODB_URL"))
    db = client["ConnectDB"]
    products_collection = db["products"]

    # Fetch product price history
    product = products_collection.find_one({"_id": product_id}, {"priceHistory": 1})
    if not product or "priceHistory" not in product:
        return {"error": "Price history not found for this product"}

    history = product["priceHistory"]
    highest_price = max(entry["price"] for entry in history)
    lowest_price = min(entry["price"] for entry in history)
    average_price = sum(entry["price"] for entry in history) / len(history)

    return {
        "history": history,
        "highest_price": highest_price,
        "lowest_price": lowest_price,
        "average_price": average_price,
    }

if __name__ == "__main__":
    product_id = sys.argv[1]
    result = get_price_history(product_id)
    print(json.dumps(result))
