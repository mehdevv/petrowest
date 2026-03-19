-- ============================================================
-- PETRO WEST — PAGE VIEWS AGGREGATION + 24H CLEANUP
-- Keeps page_views empty by aggregating into daily tables
-- Run this in Supabase SQL Editor (after 12-page-views.sql)
-- ============================================================

-- ============================================================
-- 1. AGGREGATE TABLES (store real numbers, empty page_views)
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_stats_daily (
  date DATE PRIMARY KEY,
  views BIGINT NOT NULL DEFAULT 0,
  unique_visitors BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS funnel_stats_daily (
  date DATE PRIMARY KEY,
  unique_visitors BIGINT NOT NULL DEFAULT 0,
  shop_browsers BIGINT NOT NULL DEFAULT 0,
  product_viewers BIGINT NOT NULL DEFAULT 0,
  total_visits BIGINT NOT NULL DEFAULT 0
);

-- ============================================================
-- 2. AGGREGATE & CLEANUP (run every 24h)
--    Aggregates yesterday's page_views into daily tables,
--    then deletes page_views older than 24h
-- ============================================================
CREATE OR REPLACE FUNCTION aggregate_and_cleanup_page_views()
RETURNS JSON AS $$
DECLARE
  v_date DATE := CURRENT_DATE - INTERVAL '1 day';
  v_views BIGINT;
  v_unique BIGINT;
  v_shop BIGINT;
  v_product BIGINT;
  v_total BIGINT;
  v_deleted BIGINT;
BEGIN
  -- Aggregate visit stats for yesterday
  SELECT COUNT(*), COUNT(DISTINCT visitor_id)
  INTO v_views, v_unique
  FROM page_views
  WHERE created_at >= v_date AND created_at < v_date + INTERVAL '1 day';

  -- Aggregate funnel stats for yesterday
  SELECT
    COUNT(DISTINCT visitor_id),
    COUNT(DISTINCT CASE WHEN (page_path = '/shop' OR page_path LIKE '/shop/%') THEN visitor_id END),
    COUNT(DISTINCT CASE WHEN page_path LIKE '/shop/%' AND page_path != '/shop/' THEN visitor_id END),
    COUNT(*)
  INTO v_unique, v_shop, v_product, v_total
  FROM page_views
  WHERE created_at >= v_date AND created_at < v_date + INTERVAL '1 day'
    AND visitor_id IS NOT NULL;

  -- Upsert into visit_stats_daily
  INSERT INTO visit_stats_daily (date, views, unique_visitors)
  VALUES (v_date, COALESCE(v_views, 0), COALESCE(v_unique, 0))
  ON CONFLICT (date) DO UPDATE SET
    views = visit_stats_daily.views + EXCLUDED.views,
    unique_visitors = visit_stats_daily.unique_visitors + EXCLUDED.unique_visitors;

  -- Upsert into funnel_stats_daily
  INSERT INTO funnel_stats_daily (date, unique_visitors, shop_browsers, product_viewers, total_visits)
  VALUES (v_date, COALESCE(v_unique, 0), COALESCE(v_shop, 0), COALESCE(v_product, 0), COALESCE(v_total, 0))
  ON CONFLICT (date) DO UPDATE SET
    unique_visitors = funnel_stats_daily.unique_visitors + EXCLUDED.unique_visitors,
    shop_browsers = funnel_stats_daily.shop_browsers + EXCLUDED.shop_browsers,
    product_viewers = funnel_stats_daily.product_viewers + EXCLUDED.product_viewers,
    total_visits = funnel_stats_daily.total_visits + EXCLUDED.total_visits;

  -- Delete page_views older than 24h
  WITH deleted AS (
    DELETE FROM page_views
    WHERE created_at < CURRENT_DATE
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;

  RETURN json_build_object(
    'success', true,
    'aggregated_date', v_date,
    'rows_deleted', v_deleted,
    'views_aggregated', COALESCE(v_views, 0),
    'unique_aggregated', COALESCE(v_unique, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. MIGRATE EXISTING DATA (one-time, before first cleanup)
--    Backfills visit_stats_daily + funnel_stats_daily, then deletes old page_views
-- ============================================================
CREATE OR REPLACE FUNCTION migrate_existing_page_views_to_aggregates()
RETURNS JSON AS $$
DECLARE
  r RECORD;
  v_views BIGINT;
  v_unique BIGINT;
  v_shop BIGINT;
  v_product BIGINT;
  v_total BIGINT;
  v_days INTEGER := 0;
  v_deleted BIGINT;
BEGIN
  FOR r IN (
    SELECT created_at::date AS d
    FROM page_views
    WHERE created_at < CURRENT_DATE
    GROUP BY created_at::date
  )
  LOOP
    SELECT COUNT(*), COUNT(DISTINCT visitor_id)
    INTO v_views, v_unique
    FROM page_views
    WHERE created_at >= r.d AND created_at < r.d + INTERVAL '1 day';

    SELECT
      COUNT(DISTINCT visitor_id),
      COUNT(DISTINCT CASE WHEN (page_path = '/shop' OR page_path LIKE '/shop/%') THEN visitor_id END),
      COUNT(DISTINCT CASE WHEN page_path LIKE '/shop/%' AND page_path != '/shop/' THEN visitor_id END),
      COUNT(*)
    INTO v_unique, v_shop, v_product, v_total
    FROM page_views
    WHERE created_at >= r.d AND created_at < r.d + INTERVAL '1 day'
      AND visitor_id IS NOT NULL;

    INSERT INTO visit_stats_daily (date, views, unique_visitors)
    VALUES (r.d, COALESCE(v_views, 0), COALESCE(v_unique, 0))
    ON CONFLICT (date) DO UPDATE SET
      views = visit_stats_daily.views + EXCLUDED.views,
      unique_visitors = visit_stats_daily.unique_visitors + EXCLUDED.unique_visitors;

    INSERT INTO funnel_stats_daily (date, unique_visitors, shop_browsers, product_viewers, total_visits)
    VALUES (r.d, COALESCE(v_unique, 0), COALESCE(v_shop, 0), COALESCE(v_product, 0), COALESCE(v_total, 0))
    ON CONFLICT (date) DO UPDATE SET
      unique_visitors = funnel_stats_daily.unique_visitors + EXCLUDED.unique_visitors,
      shop_browsers = funnel_stats_daily.shop_browsers + EXCLUDED.shop_browsers,
      product_viewers = funnel_stats_daily.product_viewers + EXCLUDED.product_viewers,
      total_visits = funnel_stats_daily.total_visits + EXCLUDED.total_visits;

    v_days := v_days + 1;
  END LOOP;

  -- Delete aggregated rows (keep only today's live data)
  WITH deleted AS (
    DELETE FROM page_views WHERE created_at < CURRENT_DATE RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;

  RETURN json_build_object('success', true, 'days_migrated', v_days, 'rows_deleted', v_deleted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. UPDATED get_visit_stats
--    Combines visit_stats_daily (history) + page_views (today live)
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
  -- Today: live from page_views
  SELECT COUNT(*), COUNT(DISTINCT visitor_id) INTO v_today, v_unique_today
  FROM page_views WHERE created_at >= CURRENT_DATE;

  -- Week: today (live) + visit_stats_daily
  SELECT COALESCE(SUM(views), 0), COALESCE(SUM(unique_visitors), 0)
  INTO v_week, v_unique_week
  FROM visit_stats_daily
  WHERE date >= date_trunc('week', CURRENT_TIMESTAMP)::date AND date < CURRENT_DATE;
  v_week := v_week + v_today;
  v_unique_week := v_unique_week + v_unique_today;

  -- Month: today (live) + visit_stats_daily
  SELECT COALESCE(SUM(views), 0), COALESCE(SUM(unique_visitors), 0)
  INTO v_month, v_unique_month
  FROM visit_stats_daily
  WHERE date >= date_trunc('month', CURRENT_TIMESTAMP)::date AND date < CURRENT_DATE;
  v_month := v_month + v_today;
  v_unique_month := v_unique_month + v_unique_today;

  -- Total: all visit_stats_daily + today
  SELECT COALESCE(SUM(views), 0), COALESCE(SUM(unique_visitors), 0)
  INTO v_total, v_unique_total
  FROM visit_stats_daily;
  v_total := v_total + v_today;
  v_unique_total := v_unique_total + v_unique_today;

  -- Daily chart: visit_stats_daily (past) + page_views (today)
  SELECT json_agg(row_to_json(t) ORDER BY t.date) INTO v_daily
  FROM (
    SELECT
      d::date AS date,
      CASE WHEN d::date = CURRENT_DATE THEN v_today ELSE COALESCE(pv.views, 0) END AS views,
      CASE WHEN d::date = CURRENT_DATE THEN v_unique_today ELSE COALESCE(pv.unique_visitors, 0) END AS "uniqueVisitors"
    FROM generate_series(
      CURRENT_DATE - INTERVAL '29 days',
      CURRENT_DATE,
      '1 day'
    ) AS d
    LEFT JOIN visit_stats_daily pv ON pv.date = d::date
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
-- 5. UPDATED get_funnel_stats
--    Combines funnel_stats_daily (history) + page_views (today)
--    Note: unique visitors = sum of daily uniques (approx if same person visits multiple days)
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
  v_today_unique BIGINT;
  v_today_shop BIGINT;
  v_today_product BIGINT;
  v_today_total BIGINT;
BEGIN
  -- Today: live from page_views
  SELECT
    COUNT(DISTINCT visitor_id),
    COUNT(DISTINCT CASE WHEN (page_path = '/shop' OR page_path LIKE '/shop/%') THEN visitor_id END),
    COUNT(DISTINCT CASE WHEN page_path LIKE '/shop/%' AND page_path != '/shop/' THEN visitor_id END),
    COUNT(*)
  INTO v_today_unique, v_today_shop, v_today_product, v_today_total
  FROM page_views
  WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND created_at >= CURRENT_DATE
    AND visitor_id IS NOT NULL;

  -- This month (past days): from funnel_stats_daily
  SELECT
    COALESCE(SUM(unique_visitors), 0),
    COALESCE(SUM(shop_browsers), 0),
    COALESCE(SUM(product_viewers), 0),
    COALESCE(SUM(total_visits), 0)
  INTO v_unique_visitors, v_shop_browsers, v_product_viewers, v_total_visits
  FROM funnel_stats_daily
  WHERE date >= date_trunc('month', CURRENT_TIMESTAMP)::date
    AND date < CURRENT_DATE;

  -- Add today
  v_unique_visitors := COALESCE(v_unique_visitors, 0) + COALESCE(v_today_unique, 0);
  v_shop_browsers := COALESCE(v_shop_browsers, 0) + COALESCE(v_today_shop, 0);
  v_product_viewers := COALESCE(v_product_viewers, 0) + COALESCE(v_today_product, 0);
  v_total_visits := COALESCE(v_total_visits, 0) + COALESCE(v_today_total, 0);

  -- Orders this month
  SELECT COUNT(*) INTO v_buyers
  FROM orders
  WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP);

  -- Percentages
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
-- 6. GRANTS
-- ============================================================
GRANT EXECUTE ON FUNCTION aggregate_and_cleanup_page_views() TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_and_cleanup_page_views() TO anon;
GRANT EXECUTE ON FUNCTION migrate_existing_page_views_to_aggregates() TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_existing_page_views_to_aggregates() TO service_role;
GRANT EXECUTE ON FUNCTION aggregate_and_cleanup_page_views() TO service_role;

-- ============================================================
-- SETUP (run once in Supabase SQL Editor):
-- 1. Run this entire file
-- 2. Run: SELECT migrate_existing_page_views_to_aggregates();
--    (backfills visit_stats_daily + funnel_stats_daily from existing page_views)
-- 3. GitHub workflow runs aggregate_and_cleanup_page_views() daily at 00:00 UTC
-- 4. Or trigger manually from admin dashboard "Lancer l'agrégation"
-- ============================================================
