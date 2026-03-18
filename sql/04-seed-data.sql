-- ============================================================
-- PETRO WEST — SAMPLE DATA SEED
-- Run this LAST in Supabase SQL Editor
-- ============================================================
-- This seeds: Brands, Categories, Vehicle hierarchy, and
-- a few sample products so the website has content immediately.
-- ============================================================

-- ============================================================
-- PRODUCT BRANDS
-- ============================================================
INSERT INTO brands (name) VALUES
('Castrol'),
('Total'),
('Mobil'),
('Shell'),
('Motul'),
('Lukoil'),
('Repsol'),
('Fuchs'),
('Elf'),
('Valvoline')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PRODUCT CATEGORIES
-- ============================================================
INSERT INTO categories (name) VALUES
('Engine Oil'),
('Gear Oil'),
('Transmission Fluid'),
('Coolant'),
('Brake Fluid'),
('Grease'),
('Hydraulic Oil')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- VEHICLE CATEGORIES (for the hero filter)
-- ============================================================
INSERT INTO vehicle_categories (name) VALUES
('Car'),
('Moto'),
('Truck')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- VEHICLE BRANDS (linked to vehicle categories)
-- ============================================================
-- Car brands
INSERT INTO vehicle_brands (name, vehicle_category_id) VALUES
('Peugeot',    (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Renault',    (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Toyota',     (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Volkswagen', (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Hyundai',    (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Kia',        (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Dacia',      (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Chevrolet',  (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Seat',       (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('Mercedes',   (SELECT id FROM vehicle_categories WHERE name = 'Car')),
('BMW',        (SELECT id FROM vehicle_categories WHERE name = 'Car'));

-- Moto brands
INSERT INTO vehicle_brands (name, vehicle_category_id) VALUES
('Yamaha',    (SELECT id FROM vehicle_categories WHERE name = 'Moto')),
('Honda',     (SELECT id FROM vehicle_categories WHERE name = 'Moto')),
('Suzuki',    (SELECT id FROM vehicle_categories WHERE name = 'Moto')),
('Kawasaki',  (SELECT id FROM vehicle_categories WHERE name = 'Moto')),
('BMW Moto',  (SELECT id FROM vehicle_categories WHERE name = 'Moto'));

-- Truck brands
INSERT INTO vehicle_brands (name, vehicle_category_id) VALUES
('Mercedes Trucks', (SELECT id FROM vehicle_categories WHERE name = 'Truck')),
('Renault Trucks',  (SELECT id FROM vehicle_categories WHERE name = 'Truck')),
('Iveco',           (SELECT id FROM vehicle_categories WHERE name = 'Truck')),
('MAN',             (SELECT id FROM vehicle_categories WHERE name = 'Truck')),
('Hyundai Trucks',  (SELECT id FROM vehicle_categories WHERE name = 'Truck'));

-- ============================================================
-- VEHICLE MODELS (linked to vehicle brands)
-- ============================================================
-- Peugeot models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('208',   (SELECT id FROM vehicle_brands WHERE name = 'Peugeot' LIMIT 1)),
('301',   (SELECT id FROM vehicle_brands WHERE name = 'Peugeot' LIMIT 1)),
('308',   (SELECT id FROM vehicle_brands WHERE name = 'Peugeot' LIMIT 1)),
('3008',  (SELECT id FROM vehicle_brands WHERE name = 'Peugeot' LIMIT 1)),
('Partner', (SELECT id FROM vehicle_brands WHERE name = 'Peugeot' LIMIT 1));

-- Renault models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('Clio',    (SELECT id FROM vehicle_brands WHERE name = 'Renault' LIMIT 1)),
('Symbol',  (SELECT id FROM vehicle_brands WHERE name = 'Renault' LIMIT 1)),
('Megane',  (SELECT id FROM vehicle_brands WHERE name = 'Renault' LIMIT 1)),
('Duster',  (SELECT id FROM vehicle_brands WHERE name = 'Renault' LIMIT 1));

-- Toyota models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('Corolla', (SELECT id FROM vehicle_brands WHERE name = 'Toyota' LIMIT 1)),
('Hilux',   (SELECT id FROM vehicle_brands WHERE name = 'Toyota' LIMIT 1)),
('Yaris',   (SELECT id FROM vehicle_brands WHERE name = 'Toyota' LIMIT 1)),
('RAV4',    (SELECT id FROM vehicle_brands WHERE name = 'Toyota' LIMIT 1));

-- Volkswagen models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('Golf',   (SELECT id FROM vehicle_brands WHERE name = 'Volkswagen' LIMIT 1)),
('Polo',   (SELECT id FROM vehicle_brands WHERE name = 'Volkswagen' LIMIT 1)),
('Caddy',  (SELECT id FROM vehicle_brands WHERE name = 'Volkswagen' LIMIT 1));

-- Hyundai models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('Accent',  (SELECT id FROM vehicle_brands WHERE name = 'Hyundai' AND vehicle_category_id = (SELECT id FROM vehicle_categories WHERE name = 'Car') LIMIT 1)),
('Tucson',  (SELECT id FROM vehicle_brands WHERE name = 'Hyundai' AND vehicle_category_id = (SELECT id FROM vehicle_categories WHERE name = 'Car') LIMIT 1)),
('i10',     (SELECT id FROM vehicle_brands WHERE name = 'Hyundai' AND vehicle_category_id = (SELECT id FROM vehicle_categories WHERE name = 'Car') LIMIT 1)),
('i20',     (SELECT id FROM vehicle_brands WHERE name = 'Hyundai' AND vehicle_category_id = (SELECT id FROM vehicle_categories WHERE name = 'Car') LIMIT 1));

-- Dacia models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('Logan',     (SELECT id FROM vehicle_brands WHERE name = 'Dacia' LIMIT 1)),
('Sandero',   (SELECT id FROM vehicle_brands WHERE name = 'Dacia' LIMIT 1)),
('Duster',    (SELECT id FROM vehicle_brands WHERE name = 'Dacia' LIMIT 1));

-- Yamaha moto models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('YZF-R3',   (SELECT id FROM vehicle_brands WHERE name = 'Yamaha' LIMIT 1)),
('MT-07',    (SELECT id FROM vehicle_brands WHERE name = 'Yamaha' LIMIT 1)),
('NMAX 125', (SELECT id FROM vehicle_brands WHERE name = 'Yamaha' LIMIT 1));

-- Honda moto models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('CB500F',    (SELECT id FROM vehicle_brands WHERE name = 'Honda' LIMIT 1)),
('PCX 125',   (SELECT id FROM vehicle_brands WHERE name = 'Honda' LIMIT 1)),
('CRF300L',   (SELECT id FROM vehicle_brands WHERE name = 'Honda' LIMIT 1));

-- Mercedes Trucks models
INSERT INTO vehicle_models (name, vehicle_brand_id) VALUES
('Actros',  (SELECT id FROM vehicle_brands WHERE name = 'Mercedes Trucks' LIMIT 1)),
('Atego',   (SELECT id FROM vehicle_brands WHERE name = 'Mercedes Trucks' LIMIT 1));

-- ============================================================
-- SAMPLE PRODUCTS
-- ============================================================
INSERT INTO products (name, slug, brand_id, category_id, oil_type, viscosity_grade, volume, price, description, api_standard, images, compatible_vehicle_types, in_stock, featured) VALUES

-- Castrol
('Castrol EDGE 5W-30 LL', 'castrol-edge-5w30-ll', 
  (SELECT id FROM brands WHERE name = 'Castrol'), 
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Synthetic', '5W-30', '4L', 8500.00,
  'Castrol EDGE with Fluid TITANIUM Technology is Castrol''s strongest and most advanced range of engine oils. Recommended for modern engines requiring 5W-30 specification.',
  'API SN/CF, ACEA C3', 
  '{}', ARRAY['Car'], true, true),

('Castrol GTX 15W-40', 'castrol-gtx-15w40',
  (SELECT id FROM brands WHERE name = 'Castrol'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Mineral', '15W-40', '4L', 3800.00,
  'Castrol GTX provides superior sludge protection vs the latest industry standard. The double-action formula cleans away old sludge and protects against new sludge formation.',
  'API SN/CF',
  '{}', ARRAY['Car'], true, false),

-- Total / Elf
('Total Quartz 9000 Energy 5W-40', 'total-quartz-9000-5w40',
  (SELECT id FROM brands WHERE name = 'Total'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Synthetic', '5W-40', '5L', 9200.00,
  'Total Quartz 9000 Energy 5W-40 is a 100% synthetic lubricant designed for all types of gasoline and diesel engines, including turbo and multi-valve engines.',
  'API SN/CF, ACEA A3/B4',
  '{}', ARRAY['Car'], true, true),

('Total Quartz 7000 10W-40', 'total-quartz-7000-10w40',
  (SELECT id FROM brands WHERE name = 'Total'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Semi-Synthetic', '10W-40', '4L', 5500.00,
  'Total Quartz 7000 10W-40 is a semi-synthetic multigrade engine oil for gasoline and diesel engines. Excellent protection against wear and deposit formation.',
  'API SN/CF, ACEA A3/B4',
  '{}', ARRAY['Car'], true, false),

-- Mobil
('Mobil 1 ESP 5W-30', 'mobil-1-esp-5w30',
  (SELECT id FROM brands WHERE name = 'Mobil'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Synthetic', '5W-30', '4L', 9800.00,
  'Mobil 1 ESP 5W-30 is an advanced full synthetic motor oil designed to help provide exceptional cleaning power, wear protection and overall performance.',
  'API SN, ACEA C2/C3',
  '{}', ARRAY['Car'], true, true),

('Mobil Super 3000 X1 5W-40', 'mobil-super-3000-5w40',
  (SELECT id FROM brands WHERE name = 'Mobil'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Synthetic', '5W-40', '4L', 7500.00,
  'Mobil Super 3000 X1 5W-40 is a synthetic technology motor oil that provides proven protection for a range of demanding driving conditions.',
  'API SN/CF, ACEA A3/B3, A3/B4',
  '{}', ARRAY['Car'], true, true),

-- Shell
('Shell Helix Ultra 5W-40', 'shell-helix-ultra-5w40',
  (SELECT id FROM brands WHERE name = 'Shell'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Synthetic', '5W-40', '4L', 8900.00,
  'Shell Helix Ultra 5W-40 is a fully synthetic motor oil made from natural gas using Shell''s PurePlus Technology. It provides outstanding engine cleanliness and protection.',
  'API SN/CF, ACEA A3/B3, A3/B4',
  '{}', ARRAY['Car'], true, true),

('Shell Helix HX7 10W-40', 'shell-helix-hx7-10w40',
  (SELECT id FROM brands WHERE name = 'Shell'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Semi-Synthetic', '10W-40', '4L', 4800.00,
  'Shell Helix HX7 10W-40 semi-synthetic oil. Active cleansing agents help prevent dirt and sludge build-up to help maintain engine efficiency.',
  'API SN/CF, ACEA A3/B3, A3/B4',
  '{}', ARRAY['Car'], true, false),

-- Motul
('Motul 8100 X-cess 5W-40', 'motul-8100-xcess-5w40',
  (SELECT id FROM brands WHERE name = 'Motul'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Synthetic', '5W-40', '5L', 10500.00,
  'Motul 8100 X-cess 5W-40 is a 100% synthetic engine lubricant specially designed for powerful and recent cars fitted with large displacement engines, turbo Diesel or Gasoline direct injection.',
  'API SN/CF, ACEA A3/B4',
  '{}', ARRAY['Car'], true, true),

('Motul 5100 4T 10W-40', 'motul-5100-4t-10w40',
  (SELECT id FROM brands WHERE name = 'Motul'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Semi-Synthetic', '10W-40', '1L', 2800.00,
  'Motul 5100 4T 10W-40 is a technosynthese ester lubricant for 4-stroke motorcycle engines. Meets the requirements of catalytic converter equipped motorcycles.',
  'API SL, JASO MA2',
  '{}', ARRAY['Moto'], true, false),

-- Truck oil
('Shell Rimula R6 LME 5W-30', 'shell-rimula-r6-lme-5w30',
  (SELECT id FROM brands WHERE name = 'Shell'),
  (SELECT id FROM categories WHERE name = 'Engine Oil'),
  'Synthetic', '5W-30', '20L', 32000.00,
  'Shell Rimula R6 LME 5W-30 is a fully synthetic heavy duty diesel engine oil for Euro 4 and Euro 5 trucks. Delivers extended drain intervals and better fuel economy.',
  'API CK-4, ACEA E6/E9',
  '{}', ARRAY['Truck'], true, false),

-- Gear Oil
('Total Transmission Gear 8 75W-80', 'total-transmission-gear8-75w80',
  (SELECT id FROM brands WHERE name = 'Total'),
  (SELECT id FROM categories WHERE name = 'Gear Oil'),
  'Synthetic', '75W-80', '1L', 2200.00,
  'Total Transmission Gear 8 75W-80 is a synthetic manual gearbox oil for cars. Provides excellent protection against wear and ensures smooth shifting.',
  'API GL-4+',
  '{}', ARRAY['Car'], true, false);

-- ============================================================
-- VEHICLE VERSIONS / ENGINES (with product recommendations)
-- ============================================================

-- Peugeot 208 versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.2 PureTech 82',  (SELECT id FROM vehicle_models WHERE name = '208' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-9000-5w40')),
('1.2 PureTech 110', (SELECT id FROM vehicle_models WHERE name = '208' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-9000-5w40')),
('1.6 BlueHDi 75',   (SELECT id FROM vehicle_models WHERE name = '208' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-9000-5w40')),
('1.6 BlueHDi 100',  (SELECT id FROM vehicle_models WHERE name = '208' LIMIT 1), (SELECT id FROM products WHERE slug = 'castrol-edge-5w30-ll'));

-- Peugeot 301 versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.6 VTi 115',     (SELECT id FROM vehicle_models WHERE name = '301' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-7000-10w40')),
('1.6 HDi 92',      (SELECT id FROM vehicle_models WHERE name = '301' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-9000-5w40'));

-- Renault Clio versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.2 16V 75',      (SELECT id FROM vehicle_models WHERE name = 'Clio' LIMIT 1), (SELECT id FROM products WHERE slug = 'castrol-gtx-15w40')),
('1.5 dCi 85',      (SELECT id FROM vehicle_models WHERE name = 'Clio' LIMIT 1), (SELECT id FROM products WHERE slug = 'castrol-edge-5w30-ll')),
('0.9 TCe 90',      (SELECT id FROM vehicle_models WHERE name = 'Clio' LIMIT 1), (SELECT id FROM products WHERE slug = 'castrol-edge-5w30-ll'));

-- Renault Symbol versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.6 16V',         (SELECT id FROM vehicle_models WHERE name = 'Symbol' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-7000-10w40')),
('1.5 dCi 65',      (SELECT id FROM vehicle_models WHERE name = 'Symbol' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-9000-5w40'));

-- Toyota Corolla versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.3 VVT-i',       (SELECT id FROM vehicle_models WHERE name = 'Corolla' LIMIT 1), (SELECT id FROM products WHERE slug = 'mobil-1-esp-5w30')),
('1.6 VVT-i',       (SELECT id FROM vehicle_models WHERE name = 'Corolla' LIMIT 1), (SELECT id FROM products WHERE slug = 'mobil-1-esp-5w30')),
('2.0 D-4D',        (SELECT id FROM vehicle_models WHERE name = 'Corolla' LIMIT 1), (SELECT id FROM products WHERE slug = 'shell-helix-ultra-5w40'));

-- Toyota Hilux versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('2.4 D-4D',        (SELECT id FROM vehicle_models WHERE name = 'Hilux' LIMIT 1), (SELECT id FROM products WHERE slug = 'shell-helix-ultra-5w40')),
('2.8 D-4D',        (SELECT id FROM vehicle_models WHERE name = 'Hilux' LIMIT 1), (SELECT id FROM products WHERE slug = 'mobil-super-3000-5w40'));

-- VW Golf versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.4 TSI 125',     (SELECT id FROM vehicle_models WHERE name = 'Golf' LIMIT 1), (SELECT id FROM products WHERE slug = 'castrol-edge-5w30-ll')),
('1.6 TDI 110',     (SELECT id FROM vehicle_models WHERE name = 'Golf' LIMIT 1), (SELECT id FROM products WHERE slug = 'castrol-edge-5w30-ll')),
('2.0 TDI 150',     (SELECT id FROM vehicle_models WHERE name = 'Golf' LIMIT 1), (SELECT id FROM products WHERE slug = 'mobil-1-esp-5w30'));

-- Hyundai Accent versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.4 CVVT',        (SELECT id FROM vehicle_models WHERE name = 'Accent' LIMIT 1), (SELECT id FROM products WHERE slug = 'shell-helix-hx7-10w40')),
('1.6 CRDi',        (SELECT id FROM vehicle_models WHERE name = 'Accent' LIMIT 1), (SELECT id FROM products WHERE slug = 'shell-helix-ultra-5w40'));

-- Dacia Logan versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('1.0 SCe 75',      (SELECT id FROM vehicle_models WHERE name = 'Logan' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-7000-10w40')),
('1.5 dCi 75',      (SELECT id FROM vehicle_models WHERE name = 'Logan' LIMIT 1), (SELECT id FROM products WHERE slug = 'total-quartz-9000-5w40')),
('0.9 TCe 90',      (SELECT id FROM vehicle_models WHERE name = 'Logan' LIMIT 1), (SELECT id FROM products WHERE slug = 'castrol-edge-5w30-ll'));

-- Yamaha YZF-R3 versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('321cc 2-Cylinder', (SELECT id FROM vehicle_models WHERE name = 'YZF-R3' LIMIT 1), (SELECT id FROM products WHERE slug = 'motul-5100-4t-10w40'));

-- Honda CB500F versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('471cc Twin',       (SELECT id FROM vehicle_models WHERE name = 'CB500F' LIMIT 1), (SELECT id FROM products WHERE slug = 'motul-5100-4t-10w40'));

-- Mercedes Actros truck versions
INSERT INTO vehicle_versions (name, vehicle_model_id, recommended_product_id) VALUES
('OM 471 12.8L',    (SELECT id FROM vehicle_models WHERE name = 'Actros' LIMIT 1), (SELECT id FROM products WHERE slug = 'shell-rimula-r6-lme-5w30')),
('OM 473 15.6L',    (SELECT id FROM vehicle_models WHERE name = 'Actros' LIMIT 1), (SELECT id FROM products WHERE slug = 'shell-rimula-r6-lme-5w30'));

-- ============================================================
-- VERIFY DATA
-- ============================================================
DO $$
DECLARE
  v_brands INT; v_cats INT; v_products INT; v_vc INT; v_vb INT; v_vm INT; v_vv INT; v_wilayas INT;
BEGIN
  SELECT COUNT(*) INTO v_brands FROM brands;
  SELECT COUNT(*) INTO v_cats FROM categories;
  SELECT COUNT(*) INTO v_products FROM products;
  SELECT COUNT(*) INTO v_vc FROM vehicle_categories;
  SELECT COUNT(*) INTO v_vb FROM vehicle_brands;
  SELECT COUNT(*) INTO v_vm FROM vehicle_models;
  SELECT COUNT(*) INTO v_vv FROM vehicle_versions;
  SELECT COUNT(*) INTO v_wilayas FROM delivery_prices;
  
  RAISE NOTICE '✅ Brands:             %', v_brands;
  RAISE NOTICE '✅ Categories:          %', v_cats;
  RAISE NOTICE '✅ Products:            %', v_products;
  RAISE NOTICE '✅ Vehicle Categories:  %', v_vc;
  RAISE NOTICE '✅ Vehicle Brands:      %', v_vb;
  RAISE NOTICE '✅ Vehicle Models:      %', v_vm;
  RAISE NOTICE '✅ Vehicle Versions:    %', v_vv;
  RAISE NOTICE '✅ Wilayas:             %', v_wilayas;
  RAISE NOTICE '🎉 All data seeded successfully!';
END $$;





