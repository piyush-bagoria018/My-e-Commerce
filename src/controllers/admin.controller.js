import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/Cloudinary.js";
import { syncProductPrice, normalizePrice } from "../utils/priceSync.js";

const toNumberOrThrow = (value, fieldName) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }
    return parsed;
};

const toBooleanOrThrow = (value, fieldName) => {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new ApiError(400, `Invalid ${fieldName}`);
};

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
    // Fetch only users with the role "user"
    const users = await User.find({ role: "user" }).select("-password -refreshToken");
    res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

// Delete a user
export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

// Get all orders
export const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().populate("user orderItems.product");
    res.status(200).json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

// Get all products
export const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find();
    res.status(200).json(new ApiResponse(200, products, "Products fetched successfully"));
});

// Create a new product
export const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock, isFeatured, ratings } = req.body;
    let productImages = [];
    const normalizedPrice = normalizePrice(price, "price");

    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const result = await uploadOnCloudinary(file.path);
            productImages.push(result.secure_url);
        }
    }

    const product = new Product({
        name,
        description,
        price: normalizedPrice,
        category,
        stock,
        productImages,
        isFeatured,
        ratings,
    });

    syncProductPrice(product, normalizedPrice);

    await product.save();
    res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
});

// Update an existing product
export const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock, isFeatured, ratings } = req.body;
    let productImages = req.body.productImages || [];
    const normalizedPrice = typeof price !== "undefined" ? normalizePrice(price, "price") : undefined;

    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const result = await uploadOnCloudinary(file.path);
            productImages.push(result.secure_url);
        }
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (typeof normalizedPrice !== "undefined") {
        syncProductPrice(product, normalizedPrice);
    }

    if (typeof name !== "undefined") product.name = name;
    if (typeof description !== "undefined") product.description = description;
    if (typeof category !== "undefined") product.category = category;
    if (typeof stock !== "undefined") product.stock = toNumberOrThrow(stock, "stock");
    if (typeof isFeatured !== "undefined") {
        product.isFeatured = toBooleanOrThrow(isFeatured, "isFeatured");
    }
    if (typeof ratings !== "undefined") product.ratings = toNumberOrThrow(ratings, "ratings");
    product.productImages = productImages.length > 0 ? productImages : product.productImages;

    await product.save();

    res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
});

// Delete a product
export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Delete the images from Cloudinary if they exist
    if (product.productImages) {
        for (const imageUrl of product.productImages) {
            await deleteFromCloudinary(imageUrl);
        }
    }

    res.status(200).json(new ApiResponse(200, null, "Product deleted successfully"));
});