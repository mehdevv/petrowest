-- ============================================================
-- PETRO WEST — PAGE VIEWS TRACKING + FUNNEL ANALYTICS
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. PAGE VIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  page_path TEXT NOT NULL,
  referrer TEXT,
  visitor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);

-- ============================================================
-- 2. RECORD A PAGE VIEW (public, SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION record_page_view(
  p_page_path TEXT,
  p_referrer TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  INSERT INTO page_views (page_path, referrer, visitor_id)
  VALUES (p_page_path, p_referrer, p_visitor_id);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. GET VISIT STATS (admin dashboard)
--    Returns daily visits for the last 30 days + summary totals
--    Now includes unique visitor counts
-- ============================================================
CREATE OR REPLACE FUNCTION get_visit_stats()
RETURNS JSON AS $$
DECLARE
  v_today BIGINT;
  v_week BIGINT;
  v_month BIGINT;
  v_total BIGINT;
  v_unique_today BIGINT;
  v_unique_week BIGINT;
  v_unique_month BIGINT;
  v_unique_total BIGINT;
  v_daily JSON;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT visitor_id) INTO v_today, v_unique_today
  FROM page_views WHERE created_at >= CURRENT_DATE;

  SELECT COUNT(*), COUNT(DISTINCT visitor_id) INTO v_week, v_unique_week
  FROM page_views WHERE created_at >= date_trunc('week', CURRENT_TIMESTAMP);

  SELECT COUNT(*), COUNT(DISTINCT visitor_id) INTO v_month, v_unique_month
  FROM page_views WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP);

  SELECT COUNT(*), COUNT(DISTINCT visitor_id) INTO v_total, v_unique_total
  FROM page_views;

  SELECT json_agg(row_to_json(t) ORDER BY t.date) INTO v_daily
  FROM (
    SELECT
      d::date AS date,
      COALESCE(pv.cnt, 0) AS views,
      COALESCE(pv.uniq, 0) AS "uniqueVisitors"
    FROM generate_series(
      CURRENT_DATE - INTERVAL '29 days',
      CURRENT_DATE,
      '1 day'
    ) AS d
    LEFT JOIN (
      SELECT
        created_at::date AS day,
        COUNT(*) AS cnt,
        COUNT(DISTINCT visitor_id) AS uniq
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY created_at::date
    ) pv ON pv.day = d::date
  ) t;

  RETURN json_build_object(
    'todayViews', v_today,
    'weekViews', v_week,
    'monthViews', v_month,
    'totalViews', v_total,
    'uniqueToday', v_unique_today,
    'uniqueWeek', v_unique_week,
    'uniqueMonth', v_unique_month,
    'uniqueTotal', v_unique_total,
    'daily', COALESCE(v_daily, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. GET FUNNEL STATS (admin dashboard)
--    Conversion funnel for current month:
--    All Visitors → Shop Browsers → Product Viewers → Buyers
-- ============================================================
CREATE OR REPLACE FUNCTION get_funnel_stats()
RETURNS JSON AS $$
DECLARE
  v_unique_visitors BIGINT;
  v_total_visits BIGINT;
  v_shop_browsers BIGINT;
  v_product_viewers BIGINT;
  v_buyers BIGINT;
  v_pct_shop NUMERIC(5,1);
  v_pct_product NUMERIC(5,1);
  v_pct_buyers NUMERIC(5,1);
BEGIN
  -- All unique visitors this month
  SELECT COUNT(DISTINCT visitor_id), COUNT(*)
  INTO v_unique_visitors, v_total_visits
  FROM page_views
  WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND visitor_id IS NOT NULL;

  -- Unique visitors who visited /shop (any shop page)
  SELECT COUNT(DISTINCT visitor_id) INTO v_shop_browsers
  FROM page_views
  WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND visitor_id IS NOT NULL
    AND (page_path = '/shop' OR page_path LIKE '/shop/%');

  -- Unique visitors who viewed a specific product (/shop/some-slug, not just /shop)
  SELECT COUNT(DISTINCT visitor_id) INTO v_product_viewers
  FROM page_views
  WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND visitor_id IS NOT NULL
    AND page_path LIKE '/shop/%'
    AND page_path != '/shop/';

  -- Orders placed this month
  SELECT COUNT(*) INTO v_buyers
  FROM orders
  WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP);

  -- Calculate percentages (relative to unique visitors)
  IF v_unique_visitors > 0 THEN
    v_pct_shop    := ROUND((v_shop_browsers::NUMERIC  / v_unique_visitors) * 100, 1);
    v_pct_product := ROUND((v_product_viewers::NUMERIC / v_unique_visitors) * 100, 1);
    v_pct_buyers  := ROUND((v_buyers::NUMERIC          / v_unique_visitors) * 100, 1);
  ELSE
    v_pct_shop    := 0;
    v_pct_product := 0;
    v_pct_buyers  := 0;
  END IF;

  RETURN json_build_object(
    'totalVisits', v_total_visits,
    'uniqueVisitors', v_unique_visitors,
    'shopBrowsers', v_shop_browsers,
    'productViewers', v_product_viewers,
    'buyers', v_buyers,
    'pctShop', v_pct_shop,
    'pctProduct', v_pct_product,
    'pctBuyers', v_pct_buyers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. GRANTS
-- ============================================================
GRANT EXECUTE ON FUNCTION record_page_view(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_page_view(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_visit_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_visit_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_funnel_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_funnel_stats() TO authenticated;

-- ============================================================
-- DONE! Page views tracking + funnel analytics are ready.
-- ============================================================
