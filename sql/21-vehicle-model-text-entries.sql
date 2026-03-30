-- Free-text "moteur + année" per vehicle model + per-category activation + products
-- Run after categories + vehicle_models exist (01 + 04 + …)

CREATE TABLE IF NOT EXISTS vehicle_model_text_entries (
  id BIGSERIAL PRIMARY KEY,
  vehicle_model_id INTEGER NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE,
  engine_label TEXT NOT NULL DEFAULT '',
  year_label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vehicle_model_text_entries_unique UNIQUE (vehicle_model_id, engine_label, year_label)
);

CREATE INDEX IF NOT EXISTS idx_vm_text_entries_model ON vehicle_model_text_entries(vehicle_model_id);

CREATE TABLE IF NOT EXISTS vehicle_text_entry_category_states (
  id BIGSERIAL PRIMARY KEY,
  text_entry_id BIGINT NOT NULL REFERENCES vehicle_model_text_entries(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(text_entry_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_vtecs_entry ON vehicle_text_entry_category_states(text_entry_id);

CREATE TABLE IF NOT EXISTS vehicle_text_entry_category_products (
  id BIGSERIAL PRIMARY KEY,
  text_entry_id BIGINT NOT NULL REFERENCES vehicle_model_text_entries(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(text_entry_id, category_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_vtecp_entry_cat ON vehicle_text_entry_category_products(text_entry_id, category_id);

ALTER TABLE vehicle_model_text_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_text_entry_category_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_text_entry_category_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_vehicle_model_text_entries" ON vehicle_model_text_entries;
CREATE POLICY "allow_all_vehicle_model_text_entries"
  ON vehicle_model_text_entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_vehicle_text_entry_category_states" ON vehicle_text_entry_category_states;
CREATE POLICY "allow_all_vehicle_text_entry_category_states"
  ON vehicle_text_entry_category_states FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_vehicle_text_entry_category_products" ON vehicle_text_entry_category_products;
CREATE POLICY "allow_all_vehicle_text_entry_category_products"
  ON vehicle_text_entry_category_products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
