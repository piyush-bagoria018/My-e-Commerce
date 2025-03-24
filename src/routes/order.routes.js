import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderToPaid,
    updateOrderDeliveryStatus,
    cancelOrder
} from '../controllers/order.controller.js';
import { verifyJWT } from '../middlewares/auth.middlerware.js';

const router = express.Router();

router.route('/create')
    .post(verifyJWT, createOrder);

router.route('/all')
    .get(verifyJWT, getOrders);

router.route('/:orderId')
    .get(verifyJWT, getOrderById);

router.route('/:orderId/cancel')
    .delete(verifyJWT, cancelOrder);

router.route('/:orderId/pay')
    .put(verifyJWT, updateOrderToPaid);

router.route('/:orderId/delivery-status')
    .put(verifyJWT, updateOrderDeliveryStatus);

export default router;
