import express from 'express';
import { addToCart, getCart, updateCart, removeFromCart } from '../controllers/cart.controller.js';
import { verifyJWT } from '../middlewares/auth.middlerware.js';

const router = express.Router();

router.route('/add')
    .post(verifyJWT, addToCart);

router.route('/:userId')
    .get(verifyJWT, getCart);

router.route('/update/:productId')
    .put(verifyJWT, updateCart);

router.route('/remove/:productId')
    .delete(verifyJWT, removeFromCart);

export default router;
