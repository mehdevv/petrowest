-- Count at most 1 visit per visitor per hour
CREATE OR REPLACE FUNCTION record_page_view(
  p_page_path TEXT,
  p_referrer TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN := FALSE;
BEGIN
  IF p_visitor_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM page_views
      WHERE visitor_id = p_visitor_id
        AND created_at >= NOW() - INTERVAL '1 hour'
    )
    INTO v_exists;
  END IF;

  IF NOT v_exists THEN
    INSERT INTO page_views (page_path, referrer, visitor_id)
    VALUES (p_page_path, p_referrer, p_visitor_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'recorded', NOT v_exists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_page_view(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_page_view(TEXT, TEXT, TEXT) TO authenticated;

