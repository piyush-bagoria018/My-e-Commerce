import express from "express";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middlerware.js";
import { upload } from "../middlewares/multerFileUpload.middleware.js";
import {
    getAllUsers,
    deleteUser,
    getAllOrders,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(verifyJWT, verifyAdmin);

router.route("/users").get(getAllUsers);
router.route("/users/:userId").delete(deleteUser);

router.route("/orders").get(getAllOrders);

router.route("/products").get(getAllProducts) // Get all products
router.route("/createProduct").post(upload.array("productImages", 5), createProduct); // Create a product

router.route("/updateProduct/:productId").put(upload.array("productImages", 5), updateProduct) // Update a product
router.route("/deleteProduct/:productId").delete(deleteProduct); // Delete a product

export default router;
