import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { upload } from '../middlewares/multerFileUpload.middleware.js';

const router = express.Router();

router.route('/create')
    .post(upload.array('productImages', 5), createProduct);

router.route('/all')
    .get(getProducts);

router.route('/:id')
    .get(getProductById)
    .put(upload.array('productImages', 5), updateProduct)
    .delete(deleteProduct);

export default router;
