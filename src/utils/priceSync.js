import { ApiError } from './ApiError.js';

export const normalizePrice = (value, fieldName = 'price') => {
  const parsedPrice = Number(value);

  if (Number.isNaN(parsedPrice)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  if (parsedPrice < 0) {
    throw new ApiError(400, `${fieldName} must be greater than or equal to 0`);
  }

  return parsedPrice;
};

export const syncProductPrice = (product, nextPrice) => {
  const normalizedPrice = normalizePrice(nextPrice, 'price');

  if (!Array.isArray(product.priceHistory)) {
    product.priceHistory = [];
  }

  if (product.priceHistory.length === 0) {
    product.priceHistory.push({
      date: new Date(),
      price: normalizedPrice,
    });
  } else if (Number(product.price) !== normalizedPrice) {
    product.priceHistory.push({
      date: new Date(),
      price: normalizedPrice,
    });
  }

  product.price = normalizedPrice;

  return normalizedPrice;
};