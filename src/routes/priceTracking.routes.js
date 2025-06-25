import express from "express";
import { getPriceHistory, setPriceAlert, checkPriceDropChance } from "../controllers/priceTracking.controller.js";
import { verifyJWT } from "../middlewares/auth.middlerware.js";

const router = express.Router();

router.route("/:productId/history").get(getPriceHistory); // Fetch price history and graph data
router.route("/:productId/drop-chance").get(checkPriceDropChance); // Predict price drop chance
router.route("/:productId/alert").post(verifyJWT, setPriceAlert); // Set price drop alert

export default router;
