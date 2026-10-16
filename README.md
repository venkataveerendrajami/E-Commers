# 🌿 VELLANKI ENTERPRISES — E-Commerce Web Platform

> **"Eco-Friendly Products for Every Occasion"**  
> A modern, professional, fully responsive e-commerce web platform for **VELLANKI ENTERPRISES**, an online store for sustainable eco-friendly disposable tableware (paper plates, paper cups, food containers, and packaging).

---

## 🌟 Key Highlights & Mandates

- **🌱 ZERO Hardcoded / Demo Products**: The catalog starts with **0 products** in the database. Elegant empty states ("Products coming soon. Please check back later.") display across the store until the administrator dynamically adds categories and products through the Admin Dashboard.
- **🛡️ Single Seller Business Model**: VELLANKI ENTERPRISES is the exclusive seller. No marketplace or multi-vendor clutter.
- **🔐 Phone & Email OTP + Voice Call Authentication**: Secure passwordless customer login and instant auto-registration via SMS OTP, Email OTP, or automated Voice Call ("Call me with code" verification with browser speech synthesis preview).
- **⚡ Dynamic Unlimited Variants & Sizes**: Easily configure products with multiple sizes (e.g., 6", 8", 10", 12", 200ml, 500ml) with independent pricing, SKU, and stock.
- **💳 Razorpay Payment Gateway**: Seamless checkout with server-side HMAC-SHA256 signature verification and test-mode simulation for local development.
- **📦 Complete Order Fulfillment & 🇮🇳 India Post Tracking**: Sequential order IDs (`VE100001`+), Indian delivery address fields, stock deduction, 7-stage live tracking timeline, and official **India Post Consignment Tracking** allocation (`indiapost.gov.in`) with 1-click customer copying and direct tracking link.
- **🏷️ Admin-Only Product Publishing & Instant Price Controls**: Only the authenticated administrator has rights to publish products or increase/decrease product prices with dynamic inline adjustment controls (`+10`, `-10`, `+50`). Strict backend validation ensures customer frontends cannot manipulate prices.
- **📊 Real-time Sales Analytics**: Daily, weekly, and monthly revenue trends, order volume graphs (Recharts), and top-selling product metrics.
- **🗄️ Dual-Mode Database Engine**: Supports both high-speed local embedded SQLite (`node:sqlite`) and **Supabase (PostgreSQL)** cloud database with zero code changes.
- **📱 Responsive Mobile-First Design**: Optimized for mobile, tablet, laptop, and desktop browsers with custom forest & earthy aesthetics.

---

## 🏗️ Architecture & Tech Stack

```
vellanki-enterprises/
├── frontend/                  # React 18 + Vite + Tailwind CSS + Lucide + Recharts
│   ├── src/
│   │   ├── components/        # Common, Customer, and Admin layouts & modals
│   │   ├── context/           # AuthContext & CartContext
│   │   ├── pages/             # Storefront & Admin management pages
│   │   └── services/          # Central Axios API client
│   └── dist/                  # Optimized production build
│
├── backend/                   # Node.js + Express.js REST API
│   ├── config/                # Relational SQLite database connection & migrations
│   ├── controllers/           # Auth, Product, Category, Cart, Order, Payment, Analytics
│   ├── middleware/            # JWT verification, Admin guard, Multer uploads
│   ├── routes/                # Unified REST API routes
│   ├── services/              # Razorpay payment & signature verification
│   ├── uploads/               # Dynamic product & category uploaded images
│   └── server.js              # Express app entry point
│
├── database/
│   ├── schema.sql             # Standard relational SQL schema (SQLite/MySQL/PostgreSQL)
│   └── vellanki.db            # Embedded high-performance SQLite database
│
├── docs/
│   └── API.md                 # Complete REST API reference documentation
│
├── .env.example               # Environment variables template
└── README.md                  # System manual and deployment guide
```

---

## 🔑 Default Administrator Credentials

When the backend starts, an initial administrator account is automatically initialized if not present:

- **Admin Login Portal**: `http://localhost:5000/admin/login` (or `/admin/login` on frontend dev port `5173`)
- **Email**: `admin@vellanki.com`
- **Password**: `Admin@12345`
- **Role**: `admin` (Full catalog, category, inventory, order, and analytics access)

*(You can customize these in `.env` under `ADMIN_EMAIL` and `ADMIN_PASSWORD`)*

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested with Node.js v24)
- **npm**: v9.0.0 or higher

### 1. Clone & Setup Environment

```bash
# Copy environment configuration
cp .env.example .env
```

### 2. Backend Setup & Start

```bash
cd backend
npm install
npm start
```
The backend will launch on **`http://localhost:5000`**:
- 🌐 Website / App: `http://localhost:5000` *(Serves compiled frontend automatically)*
- 🌐 REST API: `http://localhost:5000/api`
- 🩺 Health Check: `http://localhost:5000/api/health`

### 3. Frontend Development Server (Optional Hot-Reloading)

If you wish to edit frontend code with Vite Hot Module Reloading (HMR):

```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start on **`http://localhost:5173`** and proxy all API calls and image requests directly to port 5000.

---

## 📧 Brevo Email Verification & Customer Authentication

The platform is upgraded with dedicated, high-deliverability **Email Verification powered by the Brevo (formerly Sendinblue) Transactional REST API v3**. All customer verification, login, registration, and password recovery workflows operate exclusively through secure, branded email OTPs:

### 1. Brevo Transactional Email Integration (`https://api.brevo.com/v3/smtp/email`)
- **Native REST API v3**: Zero external SDK bloat. Uses native HTTP dispatch directly to Brevo's endpoint with the configured `BREVO_API_KEY`.
- **Branded HTML Email Template**:
  - Forest eco-branding: *"🌿 VELLANKI ENTERPRISES — Eco-Friendly Products for Every Occasion"*.
  - Customer personalized greeting.
  - Large 6-digit OTP security badge with dashed border.
  - ⏱️ 5-minute expiration notice and fraud security warning.
- **Development Simulation Mode**: When `BREVO_API_KEY` is not yet configured, the system operates seamlessly in simulation mode, outputting a clear visual helper badge on screen and logging the code to the console for frictionless local testing.

### 2. Streamlined Email-Only Authentication Workflows
- 📧 **Email OTP Login (`/login`)**:
  - Customer enters their email address.
  - Brevo dispatches a 6-digit OTP code directly to their inbox.
  - Customer enters the code into 6 auto-advancing cells -> Instant, passwordless sign-in!
- 🔑 **Password Login (`/login`)**:
  - Traditional sign-in using Email + Password.
  - Includes brute-force protection: warns on remaining attempts (1 to 5) and locks the account for **15 minutes** upon 5 failed attempts (`HTTP 429`).
- 📝 **Customer Registration (`/register`)**:
  - Register with Email OTP (Name + Email + Brevo 6-digit verification code), OR
  - Register with Name, Email, optional mobile number for shipping contact, and Password.
- 🔄 **Forgot Password Recovery (`/forgot-password`)**:
  - Customer enters registered email address.
  - Receives 6-digit reset code via Brevo.
  - Enters code and creates new password -> Immediate password update with bcrypt hashing.

### 3. Customer Profile & Email Verification (`/account`)
- **Email Verification Badges**:
  - `✓ Verified` (Green) when email is confirmed.
  - `Verify Email` (Amber) if unverified; opens a modal to send and verify a Brevo code in 1 click.
- **Change Email Address**:
  - Customer enters new email -> Brevo sends code to the new address -> Verifies and updates the account with `email_verified = 1`.
- **Saved Shipping Addresses & Orders**: Mobile phone is maintained as a standard contact field for courier shipping labels without requiring phone call verification.

### 4. Configuration in `.env`
Add your Brevo API key to `.env` (or copy from `.env.example`):

```env
# Brevo Transactional Email API Key
# Obtain free key at: https://app.brevo.com/settings/keys/api
BREVO_API_KEY=xkeysib-your_brevo_api_key_here
BREVO_SENDER_NAME=VELLANKI ENTERPRISES
BREVO_SENDER_EMAIL=no-reply@vellankienterprises.com
```

### 5. Production Security Hardening
- **SHA-256 OTP Hashing**: Raw OTP codes are hashed using SHA-256 before database insertion (`otp_verifications.otp_hash`). Plain-text OTPs are never stored.
- **Rate Limiting**: Enforces a strict 30-second cooldown between OTP requests (`HTTP 429`).
- **5-Minute Expiry**: Unused codes automatically expire after 300 seconds.
- **Brute-Force Lockout**: Codes are permanently invalidated after 5 consecutive incorrect guesses.
- **Single-Use Invalidation**: Codes are marked used immediately upon successful verification.

### 6. Admin Customer Management (`/admin/customers`)
- **Customer Directory**: Displays customer name, email, mobile number, registration date, lifetime orders, total spend, and `last_login` timestamp.
- **Verification Status Indicators**: Badges for both Mobile (`✓ Phone` / `✕ Phone`) and Email (`✓ Email` / `✕ Email`).
- **Account Status Controls**: Admin can toggle customer status between **Active** and **Suspended**:
  - Suspending an account instantly blocks the customer from logging in (`HTTP 403 Forbidden: "Your account has been suspended. Please contact customer support."`).
  - Reactivating restores full account access.
- **Data Privacy**: Customer passwords and OTP hashes are never exposed or returned in admin responses.

### 7. Telephony & Email Configuration (`.env`)
- **SMS Gateways**: Configure `SMS_PROVIDER=twilio` or `fast2sms` with credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` or `FAST2SMS_API_KEY`).
- **Voice Telephony**: Configure `VOICE_PROVIDER=twilio` for automated outbound TwiML voice calls.
- **Email Delivery**: Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM`.
- **Development Simulation Mode**: When credentials are left blank, all OTPs, SMS messages, and voice calls automatically simulate in the browser with full interactive modals and console logging.

### 8. Production Security Hardening
- **Cryptographic Hashing**: Raw OTPs are hashed using SHA-256 (`crypto.createHash('sha256')`) before database storage (`otp_verifications.otp_hash`). Plain-text OTPs are never stored.
- **Rate Limiting**: Enforces a strict 30-second cooldown between OTP requests for any identifier (`HTTP 429`).
- **OTP Expiration**: Codes expire in 5 minutes (300 seconds).
- **Lockout on OTP Brute-Force**: Maximum 5 failed OTP attempts before the code is permanently invalidated.
- **Single-Use Invalidation**: OTP is immediately marked used upon successful verification to prevent replay attacks.

---

## 💳 Razorpay Payment Integration

The application includes a dual-mode Razorpay service in `backend/services/razorpayService.js`:

### 1. Local Testing / Simulation Mode (Default)
When placeholder keys are present in `.env`, the checkout automatically opens a development simulation modal allowing you to test:
- Order creation
- Instant payment authorization
- Server signature verification
- Automatic order confirmation (`VE100001`)
- Inventory deduction and order tracking

### 2. Live / Test Mode with Real Razorpay Account
To connect real Razorpay Test or Live keys:
1. Go to your [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys) and generate API Keys.
2. In `.env` (or backend environment), update:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere
   RAZORPAY_KEY_SECRET=YourSecretKeyHere
   ```
3. Restart the backend server. The frontend will now automatically open the official Razorpay Checkout popup supporting UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, Net Banking, and Wallets.

> [!IMPORTANT]
> The Razorpay Secret Key is **never exposed** to the frontend. All order creation and HMAC-SHA256 signature verifications happen strictly on the server.

---

## 🛒 Admin Workflow Guide

### Step 1: Login
Navigate to `/admin/login` and log in with `admin@vellanki.com` / `Admin@12345`.

### Step 2: Create Categories
Go to **Categories** (`/admin/categories`) and click **+ Add New Category**:
- Name: `Paper Plates`
- Description: `Sturdy, biodegradable paper plates made from natural food-grade paper fiber.`
- Upload category banner image.

### Step 3: Add Products & Dynamic Variants
Go to **Products** (`/admin/products`) and click **+ Add New Product**:
- Enter Name (e.g., `Eco Paper Plate`), SKU, Base Price, Stock.
- Upload product images.
- Under **Product Sizes & Dynamic Variants**, click **+ Add Size Variant**:
  - `6 inch` → ₹100 (50 stock)
  - `8 inch` → ₹130 (40 stock)
  - `10 inch` → ₹160 (35 stock)
  - `12 inch` → ₹200 (25 stock)
- Toggle **Mark as Featured Product** to feature it on the home page.
- Click **Publish Product**.

### Step 4: Verify Customer Catalog
Open the storefront at `http://localhost:5000/`:
- The home page now automatically showcases your newly added category and featured product!
- The shop page (`/shop`) enables live searching, category filtering, and size filters.

### Step 5: Process Orders & Deliveries
When customers place orders:
1. Open **Orders & Delivery** (`/admin/orders`).
2. Click **Manage Delivery** on any order.
3. Update fulfillment stages: `Payment Confirmed` → `Processing` → `Packed` → `Shipped` → `Delivered`.
4. Enter tracking number or carrier notes.
5. The customer can track these milestones in real time from their account!

---

## 🗄️ Database Management

The platform utilizes a relational database architecture.

- **Embedded Engine**: SQLite via Node's native `node:sqlite` (synchronous, WAL mode, foreign keys enabled). Zero external database servers required for local setup!
- **Schema File**: `database/schema.sql` contains the complete ANSI SQL schema compatible with SQLite, PostgreSQL, and MySQL.

### Production Database Switch (PostgreSQL / MySQL)
To switch to PostgreSQL or MySQL in production:
1. Run `database/schema.sql` on your PostgreSQL or MySQL database instance.
2. In `.env`, set:
   ```env
   DB_TYPE=postgres
   DB_HOST=your-db-host.com
   DB_PORT=5432
   DB_USER=vellanki_user
   DB_PASSWORD=your_password
   DB_NAME=vellanki_ecommerce
   ```

---

## 🚢 Production Deployment Instructions

### 1. Build the Frontend
```bash
cd frontend
npm install
npm run build
```
This generates the optimized bundle in `frontend/dist/`.

### 2. Configure Environment for Production
Set in `.env`:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=use_a_long_random_cryptographic_secret_here
ADMIN_PASSWORD=SetAStrongProductionAdminPassword123!
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret
```

### 3. Start Backend with PM2 / Process Manager
```bash
cd backend
npm install --production
# Using PM2
npm install -g pm2
pm2 start server.js --name "vellanki-ecommerce"
pm2 save
pm2 startup
```

The Express server will automatically serve both the API endpoints (`/api/*`), image uploads (`/uploads/*`), and the single-page application frontend (`/*`) from `frontend/dist/index.html`.

---

## 🧪 Verification & Automated Testing

### 1. Customer Authentication & OTP Verification Suite
To verify registration, phone & email verification, rate-limit cooldowns, voice call password reset, wishlist management, failed password lockouts, and admin customer controls:

```bash
node scratch/verify_complete_auth.js
```

### 2. Full Storefront & Order Fulfillment E2E Suite
To verify the complete purchase lifecycle from product catalog to Razorpay payment and fulfillment:

```bash
node scratch/test_flow.js
```

This verifies:
1. Catalog starts with 0 products
2. Admin authentication
3. Category creation
4. Product & dynamic variants creation
5. Customer search & size filter
6. Customer registration & address saving
7. Cart calculations & delivery charges
8. Razorpay checkout & signature verification
9. Unique sequential order ID generation (`VE100001`)
10. Automatic stock deduction
11. Live order tracking timeline
12. Admin fulfillment status transitions (`Processing` → `Shipped` → `Delivered`)
13. Sales analytics & dashboard revenue updates
14. Database cleanup to maintain the zero-product rule

---

## 📄 License & Ownership
Copyright © 2026 **VELLANKI ENTERPRISES**. All Rights Reserved.  
*Eco-Friendly Products for Every Occasion.*
