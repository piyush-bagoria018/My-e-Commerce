import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "../controllers/wishlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middlerware.js";

const router = express.Router();

router.route("/").get(verifyJWT, getWishlist);
router.route("/add").post(verifyJWT, addToWishlist);
router.route("/remove").delete(verifyJWT, removeFromWishlist);

export default router;
