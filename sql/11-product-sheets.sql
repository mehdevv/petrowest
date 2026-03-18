-- ============================================================
-- PRODUCT SHEETS (Security Sheet + Technical Sheet PDFs)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS security_sheet_url TEXT,
  ADD COLUMN IF NOT EXISTS technical_sheet_url TEXT;

-- 2. Create storage bucket for product sheets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-sheets', 'product-sheets', true, 10485760)  -- 10 MB limit
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies: public read, authenticated + anon can upload/update/delete
CREATE POLICY "product_sheets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-sheets');

CREATE POLICY "product_sheets_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-sheets');

CREATE POLICY "product_sheets_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-sheets');

CREATE POLICY "product_sheets_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-sheets');
