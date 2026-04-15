import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import pickle
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

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


def build_feature_row(previous_prices, current_price):
    history_window = previous_prices[-7:] if previous_prices else [current_price]

    average_price = sum(history_window) / len(history_window)
    min_price = min(history_window)
    max_price = max(history_window)

    if len(history_window) >= 3:
        trend = history_window[-1] - history_window[-3]
    else:
        trend = 0.0

    volatility = float(np.std(history_window)) if len(history_window) >= 2 else 0.0

    return {
        "price_vs_average": percent_diff(current_price, average_price),
        "price_vs_low": percent_diff(current_price, min_price),
        "price_vs_high": percent_diff(current_price, max_price),
        "trend": trend,
        "volatility": volatility,
    }

# Fetch real data from MongoDB
def fetch_training_data():
    products = products_collection.find({}, {"priceHistory": 1})
    data = []
    for product in products:
        price_history = product.get("priceHistory", [])
        if len(price_history) > 2:
            normalized_history = [safe_float(entry.get("price")) for entry in price_history]

            # Predict whether the NEXT price point drops below the current point.
            for i in range(1, len(normalized_history) - 1):
                current_price = normalized_history[i]
                next_price = normalized_history[i + 1]
                previous_prices = normalized_history[:i]

                feature_row = build_feature_row(previous_prices, current_price)
                feature_row["drop_chance"] = 1 if next_price < current_price else 0
                data.append(feature_row)

    return pd.DataFrame(data)

# Fetch data
df = fetch_training_data()

if df.empty:
    raise ValueError("Not enough price history data to train the model.")

# Features and target
X = df[["price_vs_average", "price_vs_low", "price_vs_high", "trend", "volatility"]]
y = df["drop_chance"]

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Save the model
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "price_drop_model.pkl")

with open(MODEL_PATH, "wb") as file:
    pickle.dump(model, file)

print("Model trained and saved successfully!")
