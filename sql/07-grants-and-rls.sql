-- ============================================================
-- PETRO WEST — GRANTS & RLS POLICIES
-- Run this LAST in Supabase SQL Editor (after all other files)
-- ============================================================
-- IMPORTANT: Admin auth is hardcoded at the app level (not Supabase JWT).
-- The admin panel uses the `anon` key for ALL operations.
-- Therefore `anon` MUST have full read/write access to all tables.
-- Security is enforced by the application layer, not RLS.
-- ============================================================

-- ============================================================
-- 1. GRANT full access on ALL tables and sequences
-- ============================================================
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- 2. GRANT EXECUTE on ALL functions in public schema
-- ============================================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- 3. GRANT default privileges for FUTURE tables/sequences/functions
--    (so new tables created later also get the same grants)
-- ============================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- ============================================================
-- 4. ROW LEVEL SECURITY
--    Since admin auth is at the app level and ALL roles need full
--    access, we use fully permissive policies on every table.
--    This ensures RLS never blocks any operation.
-- ============================================================

-- ── Orders ──────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "allow_authenticated_all_orders" ON orders;
DROP POLICY IF EXISTS "allow_all_orders" ON orders;
CREATE POLICY "allow_all_orders"
  ON orders FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Products ────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_products" ON products;
DROP POLICY IF EXISTS "allow_authenticated_all_products" ON products;
DROP POLICY IF EXISTS "allow_all_products" ON products;
CREATE POLICY "allow_all_products"
  ON products FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Brands ──────────────────────────────────────────────────
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_brands" ON brands;
DROP POLICY IF EXISTS "allow_authenticated_all_brands" ON brands;
DROP POLICY IF EXISTS "allow_all_brands" ON brands;
CREATE POLICY "allow_all_brands"
  ON brands FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Categories ──────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_categories" ON categories;
DROP POLICY IF EXISTS "allow_authenticated_all_categories" ON categories;
DROP POLICY IF EXISTS "allow_all_categories" ON categories;
CREATE POLICY "allow_all_categories"
  ON categories FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Delivery Prices ─────────────────────────────────────────
ALTER TABLE delivery_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_delivery" ON delivery_prices;
DROP POLICY IF EXISTS "allow_authenticated_all_delivery" ON delivery_prices;
DROP POLICY IF EXISTS "allow_all_delivery" ON delivery_prices;
CREATE POLICY "allow_all_delivery"
  ON delivery_prices FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Oil Types ───────────────────────────────────────────────
ALTER TABLE oil_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_oil_types" ON oil_types;
DROP POLICY IF EXISTS "allow_authenticated_all_oil_types" ON oil_types;
DROP POLICY IF EXISTS "allow_all_oil_types" ON oil_types;
CREATE POLICY "allow_all_oil_types"
  ON oil_types FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Vehicle Categories ──────────────────────────────────────
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_vehicle_categories" ON vehicle_categories;
DROP POLICY IF EXISTS "allow_authenticated_all_vehicle_categories" ON vehicle_categories;
DROP POLICY IF EXISTS "allow_all_vehicle_categories" ON vehicle_categories;
CREATE POLICY "allow_all_vehicle_categories"
  ON vehicle_categories FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Vehicle Brands ──────────────────────────────────────────
ALTER TABLE vehicle_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_vehicle_brands" ON vehicle_brands;
DROP POLICY IF EXISTS "allow_authenticated_all_vehicle_brands" ON vehicle_brands;
DROP POLICY IF EXISTS "allow_all_vehicle_brands" ON vehicle_brands;
CREATE POLICY "allow_all_vehicle_brands"
  ON vehicle_brands FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Vehicle Models ──────────────────────────────────────────
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_vehicle_models" ON vehicle_models;
DROP POLICY IF EXISTS "allow_authenticated_all_vehicle_models" ON vehicle_models;
DROP POLICY IF EXISTS "allow_all_vehicle_models" ON vehicle_models;
CREATE POLICY "allow_all_vehicle_models"
  ON vehicle_models FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Vehicle Versions ────────────────────────────────────────
ALTER TABLE vehicle_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read_vehicle_versions" ON vehicle_versions;
DROP POLICY IF EXISTS "allow_authenticated_all_vehicle_versions" ON vehicle_versions;
DROP POLICY IF EXISTS "allow_all_vehicle_versions" ON vehicle_versions;
CREATE POLICY "allow_all_vehicle_versions"
  ON vehicle_versions FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── Admin Users ─────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_authenticated_admin_users" ON admin_users;
DROP POLICY IF EXISTS "allow_all_admin_users" ON admin_users;
CREATE POLICY "allow_all_admin_users"
  ON admin_users FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! All tables now have full anon+authenticated access.
-- Re-run this file in Supabase SQL Editor to apply the fix.
-- ============================================================
