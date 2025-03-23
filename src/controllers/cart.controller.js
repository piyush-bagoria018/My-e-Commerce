import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js'; // Import Product model
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Add product to cart
export const addToCart = asyncHandler(async (req, res, next) => {
    const { userId, productId, quantity } = req.body;
    const product = await Product.findById(productId); // Fetch product details
    if (!product) {
        return next(new ApiError(404, 'Product not found'));
    }
    let cart = await Cart.findOne({ userId });
    if (cart) {
        const productIndex = cart.products.findIndex(p => p.productId == productId);
        if (productIndex > -1) {
            let productItem = cart.products[productIndex];
            productItem.quantity += quantity;
            cart.products[productIndex] = productItem;
        } else {
            cart.products.push({ productId, quantity });
        }
        cart.totalPrice += quantity * product.price;
        cart = await cart.save();
        return res.status(201).json(new ApiResponse(201, cart));
    } else {
        const newCart = await Cart.create({
            userId,
            products: [{ productId, quantity }],
            totalPrice: quantity * product.price
        });
        return res.status(201).json(new ApiResponse(201, newCart));
    }
});

// Get cart by user ID
export const getCart = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).populate('products.productId');
    if (!cart) {
        return next(new ApiError(404, 'Cart not found'));
    }
    return res.status(200).json(new ApiResponse(200, cart));
});

// Update cart product quantity
export const updateCart = asyncHandler(async (req, res, next) => {
    const { userId, productId, quantity } = req.body;
    const product = await Product.findById(productId); // Fetch product details
    if (!product) {
        return next(new ApiError(404, 'Product not found'));
    }
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return next(new ApiError(404, 'Cart not found'));
    }
    const productIndex = cart.products.findIndex(p => p.productId == productId);
    if (productIndex > -1) {
        let productItem = cart.products[productIndex];
        productItem.quantity = quantity;
        cart.products[productIndex] = productItem;
        cart.totalPrice = await cart.products.reduce(async (total, item) => {
            const prod = await Product.findById(item.productId);
            return total + item.quantity * prod.price;
        }, 0);
        await cart.save();
        return res.status(200).json(new ApiResponse(200, cart));
    } else {
        return next(new ApiError(404, 'Product not found in cart'));
    }
});

// Remove product from cart
export const removeFromCart = asyncHandler(async (req, res, next) => {
    const { userId, productId } = req.body;
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        return next(new ApiError(404, 'Cart not found'));
    }
    const productIndex = cart.products.findIndex(p => p.productId == productId);
    if (productIndex > -1) {
        cart.products.splice(productIndex, 1);
        cart.totalPrice = await cart.products.reduce(async (total, item) => {
            const prod = await Product.findById(item.productId);
            return total + item.quantity * prod.price;
        }, 0);
        await cart.save();
        return res.status(200).json(new ApiResponse(200, cart));
    } else {
        return next(new ApiError(404, 'Product not found in cart'));
    }
});
