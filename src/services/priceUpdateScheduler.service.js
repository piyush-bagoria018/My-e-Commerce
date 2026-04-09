import cron from 'node-cron';
import Product from '../models/product.model.js';
import { syncProductPrice } from '../utils/priceSync.js';

let cronJob = null;

const keepLastNinetyDays = (history = []) => {
  const cutoffTime = Date.now() - 90 * 24 * 60 * 60 * 1000;

  return history.filter((entry) => {
    const entryTime = new Date(entry.date).getTime();
    return Number.isFinite(entryTime) && entryTime >= cutoffTime;
  });
};

const getNextDemoPrice = (currentPrice) => {
  const basePrice = Number(currentPrice);
  const volatility = basePrice < 1000 ? 0.06 : basePrice < 5000 ? 0.04 : 0.03;
  const changePercent = 0.01 + Math.random() * volatility;
  const direction = Math.random() > 0.55 ? 1 : -1;

  let nextPrice = Math.max(1, Math.round(basePrice * (1 + direction * changePercent)));

  if (nextPrice === basePrice) {
    nextPrice = Math.max(1, basePrice + (direction > 0 ? 1 : -1));
  }

  return nextPrice;
};

const updateDemoPrices = async () => {
  const products = await Product.find().select('price priceHistory name');

  if (!products.length) {
    console.log('[PRICE UPDATER] No products found to update');
    return;
  }

  let updatedCount = 0;

  for (const product of products) {
    const currentPrice = Number(product.price);

    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      console.log(`[PRICE UPDATER] Skipping ${product.name || product._id} - invalid current price`);
      continue;
    }

    const nextPrice = getNextDemoPrice(currentPrice);

    if (nextPrice === currentPrice) {
      continue;
    }

    syncProductPrice(product, nextPrice);
    product.priceHistory = keepLastNinetyDays(product.priceHistory);

    await product.save();
    updatedCount += 1;
  }

  console.log(`[PRICE UPDATER] Updated ${updatedCount} product price(s)`);
};

export const startPriceUpdateScheduler = () => {
  if (cronJob) {
    return;
  }

  // Run every 6 hours so the demo looks alive without changing prices too aggressively.
  cronJob = cron.schedule('0 */6 * * *', async () => {
    console.log('[PRICE UPDATER] Starting scheduled price update...');

    try {
      await updateDemoPrices();
    } catch (error) {
      console.error('[PRICE UPDATER] Failed to update demo prices:', error);
    }
  });

  console.log('[PRICE UPDATER] Price update scheduler started - runs every 6 hours');
};

export const stopPriceUpdateScheduler = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[PRICE UPDATER] Price update scheduler stopped');
  }
};

export const updatePricesNow = async () => {
  console.log('[PRICE UPDATER] Manual price update triggered');
  await updateDemoPrices();
};