import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/product.model.js";

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URL, {
    dbName: "ConnectDB",
  });
  console.log("MongoDB connected");
};

const PRICE_HISTORY_DAYS = 90;

const generatePriceHistory = (basePrice) => {
  const history = [];
  let currentPrice = basePrice;
  const today = new Date();

  for (let i = PRICE_HISTORY_DAYS; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const change = (Math.random() - 0.5) * 0.1 * currentPrice;
    currentPrice = Math.max(basePrice * 0.7, currentPrice + change);
    currentPrice = Math.round(currentPrice);

    history.push({ date: date.toISOString(), price: currentPrice });
  }

  return history;
};

const seedPriceHistory = async () => {
  await connectDB();

  const products = await Product.find();

  if (products.length === 0) {
    console.log("No products found. Add some products first.");
    process.exit(1);
  }

  console.log(`Found ${products.length} products. Seeding price history...`);

  for (const product of products) {
    const history = generatePriceHistory(product.price);
    await Product.collection.updateOne(
      { _id: product._id },
      { $set: { priceHistory: history } }
    );
    console.log(`✓ Seeded: ${product.name}`);
  }

  console.log("All products seeded successfully.");
  mongoose.disconnect();
};

seedPriceHistory();