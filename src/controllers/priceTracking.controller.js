import { execFile } from "child_process";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/product.model.js";
import Alert from "../models/alert.model.js";
import { sendPriceAlertEmail } from "../services/email.service.js";
import { generatePriceAnalysis } from "../utils/priceAnalysis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AI_CACHE_TTL_MS = 60 * 60 * 1000;
const RECOMMENDATION_CACHE_TTL_MS = 2 * 60 * 1000;
const recommendationCache = new Map();

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

const buildLiveGraphData = (priceHistory = [], currentPrice) => {
  const graphData = priceHistory.map((entry) => ({
    date: entry.date,
    price: entry.price,
  }));

  const normalizedCurrentPrice = Number(currentPrice);

  if (!Number.isFinite(normalizedCurrentPrice)) {
    return graphData;
  }

  const lastPoint = graphData[graphData.length - 1];
  const nowIso = new Date().toISOString();

  if (!lastPoint) {
    return [
      {
        date: nowIso,
        price: normalizedCurrentPrice,
      },
    ];
  }

  const lastPointDate = new Date(lastPoint.date);
  const isSameCalendarDay = !Number.isNaN(lastPointDate.getTime())
    && lastPointDate.toDateString() === new Date().toDateString();

  if (lastPoint.price !== normalizedCurrentPrice || !isSameCalendarDay) {
    graphData.push({
      date: nowIso,
      price: normalizedCurrentPrice,
    });
  }

  return graphData;
};

const buildHistoryResultFromProduct = (product) => {
  const normalizedHistory = (product.priceHistory || [])
    .map((entry) => ({
      date: entry?.date ? new Date(entry.date).toISOString() : null,
      price: Number(entry?.price),
    }))
    .filter((entry) => entry.date && Number.isFinite(entry.price));

  if (!normalizedHistory.length) {
    return null;
  }

  const prices = normalizedHistory.map((entry) => entry.price);
  const highestPrice = Math.max(...prices);
  const lowestPrice = Math.min(...prices);
  const averagePrice = prices.reduce((sum, value) => sum + value, 0) / prices.length;

  return {
    history: normalizedHistory,
    highest_price: highestPrice,
    lowest_price: lowestPrice,
    average_price: averagePrice,
    current_price: Number(product.price ?? normalizedHistory[normalizedHistory.length - 1].price),
  };
};

const getCachedRecommendation = (productId) => {
  const cached = recommendationCache.get(productId);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > RECOMMENDATION_CACHE_TTL_MS) {
    recommendationCache.delete(productId);
    return null;
  }

  return cached.value;
};

const setCachedRecommendation = (productId, recommendation) => {
  recommendationCache.set(productId, {
    value: recommendation,
    timestamp: Date.now(),
  });
};

// Get price history, graph data, and stats
export const getPriceHistory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId).select("price priceHistory");
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const result = buildHistoryResultFromProduct(product);
    if (!result) {
      throw new ApiError(400, "Price history not found for this product");
    }

    // Include live current price as the latest chart point so the trend ends on today's visible price
    result.graphData = buildLiveGraphData(product.priceHistory, product.price);

    result.currentPrice = Number(product.price);

    res.status(200).json(new ApiResponse(200, result, "Price history fetched successfully"));
  } catch (error) {
    throw new ApiError(500, `Failed to fetch price history: ${error}`);
  }
});

// Check price drop chances and build unified recommendation
export const checkPriceDropChance = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const cachedRecommendation = getCachedRecommendation(productId);
    if (cachedRecommendation) {
      return res.status(200).json(new ApiResponse(200, cachedRecommendation, "Recommendation generated (cache hit)"));
    }

    const product = await Product.findById(productId).select("price priceHistory");
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const dropChanceResult = await runPythonScript("check_price_drop_chance.py", [productId]);
    const historyResult = buildHistoryResultFromProduct(product);
    if (!historyResult?.history || historyResult.history.length === 0) {
      throw new ApiError(400, "Insufficient price history for recommendation");
    }

    // Extract key values
    const dropProbability = parseFloat(dropChanceResult.drop_chance); // e.g., 73.45 from "73.45%"
    const currentPrice = Number(product.price ?? historyResult.history[historyResult.history.length - 1].price);
    const averagePrice = historyResult.average_price;
    const minPrice = historyResult.lowest_price;
    const maxPrice = historyResult.highest_price;
    const historyWindowDays = Math.min(90, historyResult.history.length);

    // Calculate price comparison metrics
    const percentBelowAverage = ((averagePrice - currentPrice) / averagePrice) * 100;

    // Build recommendation verdict and confidence
    let verdict, reason, confidence;

    if (dropProbability > 60 && percentBelowAverage > 5) {
      // Strong signal + good price
      verdict = "Buy Now";
      reason = `Price is ${percentBelowAverage.toFixed(1)}% below ${historyWindowDays}-day average with ${dropProbability.toFixed(0)}% drop probability`;
      confidence = "high";
    } else if (dropProbability > 40 && percentBelowAverage > 0) {
      // Moderate signal + acceptable price
      verdict = "Good Time";
      reason = `Moderate drop probability (${dropProbability.toFixed(0)}%) and price near average`;
      confidence = "medium";
    } else if (dropProbability > 20) {
      // Weak signal but possible
      verdict = "Wait";
      reason = `Lower drop probability (${dropProbability.toFixed(0)}%). Check again soon`;
      confidence = "low";
    } else {
      // No strong signal
      verdict = "Not Ideal";
      reason = `Low drop probability (${dropProbability.toFixed(0)}%). Price may stay steady`;
      confidence = "low";
    }

    // Build unified response
    const recommendation = {
      verdict,
      reason,
      confidence,
      dropProbability: Math.round(dropProbability),
      fairRange: {
        low: Math.floor(minPrice),
        high: Math.ceil(maxPrice),
      },
      currentPrice: Math.round(currentPrice),
    };

    setCachedRecommendation(productId, recommendation);

    res.status(200).json(new ApiResponse(200, recommendation, "Recommendation generated"));
  } catch (error) {
    throw new ApiError(500, `Failed to calculate price drop chance: ${error}`);
  }
});

// Create price alert
export const createAlert = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { userEmail, targetPrice } = req.body;

  // Validation
  if (!userEmail || !targetPrice) {
    throw new ApiError(400, "Email and target price are required");
  }

  if (targetPrice <= 0) {
    throw new ApiError(400, "Target price must be greater than 0");
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check if alert already exists for this product and email
    const existingAlert = await Alert.findOne({ productId, userEmail });
    if (existingAlert) {
      throw new ApiError(400, "Alert already exists for this product and email");
    }

    // Create alert
    const alert = await Alert.create({
      productId,
      userEmail,
      targetPrice,
    });

    res.status(201).json(new ApiResponse(201, alert, "Price alert created successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to create price alert: ${error.message}`);
  }
});

// Get user's alerts
export const getUserAlerts = asyncHandler(async (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    throw new ApiError(400, "Email is required");
  }

  try {
    const alerts = await Alert.find({ userEmail }).populate("productId", "name price");
    res.status(200).json(new ApiResponse(200, alerts, "User alerts fetched successfully"));
  } catch (error) {
    throw new ApiError(500, `Failed to fetch user alerts: ${error.message}`);
  }
});

// Get AI-powered price analysis explanation
export const getAIAnalysis = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId).select("name price priceHistory aiCache");
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const cachedAt = product.aiCache?.cachedAt ? new Date(product.aiCache.cachedAt).getTime() : null;
    const cachedAnalysis = product.aiCache?.analysis;
    const hasFreshCache = cachedAt && Date.now() - cachedAt < AI_CACHE_TTL_MS;

    if (
      hasFreshCache
      && cachedAnalysis
      && cachedAnalysis.verdict
      && Number.isFinite(cachedAnalysis.dropProbability)
    ) {
      const analysis = {
        verdict: cachedAnalysis.verdict,
        dropProbability: cachedAnalysis.dropProbability,
        mlReason: cachedAnalysis.mlReason,
        aiExplanation: product.aiCache.explanation,
        aiConfidence: product.aiCache.confidence,
        fairRange: {
          low: cachedAnalysis.fairRange?.low,
          high: cachedAnalysis.fairRange?.high,
        },
        currentPrice: cachedAnalysis.currentPrice,
      };

      setCachedRecommendation(productId, {
        verdict: analysis.verdict,
        reason: analysis.aiExplanation || `${analysis.dropProbability}% drop probability`,
        confidence: analysis.aiConfidence || "medium",
        dropProbability: analysis.dropProbability,
        fairRange: {
          low: analysis.fairRange?.low,
          high: analysis.fairRange?.high,
        },
        currentPrice: analysis.currentPrice,
      });

      return res.status(200).json(new ApiResponse(200, analysis, "AI analysis fetched from cache"));
    }

    // Fetch ML prediction and history stats
    const dropChanceResult = await runPythonScript("check_price_drop_chance.py", [productId]);
    const historyResult = buildHistoryResultFromProduct(product);

    if (!historyResult?.history || historyResult.history.length === 0) {
      throw new ApiError(400, "Insufficient price history for AI analysis");
    }

    // Extract data for AI analysis
    const dropProbability = parseFloat(dropChanceResult.drop_chance);
    const currentPrice = Number(product.price ?? historyResult.history[historyResult.history.length - 1].price);
    const averagePrice = historyResult.average_price;
    const minPrice = historyResult.lowest_price;
    const maxPrice = historyResult.highest_price;
    const recentPrices = historyResult.history.slice(-7).map((h) => h.price);

    // Determine ML verdict
    const percentBelowAverage = ((averagePrice - currentPrice) / averagePrice) * 100;
    let verdict;
    if (dropProbability > 60 && percentBelowAverage > 5) {
      verdict = "Buy Now";
    } else if (dropProbability > 40 && percentBelowAverage > 0) {
      verdict = "Good Time";
    } else if (dropProbability > 20) {
      verdict = "Wait";
    } else {
      verdict = "Not Ideal";
    }

    // Generate AI explanation
    const aiAnalysis = await generatePriceAnalysis({
      productName: product.name,
      currentPrice,
      averagePrice,
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      dropProbability: Math.round(dropProbability),
      verdict,
      recentPrices,
    });

    // Combine ML prediction with AI explanation
    const analysis = {
      verdict,
      dropProbability: Math.round(dropProbability),
      mlReason: `${dropProbability.toFixed(0)}% drop probability`,
      aiExplanation: aiAnalysis.explanation || "Unable to generate AI analysis at this time.",
      aiConfidence: aiAnalysis.confidence,
      fairRange: {
        low: Math.floor(minPrice),
        high: Math.ceil(maxPrice),
      },
      currentPrice: Math.round(currentPrice),
    };

    setCachedRecommendation(productId, {
      verdict: analysis.verdict,
      reason: analysis.mlReason,
      confidence: analysis.aiConfidence || "medium",
      dropProbability: analysis.dropProbability,
      fairRange: {
        low: analysis.fairRange.low,
        high: analysis.fairRange.high,
      },
      currentPrice: analysis.currentPrice,
    });

    product.aiCache = {
      explanation: analysis.aiExplanation,
      confidence: analysis.aiConfidence,
      cachedAt: new Date(),
      analysis: {
        verdict: analysis.verdict,
        dropProbability: analysis.dropProbability,
        mlReason: analysis.mlReason,
        fairRange: {
          low: analysis.fairRange.low,
          high: analysis.fairRange.high,
        },
        currentPrice: analysis.currentPrice,
      },
    };

    await product.save();

    res.status(200).json(new ApiResponse(200, analysis, "AI analysis generated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to generate AI analysis: ${error.message}`);
  }
});
