-- =====================================================
-- Vehicle Years + Multi-product recommendations + Brand logos
-- =====================================================

-- 1. Add logo_url to vehicle_brands
ALTER TABLE vehicle_brands ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Vehicle Years (under versions/engines)
CREATE TABLE IF NOT EXISTS vehicle_years (
  id BIGSERIAL PRIMARY KEY,
  vehicle_version_id INTEGER NOT NULL REFERENCES vehicle_versions(id) ON DELETE CASCADE,
  year INT NOT NULL,
  UNIQUE(vehicle_version_id, year)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_years_version ON vehicle_years(vehicle_version_id);

-- 3. Junction table: which products are recommended for a given year
CREATE TABLE IF NOT EXISTS vehicle_year_products (
  id BIGSERIAL PRIMARY KEY,
  vehicle_year_id BIGINT NOT NULL REFERENCES vehicle_years(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(vehicle_year_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_vyp_year ON vehicle_year_products(vehicle_year_id);
CREATE INDEX IF NOT EXISTS idx_vyp_product ON vehicle_year_products(product_id);

-- RLS
ALTER TABLE vehicle_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_year_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read vehicle_years"
  ON vehicle_years FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read vehicle_year_products"
  ON vehicle_year_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all on vehicle_years"
  ON vehicle_years FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vehicle_year_products"
  ON vehicle_year_products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
