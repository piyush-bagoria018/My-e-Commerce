import { execFile } from "child_process";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import path from "path";
import Product from "../models/Product.js";

// Helper function to execute Python scripts
const runPythonScript = (scriptName, args = []) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../../python_scripts", scriptName);
    execFile("python", [scriptPath, ...args], (error, stdout, stderr) => {
      if (error) {
        return reject(stderr || error.message);
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        reject("Failed to parse Python script output");
      }
    });
  });
};

// Get price history, graph data, and stats
export const getPriceHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId).select("priceHistory");
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const result = await runPythonScript("get_price_history.py", [productId]);

    // Include product price history for graph data
    result.graphData = product.priceHistory.map((entry) => ({
      date: entry.date,
      price: entry.price,
    }));

    res.status(200).json(new ApiResponse(200, result, "Price history fetched successfully"));
  } catch (error) {
    throw new ApiError(500, `Failed to fetch price history: ${error}`);
  }
});

// Set price drop alert
export const setPriceAlert = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { targetPrice } = req.body;

  try {
    const result = await runPythonScript("set_price_alert.py", [productId, req.user._id, targetPrice]);
    res.status(200).json(new ApiResponse(200, result, "Price alert set successfully"));
  } catch (error) {
    throw new ApiError(500, `Failed to set price alert: ${error}`);
  }
});

// Check price drop chances
export const checkPriceDropChance = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId).select("priceHistory");
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const result = await runPythonScript("check_price_drop_chance.py", [productId]);

    // Include current price and average price for context
    const recentPrices = product.priceHistory.slice(-5).map((entry) => entry.price);
    result.currentPrice = recentPrices[recentPrices.length - 1];
    result.averagePrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;

    res.status(200).json(new ApiResponse(200, result, "Price drop chance calculated"));
  } catch (error) {
    throw new ApiError(500, `Failed to calculate price drop chance: ${error}`);
  }
});
