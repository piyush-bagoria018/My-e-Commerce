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


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def percent_diff(current_value, base_value):
    base = max(abs(base_value), 1.0)
    return ((current_value - base_value) / base) * 100.0


def clamp(value, min_value, max_value):
    return max(min_value, min(max_value, value))


def build_feature_vector(previous_prices, current_price):
    history_window = previous_prices[-7:] if previous_prices else [current_price]

    average_price = sum(history_window) / len(history_window)
    min_price = min(history_window)
    max_price = max(history_window)

    if len(history_window) >= 3:
        trend = history_window[-1] - history_window[-3]
    else:
        trend = 0.0

    volatility = float(np.std(history_window)) if len(history_window) >= 2 else 0.0

    price_vs_average = percent_diff(current_price, average_price)
    price_vs_low = percent_diff(current_price, min_price)
    price_vs_high = percent_diff(current_price, max_price)

    return [price_vs_average, price_vs_low, price_vs_high, trend, volatility]


def fallback_probability(feature_vector):
    price_vs_average, _, _, trend, volatility = feature_vector

    score = 50.0
    score -= 0.75 * price_vs_average
    score -= 0.30 * trend
    score += 0.15 * volatility

    return clamp(score, 5.0, 95.0)

def calculate_price_drop_chance(product_id):
    # Fetch product price history from MongoDB
    product = products_collection.find_one({"_id": ObjectId(product_id)}, {"priceHistory": 1, "price": 1})
    if not product or "priceHistory" not in product:
        return {"error": "Price history not found for this product"}

    history_prices = [safe_float(entry.get("price")) for entry in product["priceHistory"]]
    if len(history_prices) < 2:
        return {"error": "Insufficient price history for prediction"}

    current_price = safe_float(product.get("price", history_prices[-1]))
    feature_vector = build_feature_vector(history_prices, current_price)

    # Fallback heuristic when model file is not available
    if model is None:
        drop_chance = fallback_probability(feature_vector)
        return {"drop_chance": f"{drop_chance:.2f}%"}

    # Prepare the input for the model
    input_features = np.array([feature_vector], dtype=float)

    # Predict the drop chance
    drop_chance = model.predict_proba(input_features)[0][1] * 100  # Probability of price drop
    return {"drop_chance": f"{drop_chance:.2f}%"}

if __name__ == "__main__":
    product_id = sys.argv[1]
    result = calculate_price_drop_chance(product_id)
    print(json.dumps(result))
