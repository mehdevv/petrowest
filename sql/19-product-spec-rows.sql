-- ============================================================
-- Product spec rows: Specifications + Homologations (per product; spec_type api_acea = specifications block)
-- + Catalogue defaults (reusable rows for admin)
-- Run in Supabase SQL Editor after previous migrations.
-- ============================================================

-- Shared defaults picked from Catalogue → Spec rows
CREATE TABLE IF NOT EXISTS catalogue_spec_defaults (
  id SERIAL PRIMARY KEY,
  spec_type TEXT NOT NULL CHECK (spec_type IN ('api_acea', 'homologation')),
  name TEXT NOT NULL DEFAULT '',
  specification TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogue_spec_defaults_type
  ON catalogue_spec_defaults (spec_type, sort_order);

-- Per-product rows (two logical tables via spec_type)
CREATE TABLE IF NOT EXISTS product_spec_rows (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_type TEXT NOT NULL CHECK (spec_type IN ('api_acea', 'homologation')),
  name TEXT NOT NULL DEFAULT '',
  specification TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_spec_rows_product_type
  ON product_spec_rows (product_id, spec_type, sort_order);

COMMENT ON TABLE catalogue_spec_defaults IS 'Admin-managed default name/spec rows; products can copy these when editing.';
COMMENT ON TABLE product_spec_rows IS 'Specification and homologation lines (name + value) shown on the public product page.';

-- RLS (same pattern as product_volumes — app uses service role / anon key)
ALTER TABLE catalogue_spec_defaults ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_catalogue_spec_defaults" ON catalogue_spec_defaults;
CREATE POLICY "allow_all_catalogue_spec_defaults"
  ON catalogue_spec_defaults FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE product_spec_rows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_product_spec_rows" ON product_spec_rows;
CREATE POLICY "allow_all_product_spec_rows"
  ON product_spec_rows FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

GRANT ALL ON catalogue_spec_defaults TO anon, authenticated;
GRANT ALL ON product_spec_rows TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE catalogue_spec_defaults_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE product_spec_rows_id_seq TO anon, authenticated;

-- Optional: one-time copy legacy products.api_standard into the first API/ACEA row
-- (Run only if you want DB rows instead of the UI fallback on the public page.)
-- INSERT INTO product_spec_rows (product_id, spec_type, name, specification, sort_order)
-- SELECT p.id, 'api_acea', '', trim(p.api_standard), 0
-- FROM products p
-- WHERE p.api_standard IS NOT NULL AND trim(p.api_standard) <> ''
--   AND NOT EXISTS (
--     SELECT 1 FROM product_spec_rows r WHERE r.product_id = p.id AND r.spec_type = 'api_acea'
--   );
