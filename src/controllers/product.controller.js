import Product from '../models/product.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/Cloudinary.js';

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
  if (price && price !== product.price) {
    product.priceHistory.push({ date: new Date(), price });
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.stock = stock || product.stock;
  product.isFeatured = isFeatured || product.isFeatured;
  product.ratings = ratings || product.ratings;
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
