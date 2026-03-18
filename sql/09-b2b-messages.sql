-- =====================================================
-- B2B Contact Messages
-- =====================================================

CREATE TABLE IF NOT EXISTS b2b_messages (
  id          BIGSERIAL PRIMARY KEY,
  company     TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_b2b_messages_created ON b2b_messages (created_at DESC);
CREATE INDEX idx_b2b_messages_is_read ON b2b_messages (is_read);

-- RLS: allow anonymous inserts (public form), admin reads via SECURITY DEFINER RPCs
ALTER TABLE b2b_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on b2b_messages"
  ON b2b_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public insert RPC (SECURITY DEFINER bypasses all grants/RLS issues)
CREATE OR REPLACE FUNCTION create_b2b_message(
  p_company TEXT,
  p_phone   TEXT,
  p_email   TEXT,
  p_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row b2b_messages;
BEGIN
  INSERT INTO b2b_messages (company, phone, email, message)
  VALUES (p_company, p_phone, p_email, p_message)
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id', v_row.id,
    'company', v_row.company,
    'phone', v_row.phone,
    'email', v_row.email,
    'message', v_row.message,
    'isRead', v_row.is_read,
    'createdAt', v_row.created_at
  );
END;
$$;

-- Admin list RPC (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION list_b2b_messages_admin(
  p_is_read  BOOLEAN  DEFAULT NULL,
  p_search   TEXT     DEFAULT NULL,
  p_page     INT      DEFAULT 1,
  p_limit    INT      DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT := (p_page - 1) * p_limit;
  v_total  INT;
  v_rows   JSON;
BEGIN
  SELECT count(*) INTO v_total
    FROM b2b_messages
   WHERE (p_is_read IS NULL OR is_read = p_is_read)
     AND (p_search IS NULL OR company ILIKE '%' || p_search || '%'
          OR email ILIKE '%' || p_search || '%');

  SELECT json_agg(t) INTO v_rows
    FROM (
      SELECT id, company, phone, email, message, is_read, created_at
        FROM b2b_messages
       WHERE (p_is_read IS NULL OR is_read = p_is_read)
         AND (p_search IS NULL OR company ILIKE '%' || p_search || '%'
              OR email ILIKE '%' || p_search || '%')
       ORDER BY created_at DESC
       LIMIT p_limit OFFSET v_offset
    ) t;

  RETURN json_build_object(
    'messages', COALESCE(v_rows, '[]'::json),
    'total', v_total,
    'page', p_page,
    'limit', p_limit
  );
END;
$$;

-- Mark as read/unread RPC
CREATE OR REPLACE FUNCTION update_b2b_message_admin(
  p_id      BIGINT,
  p_is_read BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row b2b_messages;
BEGIN
  IF p_is_read IS NOT NULL THEN
    UPDATE b2b_messages SET is_read = p_is_read WHERE id = p_id;
  END IF;

  SELECT * INTO v_row FROM b2b_messages WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'B2B message not found';
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'company', v_row.company,
    'phone', v_row.phone,
    'email', v_row.email,
    'message', v_row.message,
    'isRead', v_row.is_read,
    'createdAt', v_row.created_at
  );
END;
$$;

-- Delete RPC
CREATE OR REPLACE FUNCTION delete_b2b_message_admin(p_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM b2b_messages WHERE id = p_id;
END;
$$;

-- Unread count helper
CREATE OR REPLACE FUNCTION get_b2b_unread_count()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM b2b_messages WHERE is_read = false;
  RETURN json_build_object('count', v_count);
END;
$$;

-- Table-level grants so Supabase anon key can insert (public form) and select (return row)
GRANT INSERT, SELECT ON b2b_messages TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE b2b_messages_id_seq TO anon, authenticated;

-- Grant execute to anon + authenticated so Supabase client can call them
GRANT EXECUTE ON FUNCTION create_b2b_message TO anon, authenticated;
GRANT EXECUTE ON FUNCTION list_b2b_messages_admin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_b2b_message_admin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_b2b_message_admin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_b2b_unread_count TO anon, authenticated;
