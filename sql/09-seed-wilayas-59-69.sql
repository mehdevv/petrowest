-- ============================================================
-- PETRO WEST — 11 NEW WILAYAS (59–69) — November 2025 reform
-- Run after 03-seed-wilayas.sql on existing databases
-- Adjust price / domicile_price in admin as needed
-- ============================================================

INSERT INTO delivery_prices (wilaya_code, wilaya_name, price, domicile_price) VALUES
('59', 'Aflou',                  450, 750),
('60', 'El Abiodh Sidi Cheikh',  500, 800),
('61', 'El Aricha',              400, 700),
('62', 'El Kantara',             450, 750),
('63', 'Barika',                 400, 700),
('64', 'Bou Saâda',              450, 750),
('65', 'Bir El Ater',            450, 750),
('66', 'Ksar El Boukhari',       400, 700),
('67', 'Ksar Chellala',          450, 750),
('68', 'Aïn Oussara',            450, 750),
('69', 'Messaad',                450, 750)
ON CONFLICT (wilaya_code) DO UPDATE SET
  wilaya_name = EXCLUDED.wilaya_name,
  price = EXCLUDED.price,
  domicile_price = EXCLUDED.domicile_price;
