# VELLANKI ENTERPRISES - REST API Documentation

Comprehensive REST API reference for the VELLANKI ENTERPRISES eco-friendly disposable products e-commerce platform.

- **Base URL (Local)**: `http://localhost:5000/api`
- **Format**: JSON (`Content-Type: application/json`)
- **Authentication**: JWT Bearer token via `Authorization: Bearer <token>` header

---

## 1. System & Health

### `GET /api/health`
Verify server and database status and count of active products.

**Response `200 OK`**:
```json
{
  "success": true,
  "status": "online",
  "message": "VELLANKI ENTERPRISES API is operational",
  "productsCount": 0,
  "categoriesCount": 0,
  "timestamp": "2026-10-05T15:00:00.000Z"
}
```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
Register a new customer account.

**Request Body**:
```json
{
  "name": "Anand Kumar",
  "email": "customer@example.com",
  "phone": "+919876543210",
  "password": "Password123"
}
```

**Response `201 Created`**:
```json
{
  "success": true,
  "message": "Account created successfully!",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 2,
    "name": "Anand Kumar",
    "email": "customer@example.com",
    "phone": "+919876543210",
    "role": "customer"
  }
}
```

### `POST /api/auth/send-otp`
Generate and dispatch a secure 6-digit OTP code directly to the customer's email inbox using the **Brevo (Sendinblue) Transactional REST API v3**.

- Powered by Brevo REST API v3 (`https://api.brevo.com/v3/smtp/email`) using `BREVO_API_KEY`.
- Includes fallback to local development simulation mode when no API key is configured.
- Protected by 30-second resend cooldown rate limiting, 5-minute expiry, and maximum 5 failed attempts lockout.
- OTP is hashed using SHA-256 before persistence in SQLite.

**Request Body**:
```json
{
  "identifier": "customer@example.com",
  "channel": "email"
}
```
*Note: `channel` defaults to `"email"`.*

**Response `200 OK`**:
```json
{
  "success": true,
  "message": "Verification code sent to customer@example.com via email.",
  "channel": "email",
  "identifier": "customer@example.com",
  "target": "customer@example.com",
  "maskedTarget": "cu***@example.com",
  "expiresInSeconds": 300,
  "simulated": false
}
```

---

### `POST /api/auth/verify-otp`
Verify a 6-digit OTP code. Automatically logs in existing customers or transparently creates a new customer profile. Returns a JWT session token.

**Request Body**:
```json
{
  "identifier": "+919876543210",
  "otp": "482910",
  "name": "Ramesh Kumar"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "message": "Verification successful! Logged in.",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 3,
    "name": "Ramesh Kumar",
    "email": "+919876543210@phone.vellanki.local",
    "phone": "+919876543210",
    "role": "customer"
  }
}
```

---

### `POST /api/auth/login`
Customer or admin login using email or mobile number with password.
Includes brute-force protection: warns on remaining attempts (up to 5) and enforces a 15-minute account lockout upon 5 consecutive failed attempts.

**Request Body**:
```json
{
  "identifier": "customer@example.com",
  "password": "Password123"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "message": "Logged in successfully!",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 2,
    "name": "Anand Kumar",
    "email": "customer@example.com",
    "phone": "+919876543210",
    "phone_verified": true,
    "email_verified": true,
    "status": "active",
    "last_login": "2026-10-05 17:34:16"
  }
}
```

---

### `POST /api/auth/verify-phone` *(Requires Auth)*
Confirm OTP code sent to customer's mobile number and mark account `phone_verified = 1`.

**Request Body**:
```json
{
  "otp": "312184"
}
```

---

### `POST /api/auth/verify-email` *(Requires Auth)*
Confirm OTP code sent to customer's email address and mark account `email_verified = 1`.

**Request Body**:
```json
{
  "otp": "470584"
}
```

---

### `POST /api/auth/change-phone` *(Requires Auth)*
Update mobile number on customer profile with mandatory OTP verification.

**Request Body**:
```json
{
  "phone": "+919876543211",
  "otp": "592104"
}
```

---

### `POST /api/auth/change-email` *(Requires Auth)*
Update email address on customer profile with mandatory OTP verification.

**Request Body**:
```json
{
  "email": "new.email@example.com",
  "otp": "832941"
}
```

---

### `POST /api/auth/forgot-password/send-otp`
Send password recovery OTP to customer's registered email address via Brevo transactional email.

**Request Body**:
```json
{
  "identifier": "customer@example.com",
  "channel": "email"
}
```

---

### `POST /api/auth/forgot-password/reset`
Verify OTP and set a new password. Enforces SHA-256 OTP verification and bcrypt hashing on the new password.

**Request Body**:
```json
{
  "identifier": "customer@example.com",
  "otp": "977418",
  "newPassword": "NewStrongPassword@2026"
}
```

---

### `POST /api/auth/admin-login`
Strict administrator authentication. Non-admin users are rejected with `403 Forbidden`.

**Request Body**:
```json
{
  "email": "admin@vellanki.com",
  "password": "Admin@12345"
}
```

---

### `GET /api/auth/profile` *(Requires Auth)*
Get authenticated user profile details, verification badges (`phone_verified`, `email_verified`), account status, saved addresses, and total order count.

### `PUT /api/auth/profile` *(Requires Auth)*
Update customer name and basic profile fields.

### `POST /api/auth/change-password` *(Requires Auth)*
Change account password (`currentPassword`, `newPassword`).

---

## 3. Customer Wishlist (`/api/wishlist`) *(Requires Auth)*

### `GET /api/wishlist`
Retrieve list of all products saved in the authenticated customer's wishlist.

### `POST /api/wishlist/toggle`
Toggle a product in wishlist (adds if absent, removes if present).
```json
{
  "productId": 3
}
```

### `DELETE /api/wishlist/:productId`
Remove an item from the customer's wishlist by product ID.

---

## 4. Product Catalog (`/api/products`)

### `GET /api/products`
Query the product catalog with search, filtering, and sorting.

**Query Parameters**:
- `search`: String matching product name, description, SKU, or category.
- `category`: Category slug or numeric ID.
- `min_price`: Minimum price filter.
- `max_price`: Maximum price filter.
- `size`: Variant size (e.g., `6 inch`, `8 inch`, `100ml`).
- `in_stock`: `true` to show only items with stock > 0.
- `featured`: `true` to retrieve featured products.
- `sort`: `newest` | `price_asc` | `price_desc` | `popular`.
- `page`: Page number (default: 1).
- `limit`: Items per page (default: 12).
- `all`: `true` (Admin only) to include draft products.

**Response `200 OK`**:
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Biodegradable Paper Plate",
      "slug": "biodegradable-paper-plate",
      "sku": "VE-001001",
      "price": 100.00,
      "discount_price": 90.00,
      "stock": 100,
      "material": "Eco Plant Fiber",
      "variants": [
        { "id": 1, "size": "6 inch", "price": 90.00, "stock": 50, "sku": "VE-001001-V1" },
        { "id": 2, "size": "8 inch", "price": 120.00, "stock": 50, "sku": "VE-001001-V2" }
      ],
      "images": []
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 12, "pages": 1 }
}
```

---

### `GET /api/products/:idOrSlug`
Retrieve product by ID or URL slug with full variants, specifications, and image gallery.

---

### `POST /api/products` *(Requires Admin Auth, `multipart/form-data`)*
Create a new product.
- **Fields**: `name`, `category_id`, `description`, `sku`, `price`, `discount_price`, `stock`, `material`, `weight`, `featured`, `status`, `variants` (JSON array).
- **Files**: `images` (array of up to 8 images).

---

### `PUT /api/products/:id` *(Requires Admin Auth, `multipart/form-data`)*
Update product details, pricing, stock, variants, and append new images.

---

### `DELETE /api/products/:id` *(Requires Admin Auth)*
Safely remove product. If the product has historical orders, it is deactivated/archived (`status = 'archived'`) to preserve order records. Otherwise, it is deleted.

---

### `POST /api/products/adjust-stock` *(Requires Admin Auth)*
Quickly adjust stock for a product or variant:
```json
{
  "productId": 1,
  "variantId": 2,
  "quantity": 10,
  "type": "add"
}
```

---

## 4. Categories (`/api/categories`)

- `GET /api/categories`: Public list of active categories with product counts.
- `GET /api/categories/:idOrSlug`: Get category details.
- `POST /api/categories` *(Admin)*: Create new category with optional image.
- `PUT /api/categories/:id` *(Admin)*: Edit category name, description, image, or status.
- `DELETE /api/categories/:id` *(Admin)*: Delete category.

---

## 5. Shopping Cart (`/api/cart`) *(Requires Auth)*

- `GET /api/cart`: Returns cart items with variant info, live prices, subtotal, and delivery fees.
- `POST /api/cart/add`: Add product and selected variant to cart (`productId`, `variantId`, `quantity`).
- `PUT /api/cart/items/:id`: Change quantity or variant.
- `DELETE /api/cart/items/:id`: Remove item from cart.
- `DELETE /api/cart/clear`: Empty entire cart.

---

## 6. Addresses (`/api/addresses`) *(Requires Auth)*

- `GET /api/addresses`: Retrieve saved Indian delivery addresses.
- `POST /api/addresses`: Save address (`name`, `phone`, `house_building`, `street`, `city`, `district`, `state`, `pincode`, `is_default`).
- `PUT /api/addresses/:id`: Edit address.
- `PUT /api/addresses/:id/default`: Set as default delivery address.
- `DELETE /api/addresses/:id`: Delete address.

---

## 7. Orders & Fulfillment (`/api/orders`)

### `POST /api/orders` *(Requires Auth)*
Place an order after Razorpay authorization or direct checkout.
```json
{
  "addressId": 1,
  "razorpay_order_id": "order_mock_12345",
  "razorpay_payment_id": "pay_mock_67890",
  "razorpay_signature": "mock_valid_signature",
  "paymentMethod": "Online / Razorpay"
}
```

### `GET /api/orders/my-orders` *(Requires Auth)*
List all orders placed by the authenticated customer.

### `GET /api/orders/:idOrNumber` *(Requires Auth)*
Get single order details, item snapshots, delivery destination, and step-by-step timeline.

### `POST /api/orders/:id/cancel` *(Requires Auth)*
Cancel an order if status is still `Order Placed` or `Payment Confirmed`. Restores inventory.

### `GET /api/admin/orders` *(Requires Admin Auth)*
Admin list of all orders with filters by status (`status`) and search (`search`).

### `PUT /api/admin/orders/:id/status` *(Requires Admin Auth)*
Admin updates fulfillment status:
```json
{
  "status": "Shipped",
  "notes": "Dispatched with Express Courier. Tracking ID: EXP-99881",
  "paymentStatus": "paid"
}
```

---

## 8. Payments (`/api/payment`)

- `GET /api/payment/config`: Returns Razorpay public key ID and test/mock mode status.
- `POST /api/payment/create-order` *(Requires Auth)*: Creates Razorpay order ID for specified amount.
- `POST /api/payment/verify` *(Requires Auth)*: Server-side cryptographic HMAC SHA256 verification.

---

## 9. Analytics & Dashboard (`/api/admin`) *(Requires Admin Auth)*

- `GET /api/admin/dashboard-summary`: Real-time sales metrics (today, 7d, 30d, total), order status breakdown, low-stock warnings, and customer statistics.
- `GET /api/admin/customers`: Customer directory with join dates, phone and email verification statuses (`phone_verified`, `email_verified`), account status (`active` / `suspended`), and last login timestamps.
- `PUT /api/admin/customers/:id/status` *(Requires Admin Auth)*: Suspend (`{"status": "suspended"}`) or reactivate (`{"status": "active"}`) a customer account. Suspended customers are blocked from logging in with `403 Forbidden`.

---

## 10. Store Settings (`/api/settings`)

- `GET /api/settings`: Public store info (phone, email, address, delivery charge, free shipping threshold).
- `PUT /api/settings` *(Admin)*: Update store contact details and delivery rules.
- `POST /api/contact/submit`: Public contact inquiry form submission.
