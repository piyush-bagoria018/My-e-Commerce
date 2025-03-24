import Order from '../models/order.model.js';
import Product from '../models/product.model.js'; // Import Product model
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Create a new order
export const createOrder = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
        throw new ApiError(400, 'No order items provided');
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (!product) {
            throw new ApiError(404, `Product not found: ${item.product}`);
        }
        item.price = product.price;
        totalPrice += item.price * item.quantity;
    }

    const order = new Order({
        user: req.user.id,
        orderItems,
        shippingAddress,
        paymentMethod,
        totalPrice
    });

    await order.save();
    res.status(201).json(new ApiResponse(201, order, 'Order placed successfully'));
});

// Get all orders for a user
export const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user.id }).populate('orderItems.product');
    res.status(200).json(new ApiResponse(200, orders, 'Orders fetched successfully'));
});

// Get a single order by ID
export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId).populate('orderItems.product');
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    res.status(200).json(new ApiResponse(200, order, 'Order details fetched'));
});

// Update order to paid
export const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    order.paymentStatus = 'paid';
    await order.save();
    res.status(200).json(new ApiResponse(200, order, 'Order payment updated'));
});

// Update order delivery status
export const updateOrderDeliveryStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    if (!['Pending', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
        throw new ApiError(400, 'Invalid delivery status');
    }
    order.deliveryStatus = status;
    await order.save();
    res.status(200).json(new ApiResponse(200, order, `Order marked as ${status.toLowerCase()}`));
});

// Cancel an order by ID
export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    order.deliveryStatus = 'Cancelled';
    await order.save();
    await Order.findByIdAndDelete(req.params.orderId); // Remove the order from the database
    res.status(200).json(new ApiResponse(200, {}, 'Order cancelled and removed successfully'));
});
