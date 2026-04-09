import cron from "node-cron";
import Alert from "../models/alert.model.js";
import Product from "../models/product.model.js";
import { sendPriceAlertEmail } from "./email.service.js";

let cronJob = null;

export const startAlertScheduler = () => {
  // Run every hour at minute 0 (HH:00:00)
  cronJob = cron.schedule("0 * * * *", async () => {
    console.log("[ALERT SCHEDULER] Starting price alert check...");
    await checkAndNotifyAlerts();
  });

  console.log("[ALERT SCHEDULER] Alert scheduler started - runs every hour");
};

export const stopAlertScheduler = () => {
  if (cronJob) {
    cronJob.stop();
    console.log("[ALERT SCHEDULER] Alert scheduler stopped");
  }
};

const checkAndNotifyAlerts = async () => {
  try {
    // Find all active alerts (not yet notified)
    const activeAlerts = await Alert.find({ notified: false }).populate("productId");

    if (activeAlerts.length === 0) {
      console.log("[ALERT SCHEDULER] No active alerts to check");
      return;
    }

    console.log(`[ALERT SCHEDULER] Checking ${activeAlerts.length} active alert(s)...`);

    for (const alert of activeAlerts) {
      try {
        const product = alert.productId;

        if (!product || !product.priceHistory || product.priceHistory.length === 0) {
          console.log(`[ALERT SCHEDULER] Skipping alert for product ${alert.productId} - no price history`);
          continue;
        }

        const currentPrice = Number(product.price);

        if (!Number.isFinite(currentPrice)) {
          console.log(`[ALERT SCHEDULER] Skipping alert for product ${alert.productId} - invalid current price`);
          continue;
        }

        // Check if current price is at or below target price
        if (currentPrice <= alert.targetPrice) {
          console.log(
            `[ALERT SCHEDULER] Alert triggered for ${product.name} (Current: ₹${currentPrice}, Target: ₹${alert.targetPrice})`
          );

          // Send email
          await sendPriceAlertEmail({
            userEmail: alert.userEmail,
            productName: product.name,
            targetPrice: alert.targetPrice,
            currentPrice,
          });

          // Mark alert as notified
          alert.notified = true;
          alert.notifiedAt = new Date();
          await alert.save();

          console.log(`[ALERT SCHEDULER] Email sent to ${alert.userEmail}`);
        } else {
          console.log(
            `[ALERT SCHEDULER] Alert ${alert._id} - Price not yet at target (Current: ₹${currentPrice}, Target: ₹${alert.targetPrice})`
          );
        }
      } catch (error) {
        console.error(`[ALERT SCHEDULER] Error processing alert ${alert._id}:`, error.message);
      }
    }

    console.log("[ALERT SCHEDULER] Price alert check completed");
  } catch (error) {
    console.error("[ALERT SCHEDULER] Error during alert check:", error);
  }
};

// Allow manual trigger for testing
export const checkAlertsNow = async () => {
  console.log("[ALERT SCHEDULER] Manual alert check triggered");
  await checkAndNotifyAlerts();
};
