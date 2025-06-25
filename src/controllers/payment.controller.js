import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Order from '../models/order.model.js';
import Payment from '../models/payment.model.js'; // Import Payment model

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new ApiError(400, 'Order ID is required');
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    if (!req.user || !req.user.id) {
        throw new ApiError(401, 'User not authenticated');
    }

    try {
        const options = {
            amount: order.totalPrice * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${order._id}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Save payment information in the database
        const payment = new Payment({
            order: order._id,
            user: req.user.id,
            paymentIntentId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            status: 'pending',
        });

        await payment.save();

        res.status(200).json(new ApiResponse(200, razorpayOrder, 'Razorpay order created successfully'));
    } catch (error) {
        throw new ApiError(500, 'Failed to create Razorpay order');
    }
});

// Verify Razorpay Payment
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, 'All payment verification fields are required');
    }

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) {
        throw new ApiError(400, 'Invalid payment signature');
    }

    const payment = await Payment.findOne({ paymentIntentId: razorpay_order_id });
    if (!payment) {
        throw new ApiError(404, 'Payment record not found');
    }

    payment.status = 'succeeded';
    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
        order.paymentStatus = 'paid';
        await order.save();
    } else {
        throw new ApiError(404, 'Order not found for the payment');
    }

    res.status(200).json(new ApiResponse(200, {}, 'Payment verified successfully'));
});
