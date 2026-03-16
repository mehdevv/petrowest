-- ============================================================
-- PETRO WEST — FULL DATABASE SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. PRODUCT BRANDS (Castrol, Total, Mobil, Shell, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- ============================================================
-- 3. PRODUCT CATEGORIES (Engine Oil, Gear Oil, Coolant, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- ============================================================
-- 4. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  oil_type TEXT NOT NULL,                          -- 'Synthetic', 'Semi-Synthetic', 'Mineral', 'Coolant', etc.
  viscosity_grade TEXT,                             -- '5W-30', '10W-40', etc.
  volume TEXT NOT NULL,                             -- '1L', '4L', '5L', '20L', '208L'
  price NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  api_standard TEXT,                                -- 'API SN/CF', 'ACEA C3', etc.
  images TEXT[] NOT NULL DEFAULT '{}',              -- Array of image URLs
  compatible_vehicle_types TEXT[] NOT NULL DEFAULT '{}',  -- ['Car', 'Truck', 'Moto']
  in_stock BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya_code TEXT NOT NULL,
  wilaya_name TEXT NOT NULL,
  address TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  delivery_type TEXT NOT NULL DEFAULT 'domicile',   -- 'stopdesk' or 'domicile'
  delivery_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',           -- Pending, Confirmed, Shipped, Delivered, Cancelled
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. DELIVERY PRICES (per wilaya, stopdesk + domicile)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_prices (
  id SERIAL PRIMARY KEY,
  wilaya_code TEXT NOT NULL UNIQUE,
  wilaya_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 500,             -- stopdesk price (default)
  domicile_price NUMERIC(10, 2) NOT NULL DEFAULT 800     -- home delivery price
);

-- ============================================================
-- 7. VEHICLE FILTER HIERARCHY
--    Category → Brand → Model → Version (→ recommended product)
-- ============================================================

-- 7a. Vehicle Categories (Car, Moto, Truck)
CREATE TABLE IF NOT EXISTS vehicle_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 7b. Vehicle Brands (Toyota, Peugeot, BMW, etc.)
CREATE TABLE IF NOT EXISTS vehicle_brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_category_id INTEGER NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE
);

-- 7c. Vehicle Models (Corolla, 208, 3 Series, etc.)
CREATE TABLE IF NOT EXISTS vehicle_models (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_brand_id INTEGER NOT NULL REFERENCES vehicle_brands(id) ON DELETE CASCADE
);

-- 7d. Vehicle Versions/Engines (1.6 HDi, 2.0 TDI, etc.)
CREATE TABLE IF NOT EXISTS vehicle_versions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_model_id INTEGER NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE,
  recommended_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_brands_category ON vehicle_brands(vehicle_category_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand ON vehicle_models(vehicle_brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_versions_model ON vehicle_versions(vehicle_model_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_versions_product ON vehicle_versions(recommended_product_id);

-- ============================================================
-- DONE! Run 02-seed-admin.sql next.
-- ============================================================


