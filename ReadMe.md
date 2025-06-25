# E-commerce Platform

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Price Tracking System (Highlight)](#price-tracking-system-highlight)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Endpoints](#api-endpoints)
- [Python Scripts](#python-scripts)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview
A full-featured e-commerce web application built with Node.js, Express, MongoDB, and Python for advanced price tracking and analytics. The platform supports user authentication, product management, cart, orders, payments (Razorpay), wishlists, admin controls, and a unique price tracking system powered by machine learning. The price tracking system is the main highlight, enabling users to monitor price changes, receive alerts, and get predictions on price drops using real-time data and ML models.

## Features
- User registration, login, JWT authentication
- Product catalog with image uploads (Cloudinary)
- Cart and wishlist management
- Order placement and tracking
- Payment integration with Razorpay
- Admin dashboard for managing users, products, and orders
- **Advanced price tracking system with alerts and drop prediction (Python ML)**
- RESTful API architecture
- Modular, scalable codebase

## Price Tracking System (Highlight)
The price tracking system sets this project apart from typical e-commerce platforms. Key aspects include:

- **Automated Price History Tracking:** Every product maintains a detailed price history, allowing users to view trends over time.
- **Machine Learning Price Drop Prediction:** A Python-based ML model (Logistic Regression) is trained on real product price data to predict the likelihood of a price drop for any product.
- **User Price Alerts:** Users can set custom price alerts and receive notifications when a product drops below their desired price.
- **Seamless Integration:** The Node.js backend communicates with Python scripts for real-time analytics and predictions.
- **API Endpoints:** Dedicated endpoints for fetching price history, predicting drop chances, and managing alerts.
- **Price History Visualization (Upcoming):** Interactive graphs (coming soon) will display the ups and downs of product prices over time, enabling users to analyze trends and make informed purchase decisions. This will be implemented using a modern charting library (e.g., Chart.js or D3.js) integrated into the frontend, fetching historical price data from the backend.

This system demonstrates full-stack integration, data-driven features, and practical ML deployment in a production-like environment, making the project unique and technically advanced.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **File Uploads:** Multer, Cloudinary
- **Payments:** Razorpay
- **Machine Learning:** Python (scikit-learn, pandas)
- **Other:** dotenv, cookie-parser, cors

## Project Structure
```
├── src
│   ├── controllers      # Route controllers for all features
│   ├── middlewares      # Express middlewares (auth, multer, etc.)
│   ├── models           # Mongoose models
│   ├── routes           # Express route definitions
│   ├── utils            # Utility classes and functions
│   ├── db               # Database connection logic
│   ├── app.js           # Express app setup
│   ├── index.js         # Entry point
│   └── constants.js     # App-wide constants
├── python_scripts       # Python scripts for price analytics
├── public               # Static files
├── .env                 # Environment variables (not committed)
├── .gitignore           # Git ignore rules
├── package.json         # Node.js dependencies and scripts
├── ReadMe.md            # Project documentation
└── ...
```

## Setup & Installation
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd My\ eCommerce
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your credentials (MongoDB, JWT secrets, Cloudinary, Razorpay, etc.)
4. **Run the development server:**
   ```sh
   npm run dev
   ```
5. **(Optional) Set up Python environment:**
   - Install Python 3.x and required packages:
     ```sh
     pip install -r python_scripts/requirements.txt
     ```

## Environment Variables
Create a `.env` file in the root directory with the following keys:
```
MONGODB_URL=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_access_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CORS_ORIGIN=http://localhost:3000
PORT=4000
```

## Scripts
- `npm run dev` — Start the development server with nodemon

## API Endpoints
### User
- `POST   /api/v1/users/register` — Register a new user
- `POST   /api/v1/users/login` — Login
- `POST   /api/v1/users/logout` — Logout
- `POST   /api/v1/users/refresh-token` — Refresh JWT
- `POST   /api/v1/users/change-password` — Change password
- `GET    /api/v1/users/me` — Get current user
- `PATCH  /api/v1/users/update-account` — Update user details

### Products
- `POST   /api/v1/products/create` — Create product (admin)
- `GET    /api/v1/products/all` — List all products
- `GET    /api/v1/products/:id` — Get product by ID
- `PUT    /api/v1/products/:id/update` — Update product (admin)
- `DELETE /api/v1/products/:id/delete` — Delete product (admin)

### Cart
- `POST   /api/v1/cart/add` — Add to cart
- `GET    /api/v1/cart/:userId` — Get cart
- `PUT    /api/v1/cart/update/:productId` — Update cart item
- `DELETE /api/v1/cart/remove/:productId` — Remove from cart

### Orders
- `POST   /api/v1/orders/create` — Place order
- `GET    /api/v1/orders/all` — Get user orders
- `GET    /api/v1/orders/:orderId` — Get order by ID
- `PUT    /api/v1/orders/:orderId/pay` — Mark as paid
- `PUT    /api/v1/orders/:orderId/delivery-status` — Update delivery status
- `DELETE /api/v1/orders/:orderId/cancel` — Cancel order

### Payments
- `POST   /api/v1/payments/create-razorpay-order` — Create Razorpay order
- `POST   /api/v1/payments/verify-razorpay-payment` — Verify payment

### Wishlist
- `GET    /api/v1/wishlist/` — Get wishlist
- `POST   /api/v1/wishlist/add` — Add to wishlist
- `DELETE /api/v1/wishlist/remove` — Remove from wishlist

### Admin
- `GET    /api/v1/admin/users` — List all users
- `DELETE /api/v1/admin/users/:userId` — Delete user
- `GET    /api/v1/admin/orders` — List all orders
- `GET    /api/v1/admin/products` — List all products
- `POST   /api/v1/admin/createProduct` — Create product
- `PUT    /api/v1/admin/updateProduct/:productId` — Update product
- `DELETE /api/v1/admin/deleteProduct/:productId` — Delete product

### Price Tracking
- `GET    /api/v1/price-tracking/:productId/history` — Get price history
- `GET    /api/v1/price-tracking/:productId/drop-chance` — Predict price drop chance
- `POST   /api/v1/price-tracking/:productId/alert` — Set price alert

## Python Scripts
Located in `python_scripts/`:
- `train_price_model.py` — Trains ML model for price drop prediction
- `check_price_drop_chance.py` — Predicts price drop chance for a product
- `get_price_history.py` — Fetches price history and stats
- `set_price_alert.py` — Sets a price alert for a user

## Testing

- All REST API endpoints have been thoroughly tested using Postman, covering authentication, product management, cart, orders, payments, wishlist, admin, and price tracking features. Tests include success cases, error handling, and edge cases to ensure reliability and robustness.
- Python scripts in the `python_scripts/` directory are tested independently via the command line to verify machine learning model training, price prediction, and analytics functionalities.

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request


