-- Add per-product Meta Pixel ID for ad tracking
ALTER TABLE products
ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;

