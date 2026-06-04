-- supabase/migrations/20260604000003_storage_product_images.sql
-- Issue #21

-- Description: Create product-images storage bucket with public read and
-- admin-only upload/delete policies. File size capped at 2 MB; MIME types
-- restricted to JPEG, PNG, WebP.

-- ─── Bucket ──────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  2097152,                                          -- 2 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── Policies on storage.objects ─────────────────────────────────────────────
-- DROP IF EXISTS before each CREATE to keep migration idempotent (safe to re-run)

-- Public read: any unauthenticated visitor can load product images (menu page)
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'product-images');

-- Admin read: owner needs SELECT to preview images and for storage.update() pre-check
DROP POLICY IF EXISTS "owner_read_product_images" ON storage.objects;
CREATE POLICY "owner_read_product_images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Owner upload: only admin-role authenticated users
DROP POLICY IF EXISTS "owner_insert_product_images" ON storage.objects;
CREATE POLICY "owner_insert_product_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Owner update (replace image in-place)
DROP POLICY IF EXISTS "owner_update_product_images" ON storage.objects;
CREATE POLICY "owner_update_product_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Owner delete
DROP POLICY IF EXISTS "owner_delete_product_images" ON storage.objects;
CREATE POLICY "owner_delete_product_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
