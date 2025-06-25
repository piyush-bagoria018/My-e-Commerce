import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/Cloudinary.js";

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
    });

    await product.save();
    res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
});

// Update an existing product
export const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock, isFeatured, ratings } = req.body;
    let productImages = req.body.productImages || [];

    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const result = await uploadOnCloudinary(file.path);
            productImages.push(result.secure_url);
        }
    }

    const product = await Product.findByIdAndUpdate(
        req.params.productId,
        { name, description, price, category, stock, productImages, isFeatured, ratings },
        { new: true }
    );

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

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


