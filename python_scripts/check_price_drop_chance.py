import sys
import json
import pickle
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Resolve model path from script directory so it works regardless of process cwd
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "price_drop_model.pkl")

# Load the trained model if present
model = None
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as file:
        model = pickle.load(file)

# Connect to MongoDB
client = MongoClient(os.getenv("MONGODB_URL"))
db = client["ConnectDB"]
products_collection = db["products"]

def calculate_price_drop_chance(product_id):
    # Fetch product price history from MongoDB
    product = products_collection.find_one({"_id": ObjectId(product_id)}, {"priceHistory": 1, "price": 1})
    if not product or "priceHistory" not in product:
        return {"error": "Price history not found for this product"}

    recent_prices = [entry["price"] for entry in product["priceHistory"][-5:]]
    if len(recent_prices) < 2:
        return {"error": "Insufficient price history for prediction"}

    average_price = sum(recent_prices) / len(recent_prices)
    current_price = float(product.get("price", recent_prices[-1]))

    # Fallback heuristic when model file is not available
    if model is None:
        if current_price < average_price:
            drop_chance = 65.0
        elif current_price > average_price:
            drop_chance = 35.0
        else:
            drop_chance = 50.0
        return {"drop_chance": f"{drop_chance:.2f}%"}

    # Prepare the input for the model
    input_features = np.array([[current_price, average_price]])

    # Predict the drop chance
    drop_chance = model.predict_proba(input_features)[0][1] * 100  # Probability of price drop
    return {"drop_chance": f"{drop_chance:.2f}%"}

if __name__ == "__main__":
    product_id = sys.argv[1]
    result = calculate_price_drop_chance(product_id)
    print(json.dumps(result))
