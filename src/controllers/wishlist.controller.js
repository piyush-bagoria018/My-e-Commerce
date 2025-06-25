import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Add product to wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let wishlist = await Wishlist.findOne({ userId: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId: req.user._id, products: [productId] });
  } else if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  res.status(200).json(new ApiResponse(200, wishlist, "Product added to wishlist"));
});

// Remove product from wishlist
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const wishlist = await Wishlist.findOne({ userId: req.user._id });
  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
  await wishlist.save();

  res.status(200).json(new ApiResponse(200, wishlist, "Product removed from wishlist"));
});

// Get user's wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate("products");
  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  res.status(200).json(new ApiResponse(200, wishlist, "Wishlist fetched successfully"));
});
