import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middlerware.js';

const router = express.Router();

router.route('/create-razorpay-order').post(verifyJWT, createRazorpayOrder);

router.route('/verify-razorpay-payment').post(verifyJWT, verifyRazorpayPayment);

export default router;
