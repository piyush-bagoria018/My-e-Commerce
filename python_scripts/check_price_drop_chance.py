import sys
import json
import pickle
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Load the trained model
with open("price_drop_model.pkl", "rb") as file:
    model = pickle.load(file)

# Connect to MongoDB
client = MongoClient(os.getenv("MONGODB_URL"))
db = client["ConnectDB"]
products_collection = db["products"]

def calculate_price_drop_chance(product_id):
    # Fetch product price history from MongoDB
    product = products_collection.find_one({"_id": product_id})
    if not product or "priceHistory" not in product:
        return {"error": "Price history not found for this product"}

    recent_prices = [entry["price"] for entry in product["priceHistory"][-5:]]
    if len(recent_prices) < 2:
        return {"error": "Insufficient price history for prediction"}

    average_price = sum(recent_prices) / len(recent_prices)
    current_price = recent_prices[-1]

    # Prepare the input for the model
    input_features = np.array([[current_price, average_price]])

    # Predict the drop chance
    drop_chance = model.predict_proba(input_features)[0][1] * 100  # Probability of price drop
    return {"drop_chance": f"{drop_chance:.2f}%"}

if __name__ == "__main__":
    product_id = sys.argv[1]
    result = calculate_price_drop_chance(product_id)
    print(json.dumps(result))
