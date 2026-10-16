-- ====================================================================
-- VELLANKI ENTERPRISES - Supabase (PostgreSQL) Database Schema
-- Complete relational schema & seed data for Supabase Cloud Database
-- Compatible with Supabase SQL Editor
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
    phone_verified INTEGER DEFAULT 0,
    email_verified INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_price DECIMAL(10, 2) DEFAULT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image VARCHAR(500),
    material VARCHAR(100),
    weight VARCHAR(50),
    featured INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'draft', 'archived')),
    specifications TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    sku VARCHAR(100),
    weight VARCHAR(50)
);

-- 5. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary INTEGER DEFAULT 0
);

-- 6. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    house_building VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_id BIGINT,
    delivery_address_json TEXT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed')),
    order_status VARCHAR(30) DEFAULT 'Order Placed' CHECK(order_status IN (
        'Order Placed',
        'Payment Confirmed',
        'Processing',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled'
    )),
    notes TEXT,
    tracking_id VARCHAR(100) DEFAULT NULL,
    courier_name VARCHAR(100) DEFAULT 'India Post',
    tracking_url VARCHAR(500) DEFAULT NULL,
    shipped_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT,
    variant_id BIGINT,
    product_name VARCHAR(255) NOT NULL,
    variant_size VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL
);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(500),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. OTP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10),
    otp_hash VARCHAR(255) NOT NULL,
    channel VARCHAR(20) DEFAULT 'email' CHECK(channel IN ('sms', 'email', 'call', 'both')),
    purpose VARCHAR(30) DEFAULT 'login' CHECK(purpose IN ('login', 'register', 'forgot_password', 'verify_phone', 'verify_email')),
    expires_at TIMESTAMPTZ NOT NULL,
    verified INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS wishlists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_otp_identifier ON otp_verifications(identifier);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

-- ====================================================================
-- SEED DATA IMPORT (From existing live database)
-- ====================================================================

-- Settings
INSERT INTO settings (key, value) VALUES ('store_name', 'VELLANKI ENTERPRISES') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('tagline', 'Eco-Friendly Products for Every Occasion') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('phone', '+91 9391162511') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('email', 'jamilovaprasad2005@gmail.com') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('address', 'Jeedimetla, Hyderabad, Telangana') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('google_maps_url', 'https://maps.google.com') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('delivery_charge', '1') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('free_shipping_threshold', '1') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO settings (key, value) VALUES ('about_us', 'VELLANKI ENTERPRISES is committed to providing high-quality, eco-friendly disposable products including sustainable paper plates, bowls, cups, and food packaging containers. We empower homes, events, and food businesses to embrace clean, green and sustainable dining solutions without compromising on durability or elegance.') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Users
INSERT INTO users (id, name, email, phone, password_hash, role, phone_verified, email_verified, status) VALUES (1, 'Vellanki Admin', 'admin@vellanki.com', '+919876543210', '$2a$10$VDK4ZM22Zp.HTqppT6i30uhbQ1lI5KFjY6BgISVr/ChLfx/SctDhm', 'admin', 0, 0, 'active') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, name, email, phone, password_hash, role, phone_verified, email_verified, status) VALUES (2, 'Venkata Rao', 'test_customer_1791213058431@example.com', '+919494112233', '$2a$10$JzS0n6BLs6PZt70PlcO3f.st2kE1hL/2NYvgUhlKJpLc7bwZcP6Am', 'customer', 0, 0, 'active') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, name, email, phone, password_hash, role, phone_verified, email_verified, status) VALUES (4, 'Veerendra Jami', 'jami@gmail.com', '9391162511', '$2a$10$m.5RN.MeuPw7kSJSczexJuqoV.vlTZgNmapJjA9fEYn.wsH8fYxbi', 'customer', 0, 0, 'active') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, name, email, phone, password_hash, role, phone_verified, email_verified, status) VALUES (14, 'Jami veerendra', 'venkataveerendrajami@gmail.com', NULL, '$2a$10$keEGfIx7IxbON4HssPmVg.6ELy1X68655q8iWi0DPldlippzRdnRC', 'customer', 0, 1, 'active') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, name, email, phone, password_hash, role, phone_verified, email_verified, status) VALUES (17, 'Veerendra', '24221a1226@bvcgroup.in', NULL, '$2a$10$dx1FPdvFKrwYvBn.22Z55uvAM/pDaZjUEt4hur3XVcDByUjMlVg3O', 'customer', 0, 1, 'active') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, name, email, phone, password_hash, role, phone_verified, email_verified, status) VALUES (20, 'madhu', 'madhubadam22@gmail.com', NULL, '$2a$10$B2E/H8jNVblriih6NksOyedCO33hTTXPVir2jTdd4CvWvC9.IBSny', 'customer', 0, 1, 'active') ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, name, email, phone, password_hash, role, phone_verified, email_verified, status) VALUES (21, 'Jami Venkata Veerendra', 'chaitanya@gmail.com', '9894976254', '$2a$10$JmzLZ7fVsKlx9R5dnpLTN.dmRH7ATOWPK63Jp/mDucDHgF2mZyEoe', 'customer', 0, 0, 'active') ON CONFLICT (email) DO NOTHING;
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- Categories
INSERT INTO categories (id, name, slug, description, image, status) VALUES (3, 'Paper Plates', 'paper-plates', 'Biodegradable and food-grade paper tableware.', '/uploads/categories/image-1791213606940-525553702.jpg', 'active') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (id, name, slug, description, image, status) VALUES (6, 'Paper Cups', 'paper-cups', NULL, '/uploads/categories/image-1791307475729-785262620.jpeg', 'active') ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (id, name, slug, description, image, status) VALUES (8, 'Paper Cup', 'paper-cup', NULL, NULL, 'active') ON CONFLICT (slug) DO NOTHING;
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));

-- Products
INSERT INTO products (id, category_id, name, slug, description, sku, price, discount_price, stock, image, material, weight, featured, status) VALUES (3, 3, 'Paper plates', 'paper-plates', '', 'VE-635839', 130, NULL, 49, '/uploads/products/images-1791213743136-817942149.jpg', '100% Biodegradable Eco Paper', 'Standard', 1, 'archived') ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, category_id, name, slug, description, sku, price, discount_price, stock, image, material, weight, featured, status) VALUES (4, 3, 'Paper plate', 'paper-plate', '', 'VE-794156', 130, NULL, 47, '/uploads/products/images-1791213868993-858552283.jpg', '100% Biodegradable Eco Paper', 'Standard', 1, 'archived') ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, category_id, name, slug, description, sku, price, discount_price, stock, image, material, weight, featured, status) VALUES (7, 6, 'Paper Cups', 'paper-cups', '', 'VE-479152', 1000, 300, 97, '/uploads/products/images-1791307524113-725599738.jpeg', '100% Biodegradable Eco Paper', 'Standard', 1, 'active') ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, category_id, name, slug, description, sku, price, discount_price, stock, image, material, weight, featured, status) VALUES (14, 3, 'Paper Plates', 'paper-plates-8439', NULL, 'VE-086232', 1000, 600, 100, '/uploads/products/images-1791388128419-198252565.jpg', '100% Biodegradable Eco Paper', 'Standard', 1, 'active') ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, category_id, name, slug, description, sku, price, discount_price, stock, image, material, weight, featured, status) VALUES (15, 3, 'Eco-Friendly', 'eco-friendly', '', 'VE-309131', 2000, 1700, 99, '/uploads/products/images-1791388352113-884681958.webp', '100% Biodegradable Eco Paper', 'Standard', 1, 'active') ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, category_id, name, slug, description, sku, price, discount_price, stock, image, material, weight, featured, status) VALUES (16, 8, 'Paper Plates', 'paper-plates-4720', NULL, 'VE-552122', 1000, 900, 100, '/uploads/products/images-1791388594712-526535432.jpg', '100% Biodegradable Eco Paper', 'Standard', 0, 'active') ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (id, category_id, name, slug, description, sku, price, discount_price, stock, image, material, weight, featured, status) VALUES (17, 8, 'Paper Cup', 'paper-cup', NULL, 'VE-277631', 1000, 400, 99, '/uploads/products/images-1791389314917-575781371.webp', '100% Biodegradable Eco Paper', 'Standard', 1, 'active') ON CONFLICT (slug) DO NOTHING;
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));

-- Product Images
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (1, 3, '/uploads/products/images-1791213743136-817942149.jpg', 1);
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (2, 4, '/uploads/products/images-1791213868993-858552283.jpg', 1);
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (3, 7, '/uploads/products/images-1791307524113-725599738.jpeg', 1);
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (8, 14, '/uploads/products/images-1791388128419-198252565.jpg', 1);
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (9, 15, '/uploads/products/images-1791388352113-884681958.webp', 1);
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (10, 16, '/uploads/products/images-1791388594712-526535432.jpg', 1);
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES (11, 17, '/uploads/products/images-1791389314917-575781371.webp', 1);
SELECT setval('product_images_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_images));

-- Product Variants
INSERT INTO product_variants (id, product_id, variant_name, size, price, stock, sku, weight) VALUES (11, 4, '9 inch', '9 inch', 130, 47, 'VE-794156-V1', 'Standard');
INSERT INTO product_variants (id, product_id, variant_name, size, price, stock, sku, weight) VALUES (12, 3, '8 inch', '8 inch', 130, 50, 'VE-635839-V1', 'Standard');
SELECT setval('product_variants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_variants));
