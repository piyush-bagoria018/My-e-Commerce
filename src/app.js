import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// import routes
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js"; 
import orderRouter from "./routes/order.routes.js"; // Import order routes
import paymentRouter from './routes/payment.routes.js'; // Import payment routes
import adminRouter from "./routes/admin.routes.js"; // Import admin routes
import wishlistRouter from "./routes/wishlist.routes.js"; // Import wishlist routes

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart", cartRouter); // Add cart routes
app.use("/api/v1/orders", orderRouter); // Add order routes
app.use('/api/v1/payments', paymentRouter); // Add payment routes
app.use("/api/v1/admin", adminRouter); // Add admin routes
app.use("/api/v1/wishlist", wishlistRouter); // Add wishlist routes

export { app };
