import pandas as pd
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

# Fetch real data from MongoDB
def fetch_training_data():
    products = products_collection.find({}, {"priceHistory": 1})
    data = []
    for product in products:
        price_history = product.get("priceHistory", [])
        if len(price_history) > 1:
            for i in range(1, len(price_history)):
                current_price = price_history[i]["price"]
                average_price = sum(entry["price"] for entry in price_history[:i]) / i
                drop_chance = 1 if current_price < average_price else 0
                data.append({"price": current_price, "average_price": average_price, "drop_chance": drop_chance})
    return pd.DataFrame(data)

# Fetch data
df = fetch_training_data()

# Features and target
X = df[["price", "average_price"]]
y = df["drop_chance"]

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = LogisticRegression()
model.fit(X_train, y_train)

# Save the model
with open("price_drop_model.pkl", "wb") as file:
    pickle.dump(model, file)

print("Model trained and saved successfully!")
