import express from "express";
import { getPriceHistory, checkPriceDropChance, createAlert, getUserAlerts, getAIAnalysis } from "../controllers/priceTracking.controller.js";

const router = express.Router();

router.route("/:productId/history").get(getPriceHistory); // Fetch price history and graph data
router.route("/:productId/drop-chance").get(checkPriceDropChance); // Predict price drop chance
router.route("/:productId/ai-analysis").get(getAIAnalysis); // Get AI-powered analysis
router.route("/:productId/create-alert").post(createAlert); // Create email price alert (no auth needed)
router.route("/alerts/user").get(getUserAlerts); // Get user's alerts by email

export default router;
