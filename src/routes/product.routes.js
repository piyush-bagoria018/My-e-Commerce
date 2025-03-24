import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { upload } from '../middlewares/multerFileUpload.middleware.js';
import { verifyJWT } from '../middlewares/auth.middlerware.js';

const router = express.Router();

// Route to create a product
router.route("/create").post(verifyJWT, upload.array('productImages', 5), createProduct);

// Route to get all products
router.route("/all").get(getProducts);

router.route('/:id')
    .get(getProductById);

router.route('/:id/update')
    .put(verifyJWT, upload.array('productImages', 5), updateProduct);

router.route('/:id/delete')
    .delete(deleteProduct);

export default router;
