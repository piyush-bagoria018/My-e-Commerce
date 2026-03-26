import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Product from "./src/models/product.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadProducts = () => {
  const productsData = readFileSync(`${__dirname}/products.json`, "utf-8");
  return JSON.parse(productsData);
};

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URL, {
    dbName: "ConnectDB",
  });
  console.log("MongoDB connected");
};

const seedProducts = async () => {
  await connectDB();

  const products = loadProducts();

  const operations = products.map((product) => {
    const slug = slugify(product.name, { lower: true, strict: true });

    return {
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            ...product,
            slug,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Product.bulkWrite(operations);

  console.log(`✓ Seed complete for ${products.length} products.`);
  console.log(`  Inserted: ${result.upsertedCount || 0}`);
  console.log(`  Updated: ${result.modifiedCount || 0}`);
  console.log(`  Matched existing: ${result.matchedCount || 0}`);
};

seedProducts()
  .then(async () => {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Product seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
