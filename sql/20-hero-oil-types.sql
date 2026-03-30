-- =====================================================
-- Vehicle hero: home rows = product CATEGORIES (hero_active on categories)
-- File name kept for existing deploy notes; run after 10-vehicle-years-and-logos.sql (+ 06 for category images)
-- =====================================================

-- Product categories: which ones appear as section titles on the home vehicle filter
ALTER TABLE categories ADD COLUMN IF NOT EXISTS hero_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS hero_sort_order INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_categories_hero ON categories(hero_active, hero_sort_order) WHERE hero_active = true;

-- Revert vehicle_year_products to a simple junction (safe if you never ran hero_oil_types)
ALTER TABLE vehicle_year_products DROP CONSTRAINT IF EXISTS vehicle_year_products_vy_p_ht;
ALTER TABLE vehicle_year_products DROP CONSTRAINT IF EXISTS vehicle_year_products_hero_oil_type_id_fkey;
ALTER TABLE vehicle_year_products DROP COLUMN IF EXISTS hero_oil_type_id;
DROP TABLE IF EXISTS hero_oil_types CASCADE;

ALTER TABLE vehicle_year_products DROP CONSTRAINT IF EXISTS vehicle_year_products_vehicle_year_id_product_id_key;
ALTER TABLE vehicle_year_products
  ADD CONSTRAINT vehicle_year_products_vehicle_year_id_product_id_key UNIQUE (vehicle_year_id, product_id);
