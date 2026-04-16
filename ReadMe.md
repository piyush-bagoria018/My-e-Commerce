# My eCommerce

Full-stack e-commerce platform with a modern Next.js frontend, Node.js/Express backend, MongoDB, Razorpay payments, and an ML-powered price intelligence system.

## What This Project Includes
- Customer storefront with product listing, product details, cart, checkout, wishlist, and account dashboard.
- Admin dashboard for product, order, and user management.
- Cookie-based JWT auth with automatic token refresh on the frontend.
- Price intelligence: history charts, drop probability, AI recommendation, and email alerts.
- Background schedulers for demo price updates and automatic alert notifications.

## Core Features

### Storefront
- Home page with hero carousel, featured sections, best-selling, new arrivals, trust badges.
- Product catalog with category filtering, sorting, and search param support.
- Product detail page with image gallery, size/color selectors, stock status, related items.
- Cart flow with add/update/remove and synced totals.
- Wishlist flow with quick toggle and dedicated wishlist page.
- Checkout flow with COD and Razorpay payment options.

### User Account
- Register/login (email or phone).
- Profile update, address management, password change.
- Orders list and order detail page.

### Admin
- Product CRUD with image upload.
- View all orders.
- View/delete users.

### Price Intelligence (Project Highlight)
- Historical price analysis from MongoDB price history.
- Python-based drop chance prediction.
- AI explanation layer for recommendation context.
- Target-price email alerts with scheduler-driven notifications.

## Tech Stack

### Frontend
- Next.js (App Router), React, TypeScript, Tailwind CSS
- Chart.js + react-chartjs-2
- Swiper
- EmailJS (contact form)

### Backend
- Node.js, Express, MongoDB, Mongoose
- JWT + cookies, bcrypt
- Razorpay
- Cloudinary
- Resend
- node-cron

### Python Analytics
- pandas
- scikit-learn
- pymongo
- python-dotenv
- numpy

## Architecture Snapshot

### Backend API Prefix
- /api/v1/users
- /api/v1/products
- /api/v1/cart
- /api/v1/orders
- /api/v1/payments
- /api/v1/admin
- /api/v1/wishlist
- /api/v1/price-tracking

### API Response Envelope
All APIs return a consistent shape:

```json
{
   "statuscode": 200,
   "data": {},
   "message": "Success message",
   "success": true
}
```

## Project Structure

```text
My eCommerce/
|-- src/                        # Express backend
|   |-- controllers/
|   |-- db/
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   |-- app.js
|   `-- index.js
|-- frontend/                   # Next.js frontend
|   |-- src/app/
|   |-- src/components/
|   |-- src/config/
|   |-- src/services/
|   |-- src/types/
|   `-- package.json
|-- python_scripts/             # Price analytics scripts
|-- products.json               # Seed catalog data
|-- seed-products.js            # Product seeder
|-- seed.js                     # Price history seeder
`-- ReadMe.md
```

## Frontend Routes (Implemented)
- /
- /about
- /contact
- /products
- /products/:id
- /cart
- /checkout
- /wishlist
- /login
- /register
- /dashboard/profile
- /dashboard/orders
- /dashboard/orders/:id
- /dashboard/admin

## Environment Variables

Create a root .env file.

### Backend

```env
MONGODB_URL=
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

RESEND_API_KEY=
FRONTEND_URL=http://localhost:3000

GEMINI_API_KEY=
```

### Frontend

Create frontend/.env.local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=

NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
```

## Local Development Setup

### 1. Install backend dependencies

```bash
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Install Python dependencies

```bash
pip install pandas scikit-learn pymongo python-dotenv numpy
```

### 4. Run backend

```bash
npm run dev
```

### 5. Run frontend

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:4000

## Seed And Data Commands
- npm run seed:products
   - Upserts catalog entries from products.json.
- npm run seed
   - Seeds price history for existing products.
- python python_scripts/train_price_model.py
   - Trains and writes python_scripts/price_drop_model.pkl.

## Scripts

### Root
- npm run dev
- npm run seed
- npm run seed:products

### Frontend
- npm run dev
- npm run build
- npm run start
- npm run lint

## API Map

### Users
- POST /api/v1/users/register
- POST /api/v1/users/login
- POST /api/v1/users/logout
- POST /api/v1/users/refresh-token
- POST /api/v1/users/change-password
- GET /api/v1/users/me
- PATCH /api/v1/users/update-account

### Products
- GET /api/v1/products/all
- GET /api/v1/products/:id
- POST /api/v1/products/create
- PUT /api/v1/products/:id/update
- DELETE /api/v1/products/:id/delete

### Cart
- POST /api/v1/cart/add
- GET /api/v1/cart/:userId
- PUT /api/v1/cart/update/:productId
- DELETE /api/v1/cart/remove/:productId

### Orders
- POST /api/v1/orders/create
- GET /api/v1/orders/all
- GET /api/v1/orders/:orderId
- PUT /api/v1/orders/:orderId/pay
- PUT /api/v1/orders/:orderId/delivery-status
- DELETE /api/v1/orders/:orderId/cancel

### Payments
- POST /api/v1/payments/create-razorpay-order
- POST /api/v1/payments/verify-razorpay-payment

### Wishlist
- GET /api/v1/wishlist
- POST /api/v1/wishlist/add
- DELETE /api/v1/wishlist/remove

### Admin
- GET /api/v1/admin/users
- DELETE /api/v1/admin/users/:userId
- GET /api/v1/admin/orders
- GET /api/v1/admin/products
- POST /api/v1/admin/createProduct
- PUT /api/v1/admin/updateProduct/:productId
- DELETE /api/v1/admin/deleteProduct/:productId

### Price Tracking
- GET /api/v1/price-tracking/:productId/history
- GET /api/v1/price-tracking/:productId/drop-chance
- GET /api/v1/price-tracking/:productId/ai-analysis
- POST /api/v1/price-tracking/:productId/create-alert
- GET /api/v1/price-tracking/alerts/user?userEmail=

## Background Jobs
- Alert Scheduler (hourly)
   - Checks pending alerts and sends email when price <= target.
- Price Update Scheduler (every 6 hours)
   - Applies demo price changes and keeps rolling price history alive.

## Security And Access Notes
- Auth uses httpOnly cookie tokens (access + refresh).
- Frontend API client includes credentials and auto-refresh behavior.
- Admin routes are protected by JWT + admin role middleware.

## Deployment Notes
- Frontend is deployed on Vercel: https://my-e-commerce-green.vercel.app
- Backend is deployed on Render: https://my-e-commerce-tmtg.onrender.com
- Vercel root directory should be set to `frontend/`.
- Render build command: `npm install && pip install -r requirements.txt`
- Render start command: `node src/index.js`
- Production frontend API base URL: `https://my-e-commerce-tmtg.onrender.com/api/v1`
- Price intelligence requires the Python packages listed in `requirements.txt` and a valid `GEMINI_API_KEY`.

## Current Status
- Core product flow is complete and working end to end.
- Price intelligence pipeline is integrated (Node + Python + AI + email).
- The app is deployed and working in production on Vercel and Render.
- No automated test suite is currently configured in repository scripts.

## Contributing
1. Create a feature branch.
2. Commit focused changes.
3. Open a pull request with testing notes.

## License
ISC


