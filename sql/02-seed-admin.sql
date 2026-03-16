-- ============================================================
-- PETRO WEST — ADMIN USER SEED
-- Run this SECOND in Supabase SQL Editor
-- ============================================================
-- Creates the default admin account.
-- 
-- LOGIN CREDENTIALS:
--   Email:    admin@petrowest.dz
--   Password: PetroWest2026!
--
-- ⚠️  CHANGE THE PASSWORD after first login!
-- ============================================================

INSERT INTO admin_users (email, password, name)
VALUES (
  'admin@petrowest.dz',
  crypt('PetroWest2026!', gen_salt('bf', 10)),
  'Admin Petro West'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- DONE! Run 03-seed-wilayas.sql next.
-- ============================================================


