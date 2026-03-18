-- ============================================================
-- PETRO WEST — Oil Types Table + Category Images
-- Run AFTER 05-rpc-functions.sql
-- ============================================================

-- ============================================================
-- 1. OIL TYPES TABLE (editable from admin dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS oil_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Seed default oil types
INSERT INTO oil_types (name) VALUES
  ('Motor Oil'),
  ('Gear Oil'),
  ('Brake Fluid'),
  ('Hydraulic Oil'),
  ('Transmission Fluid'),
  ('Coolant')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. ADD IMAGE COLUMN TO CATEGORIES
-- ============================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;

-- ============================================================
-- DONE!
-- ============================================================





