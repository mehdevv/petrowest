-- ============================================================
-- PETRO WEST — ALL 58 ALGERIAN WILAYAS + DELIVERY PRICES
-- Run this THIRD in Supabase SQL Editor
-- ============================================================
-- price        = Stopdesk price (DA)
-- domicile_price = Home delivery price (DA)
-- ============================================================

INSERT INTO delivery_prices (wilaya_code, wilaya_name, price, domicile_price) VALUES
('01', 'Adrar',         700, 1100),
('02', 'Chlef',         400, 700),
('03', 'Laghouat',      500, 800),
('04', 'Oum El Bouaghi',400, 700),
('05', 'Batna',         400, 700),
('06', 'Béjaïa',        400, 700),
('07', 'Biskra',        450, 750),
('08', 'Béchar',        650, 1000),
('09', 'Blida',         300, 500),
('10', 'Bouira',        350, 600),
('11', 'Tamanrasset',   800, 1200),
('12', 'Tébessa',       450, 750),
('13', 'Tlemcen',       450, 750),
('14', 'Tiaret',        450, 750),
('15', 'Tizi Ouzou',    350, 600),
('16', 'Alger',         250, 400),
('17', 'Djelfa',        450, 750),
('18', 'Jijel',         400, 700),
('19', 'Sétif',         400, 650),
('20', 'Saïda',         500, 800),
('21', 'Skikda',        400, 700),
('22', 'Sidi Bel Abbès',450, 750),
('23', 'Annaba',        400, 650),
('24', 'Guelma',        400, 700),
('25', 'Constantine',   350, 600),
('26', 'Médéa',         350, 600),
('27', 'Mostaganem',    400, 700),
('28', 'M''sila',       400, 700),
('29', 'Mascara',       450, 750),
('30', 'Ouargla',       550, 900),
('31', 'Oran',          350, 600),
('32', 'El Bayadh',     550, 900),
('33', 'Illizi',        800, 1200),
('34', 'Bordj Bou Arréridj', 400, 650),
('35', 'Boumerdès',     300, 500),
('36', 'El Tarf',       400, 700),
('37', 'Tindouf',       800, 1200),
('38', 'Tissemsilt',    450, 750),
('39', 'El Oued',       500, 850),
('40', 'Khenchela',     450, 750),
('41', 'Souk Ahras',    450, 750),
('42', 'Tipaza',        300, 500),
('43', 'Mila',          400, 650),
('44', 'Aïn Defla',     400, 650),
('45', 'Naâma',         550, 900),
('46', 'Aïn Témouchent',450, 750),
('47', 'Ghardaïa',      550, 900),
('48', 'Relizane',      400, 700),
('49', 'El M''ghair',   550, 900),
('50', 'El Meniaa',     600, 950),
('51', 'Ouled Djellal', 500, 850),
('52', 'Bordj Baji Mokhtar', 850, 1300),
('53', 'Béni Abbès',    700, 1100),
('54', 'Timimoun',      750, 1150),
('55', 'Touggourt',     500, 850),
('56', 'Djanet',        850, 1300),
('57', 'In Salah',      800, 1200),
('58', 'In Guezzam',    900, 1400)
ON CONFLICT (wilaya_code) DO UPDATE SET
  wilaya_name = EXCLUDED.wilaya_name,
  price = EXCLUDED.price,
  domicile_price = EXCLUDED.domicile_price;

-- ============================================================
-- DONE! Run 04-seed-data.sql next.
-- ============================================================





