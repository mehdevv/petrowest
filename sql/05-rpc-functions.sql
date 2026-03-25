-- ============================================================
-- PETRO WEST — RPC FUNCTIONS FOR SUPABASE
-- Run this AFTER all seed files in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ADMIN LOGIN (bcrypt password verification)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_login(p_email TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT id, email, name, password INTO v_admin
  FROM admin_users
  WHERE email = p_email;

  IF v_admin.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  IF v_admin.password = crypt(p_password, v_admin.password) THEN
    RETURN json_build_object(
      'success', true,
      'admin', json_build_object(
        'id', v_admin.id,
        'email', v_admin.email,
        'name', v_admin.name
      )
    );
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. ORDER STATISTICS
-- ============================================================
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS JSON AS $$
DECLARE
  v_today INT;
  v_week INT;
  v_month INT;
  v_revenue NUMERIC;
  v_pending INT;
BEGIN
  SELECT COUNT(*) INTO v_today
  FROM orders WHERE created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_week
  FROM orders WHERE created_at >= date_trunc('week', CURRENT_TIMESTAMP);

  SELECT COUNT(*) INTO v_month
  FROM orders WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP);

  -- Revenue = money actually received: delivered parcels only (not pending/shipped/cancelled)
  SELECT COALESCE(SUM(total_price), 0) INTO v_revenue
  FROM orders
  WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND status = 'Delivered';

  SELECT COUNT(*) INTO v_pending
  FROM orders WHERE status = 'Pending';

  RETURN json_build_object(
    'todayOrders', v_today,
    'weekOrders', v_week,
    'monthOrders', v_month,
    'monthRevenue', v_revenue,
    'pendingOrders', v_pending
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. CREATE ORDER (computes prices automatically, supports delivery type)
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
  -- Get product price
  SELECT id, name, slug, price INTO v_product
  FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Get delivery prices (both stopdesk and domicile)
  SELECT dp.wilaya_name, dp.price, dp.domicile_price INTO v_delivery
  FROM delivery_prices dp WHERE dp.wilaya_code = p_wilaya_code;

  v_wilaya_name := COALESCE(v_delivery.wilaya_name, 'Unknown');

  -- Pick the right price based on delivery type
  IF p_delivery_type = 'domicile' THEN
    v_delivery_price := COALESCE(v_delivery.domicile_price, 800);
  ELSE
    v_delivery_price := COALESCE(v_delivery.price, 500);
  END IF;

  v_total := (v_product.price * p_quantity) + v_delivery_price;

  -- Insert order (snapshots keep line-item info if product is deleted later)
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
-- DONE! All RPC functions are ready.
-- ============================================================


