import express from 'express';
import { addToCart, getCart, updateCart, removeFromCart } from '../controllers/cart.controller.js';

const router = express.Router();

router.route('/add')
    .post(addToCart);

router.route('/:userId')
    .get(getCart);

router.route('/update/:productId')
    .put(updateCart);

router.route('/remove/:productId')
    .delete(removeFromCart);

export default router;
