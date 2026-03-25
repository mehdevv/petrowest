-- ============================================================
-- PETRO WEST — Allow deleting products that have orders
-- ============================================================
-- 1. Store product name/price/slug on each order (snapshot).
-- 2. FK: ON DELETE SET NULL on orders.product_id (orders are kept).
-- 3. Admin RPCs use COALESCE(live product, snapshot).
-- 4. create_order fills snapshots for new orders.
--
-- Run once in Supabase SQL Editor (safe to re-run: IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- Snapshot columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_name_snapshot TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_price_snapshot NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_slug_snapshot TEXT;

-- Backfill from current catalogue (orders still linked to products)
UPDATE orders o
SET
  product_name_snapshot = p.name,
  product_price_snapshot = p.price,
  product_slug_snapshot = p.slug
FROM products p
WHERE o.product_id = p.id;

-- Replace FK: RESTRICT → SET NULL, product_id nullable
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE orders ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE orders
  ADD CONSTRAINT orders_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- ============================================================
-- create_order — persist snapshots
-- ============================================================
CREATE OR REPLACE FUNCTION create_order(
  p_product_id INT,
  p_customer_name TEXT,
  p_phone TEXT,
  p_wilaya_code TEXT,
  p_address TEXT,
  p_quantity INT,
  p_delivery_type TEXT DEFAULT 'stopdesk'
)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_delivery RECORD;
  v_wilaya_name TEXT;
  v_delivery_price NUMERIC;
  v_total NUMERIC;
  v_order RECORD;
BEGIN
  SELECT id, name, slug, price INTO v_product
  FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  SELECT dp.wilaya_name, dp.price, dp.domicile_price INTO v_delivery
  FROM delivery_prices dp WHERE dp.wilaya_code = p_wilaya_code;

  v_wilaya_name := COALESCE(v_delivery.wilaya_name, 'Unknown');

  IF p_delivery_type = 'domicile' THEN
    v_delivery_price := COALESCE(v_delivery.domicile_price, 800);
  ELSE
    v_delivery_price := COALESCE(v_delivery.price, 500);
  END IF;

  v_total := (v_product.price * p_quantity) + v_delivery_price;

  INSERT INTO orders (
    product_id,
    product_name_snapshot,
    product_price_snapshot,
    product_slug_snapshot,
    customer_name, phone, wilaya_code, wilaya_name, address, quantity, delivery_type, delivery_price, total_price, status
  )
  VALUES (
    p_product_id,
    v_product.name,
    v_product.price,
    v_product.slug,
    p_customer_name, p_phone, p_wilaya_code, v_wilaya_name, p_address, p_quantity, p_delivery_type, v_delivery_price, v_total, 'Pending'
  )
  RETURNING * INTO v_order;

  RETURN json_build_object(
    'id', v_order.id,
    'productId', v_order.product_id,
    'productName', v_product.name,
    'productPrice', v_product.price,
    'productSlug', v_product.slug,
    'customerName', v_order.customer_name,
    'phone', v_order.phone,
    'wilayaCode', v_order.wilaya_code,
    'wilayaName', v_order.wilaya_name,
    'address', v_order.address,
    'quantity', v_order.quantity,
    'deliveryType', v_order.delivery_type,
    'deliveryPrice', v_order.delivery_price,
    'totalPrice', v_order.total_price,
    'status', v_order.status,
    'notes', v_order.notes,
    'createdAt', v_order.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Admin order RPCs — COALESCE(join, snapshot)
-- ============================================================
CREATE OR REPLACE FUNCTION list_orders_admin(
  p_status    TEXT    DEFAULT NULL,
  p_search    TEXT    DEFAULT NULL,
  p_date_from TEXT    DEFAULT NULL,
  p_date_to   TEXT    DEFAULT NULL,
  p_page      INT     DEFAULT 1,
  p_limit     INT     DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
  v_offset  INT;
  v_total   BIGINT;
  v_rows    JSON;
BEGIN
  v_offset := (p_page - 1) * p_limit;

  SELECT COUNT(*)
  INTO v_total
  FROM orders o
  WHERE
    (p_status    IS NULL OR o.status = p_status)
    AND (p_search IS NULL OR
         o.customer_name ILIKE '%' || p_search || '%' OR
         o.phone          ILIKE '%' || p_search || '%')
    AND (p_date_from IS NULL OR o.created_at >= p_date_from::timestamptz)
    AND (p_date_to   IS NULL OR o.created_at <= p_date_to::timestamptz);

  SELECT json_agg(row_data ORDER BY row_data->>'createdAt' DESC)
  INTO v_rows
  FROM (
    SELECT json_build_object(
      'id',            o.id,
      'productId',     o.product_id,
      'productName',   COALESCE(p.name, o.product_name_snapshot),
      'productPrice',  COALESCE(p.price, o.product_price_snapshot),
      'productSlug',   COALESCE(p.slug, o.product_slug_snapshot),
      'customerName',  o.customer_name,
      'phone',         o.phone,
      'wilayaCode',    o.wilaya_code,
      'wilayaName',    o.wilaya_name,
      'address',       o.address,
      'quantity',      o.quantity,
      'deliveryType',  o.delivery_type,
      'deliveryPrice', o.delivery_price,
      'totalPrice',    o.total_price,
      'status',        o.status,
      'notes',         o.notes,
      'createdAt',     o.created_at
    ) AS row_data
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    WHERE
      (p_status    IS NULL OR o.status = p_status)
      AND (p_search IS NULL OR
           o.customer_name ILIKE '%' || p_search || '%' OR
           o.phone          ILIKE '%' || p_search || '%')
      AND (p_date_from IS NULL OR o.created_at >= p_date_from::timestamptz)
      AND (p_date_to   IS NULL OR o.created_at <= p_date_to::timestamptz)
    ORDER BY o.created_at DESC
    LIMIT  p_limit
    OFFSET v_offset
  ) sub;

  RETURN json_build_object(
    'orders', COALESCE(v_rows, '[]'::json),
    'total',  COALESCE(v_total, 0),
    'page',   p_page,
    'limit',  p_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_order_by_id_admin(p_id INT)
RETURNS JSON AS $$
DECLARE
  v_row JSON;
BEGIN
  SELECT json_build_object(
    'id',            o.id,
    'productId',     o.product_id,
    'productName',   COALESCE(p.name, o.product_name_snapshot),
    'productPrice',  COALESCE(p.price, o.product_price_snapshot),
    'productSlug',   COALESCE(p.slug, o.product_slug_snapshot),
    'customerName',  o.customer_name,
    'phone',         o.phone,
    'wilayaCode',    o.wilaya_code,
    'wilayaName',    o.wilaya_name,
    'address',       o.address,
    'quantity',      o.quantity,
    'deliveryType',  o.delivery_type,
    'deliveryPrice', o.delivery_price,
    'totalPrice',    o.total_price,
    'status',        o.status,
    'notes',         o.notes,
    'createdAt',     o.created_at
  )
  INTO v_row
  FROM orders o
  LEFT JOIN products p ON p.id = o.product_id
  WHERE o.id = p_id;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_order_admin(
  p_id     INT,
  p_status TEXT    DEFAULT NULL,
  p_notes  TEXT    DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_row JSON;
BEGIN
  UPDATE orders
  SET
    status     = COALESCE(p_status, status),
    notes      = COALESCE(p_notes,  notes),
    updated_at = NOW()
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT json_build_object(
    'id',            o.id,
    'productId',     o.product_id,
    'productName',   COALESCE(p.name, o.product_name_snapshot),
    'productPrice',  COALESCE(p.price, o.product_price_snapshot),
    'productSlug',   COALESCE(p.slug, o.product_slug_snapshot),
    'customerName',  o.customer_name,
    'phone',         o.phone,
    'wilayaCode',    o.wilaya_code,
    'wilayaName',    o.wilaya_name,
    'address',       o.address,
    'quantity',      o.quantity,
    'deliveryType',  o.delivery_type,
    'deliveryPrice', o.delivery_price,
    'totalPrice',    o.total_price,
    'status',        o.status,
    'notes',         o.notes,
    'createdAt',     o.created_at
  )
  INTO v_row
  FROM orders o
  LEFT JOIN products p ON p.id = o.product_id
  WHERE o.id = p_id;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
