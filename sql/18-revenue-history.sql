-- ============================================================
-- PETRO WEST — Revenue history + month revenue = delivered only
-- Run once in Supabase SQL Editor.
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

CREATE OR REPLACE FUNCTION get_revenue_history()
RETURNS JSON AS $$
DECLARE
  v_daily   JSON;
  v_weekly  JSON;
  v_monthly JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'period', to_char(x.d, 'YYYY-MM-DD'),
      'revenue', x.rev,
      'orders', x.cnt
    ) ORDER BY x.d DESC
  ), '[]'::json)
  INTO v_daily
  FROM (
    SELECT
      date_trunc('day', created_at) AS d,
      SUM(total_price) AS rev,
      COUNT(*)::int AS cnt
    FROM orders
    WHERE status = 'Delivered'
      AND created_at >= date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '89 days'
    GROUP BY 1
  ) x;

  SELECT COALESCE(json_agg(
    json_build_object(
      'period', to_char(x.w, 'YYYY-MM-DD'),
      'revenue', x.rev,
      'orders', x.cnt
    ) ORDER BY x.w DESC
  ), '[]'::json)
  INTO v_weekly
  FROM (
    SELECT
      date_trunc('week', created_at) AS w,
      SUM(total_price) AS rev,
      COUNT(*)::int AS cnt
    FROM orders
    WHERE status = 'Delivered'
      AND created_at >= date_trunc('week', CURRENT_TIMESTAMP) - INTERVAL '51 weeks'
    GROUP BY 1
  ) x;

  SELECT COALESCE(json_agg(
    json_build_object(
      'period', to_char(x.m, 'YYYY-MM-DD'),
      'revenue', x.rev,
      'orders', x.cnt
    ) ORDER BY x.m DESC
  ), '[]'::json)
  INTO v_monthly
  FROM (
    SELECT
      date_trunc('month', created_at) AS m,
      SUM(total_price) AS rev,
      COUNT(*)::int AS cnt
    FROM orders
    WHERE status = 'Delivered'
      AND created_at >= date_trunc('month', CURRENT_TIMESTAMP) - INTERVAL '23 months'
    GROUP BY 1
  ) x;

  RETURN json_build_object(
    'daily',   v_daily,
    'weekly',  v_weekly,
    'monthly', v_monthly
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
