import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiClient = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const PRICE_ANALYSIS_CACHE_TTL = 3600000;
const priceAnalysisCache = new Map();

function buildFallbackExplanation({ verdict, currentPrice, averagePrice }) {
  if (verdict === "Buy Now") {
    return `Price is below average at Rs ${Math.round(currentPrice)}; good entry point based on recent history.`;
  }
  if (verdict === "Good Time") {
    return `Price is near its average (${Math.round(averagePrice)}), so this is a reasonable time to buy.`;
  }
  if (verdict === "Wait") {
    return "Price still has room to dip based on trend; waiting may give a better deal.";
  }
  return "Current price is not attractive versus recent history; wait for a better drop.";
}

/**
 * Generate AI-powered price analysis explanation
 * @param {Object} data - Analysis data
 * @param {string} data.productId - Product ID used for caching
 * @param {string} data.productName - Product name
 * @param {number} data.currentPrice - Current price
 * @param {number} data.averagePrice - Average price from history
 * @param {number} data.lowestPrice - Lowest price in history
 * @param {number} data.highestPrice - Highest price in history
 * @param {number} data.dropProbability - ML-predicted drop probability (0-100)
 * @param {string} data.verdict - ML verdict (Buy Now, Good Time, Wait, Not Ideal)
 * @param {Array} data.recentPrices - Last 7 prices for trend analysis
 * @returns {Promise<string>} AI-generated explanation
 */
export async function generatePriceAnalysis(data) {
  try {
    const {
      productId,
      productName,
      currentPrice,
      averagePrice,
      lowestPrice,
      highestPrice,
      dropProbability,
      verdict,
      recentPrices = [],
    } = data;

    if (productId) {
      const cachedEntry = priceAnalysisCache.get(productId);
      if (
        cachedEntry &&
        Date.now() - cachedEntry.timestamp < PRICE_ANALYSIS_CACHE_TTL
      ) {
        return cachedEntry.result;
      }
    }

    // Calculate trend
    const priceChange =
      recentPrices.length >= 2
        ? recentPrices[recentPrices.length - 1] - recentPrices[0]
        : 0;
    const percentChange = averagePrice ? (priceChange / averagePrice) * 100 : 0;
    const trend =
      priceChange > 0 ? "rising" : priceChange < 0 ? "falling" : "stable";

    if (!geminiClient) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    // Build context for Gemini
    const analysisContext = `
Product: ${productName}
Current Price: Rs ${currentPrice}
Average Price (90-day): Rs ${averagePrice}
Lowest Price: Rs ${lowestPrice}
Highest Price: Rs ${highestPrice}
Price Trend (last 7 days): ${trend} (${percentChange > 0 ? "+" : ""}${percentChange.toFixed(1)}%)
ML Drop Probability: ${dropProbability}%
ML Verdict: ${verdict}
Savings vs Average: Rs ${(averagePrice - currentPrice).toFixed(0)}
Savings vs Low: Rs ${(lowestPrice - currentPrice).toFixed(0)}
`;

    const prompt = `You are a shopping assistant analyzing product prices. Based on the following data, provide a short, actionable one-sentence explanation of why the user should buy now, wait, or not buy. Be specific about prices and timing. Use an informal, conversational tone.

${analysisContext}

Respond with ONLY a single sentence (no more than 20 words) explaining the buying recommendation. Do not use markdown, bullets, or extra lines. Examples:
- "This is 12% below average—last time it was this low was in January."
- "Price is historically high right now; wait for weekend sales."
- "Sweet spot! Lowest in 60 days, typically rises in spring."

STRICT RULES:
- Never say "highest price ever" or "lowest price ever"
- Never say "all-time high" or "all-time low"
- Always say "90-day high" or "90-day low" instead
- Never mention specific month names unless provided in data
- Keep response under 20 words
- Be factual, not dramatic`;

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const explanation = (response.text() || "").replace(/\s+/g, " ").trim();

    if (!explanation) {
      throw new Error("Gemini returned empty explanation");
    }

    const freshResult = {
      success: true,
      explanation,
      confidence: "high",
    };

    if (productId) {
      priceAnalysisCache.set(productId, {
        result: freshResult,
        timestamp: Date.now(),
      });
    }

    return freshResult;
  } catch (error) {
    console.error("[AI ANALYSIS] Error generating analysis:", error.message);

    // Fallback explanation based on ML verdict
    return {
      success: false,
      explanation: buildFallbackExplanation(data),
      confidence: "low",
      error: error.message,
    };
  }
}
