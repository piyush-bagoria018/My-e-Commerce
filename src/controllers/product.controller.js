import Product from '../models/product.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/Cloudinary.js';

const toNumberOrThrow = (value, fieldName) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
  return parsed;
};

const toBooleanOrThrow = (value, fieldName) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ApiError(400, `Invalid ${fieldName}`);
};

export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, category, stock, isFeatured, ratings } = req.body;
  let productImages = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadOnCloudinary(file.path);
      productImages.push(result.secure_url);
    }
  }

  const product = new Product({
    name,
    description,
    price,
    category,
    stock,
    productImages,
    isFeatured,
    ratings,
    priceHistory: [{ date: new Date(), price }], // Initialize price history
  });

  await product.save();
  res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
});

export const getProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json(new ApiResponse(200, products));
});

export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }
  res.status(200).json(new ApiResponse(200, product));
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, category, stock, isFeatured, ratings } = req.body;
  let productImages = req.body.productImages || [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadOnCloudinary(file.path);
      productImages.push(result.secure_url);
    }
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  // Update price history only if the price has changed
  if (typeof price !== 'undefined') {
    const parsedPrice = toNumberOrThrow(price, 'price');
    if (parsedPrice !== product.price) {
      product.priceHistory.push({ date: new Date(), price: parsedPrice });
    }
    product.price = parsedPrice;
  }

  if (typeof name !== 'undefined') product.name = name;
  if (typeof description !== 'undefined') product.description = description;
  if (typeof category !== 'undefined') product.category = category;
  if (typeof stock !== 'undefined') product.stock = toNumberOrThrow(stock, 'stock');
  if (typeof isFeatured !== 'undefined') {
    product.isFeatured = toBooleanOrThrow(isFeatured, 'isFeatured');
  }
  if (typeof ratings !== 'undefined') product.ratings = toNumberOrThrow(ratings, 'ratings');
  product.productImages = productImages.length > 0 ? productImages : product.productImages;

  await product.save();
  res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  // Delete the images from Cloudinary if they exist
  if (product.productImages) {
    for (const imageUrl of product.productImages) {
      await deleteFromCloudinary(imageUrl);
    }
  }

  res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully'));
});
