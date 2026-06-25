-- supabase/migrations/20260603000001_create_products_and_categories.sql

-- Description: Create categories, products, product_options, product_option_values tables
-- with UUID v4 PKs, soft delete, FK constraints (ON DELETE RESTRICT), indexes, and RLS policies

-- categories
CREATE TABLE categories (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        varchar     NOT NULL,
  sort_order  int         NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  deleted_at  timestamptz
);

-- products
CREATE TABLE products (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id  uuid        NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name         varchar     NOT NULL,
  description  text,
  price        int         NOT NULL CHECK (price > 0),
  image_url    varchar,
  is_available boolean     NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now() NOT NULL,
  deleted_at   timestamptz
);

-- product_options
CREATE TABLE product_options (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  name        varchar     NOT NULL,
  type        varchar     NOT NULL CHECK (type IN ('select', 'multi')),
  deleted_at  timestamptz
);

-- product_option_values
CREATE TABLE product_option_values (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id    uuid        NOT NULL REFERENCES product_options(id) ON DELETE RESTRICT,
  name         varchar     NOT NULL,
  extra_price  int         NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  deleted_at   timestamptz
);

-- Partial indexes: optimize anon read path (is_available + deleted_at filter)
-- Plain FK indexes are omitted — partial indexes below cover the primary read pattern;
-- owner/admin queries are low-volume and served by seq scan or PK lookup.
CREATE INDEX idx_products_category_active ON products(category_id)
  WHERE is_available = true AND deleted_at IS NULL;

-- Support EXISTS subquery in anon_read_product_option_values RLS policy
CREATE INDEX idx_products_id_available_active ON products(id)
  WHERE is_available = true AND deleted_at IS NULL;

CREATE INDEX idx_product_options_product_active ON product_options(product_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_product_option_values_option_active ON product_option_values(option_id)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;

-- Policies: categories
CREATE POLICY "anon_read_categories" ON categories
  FOR SELECT TO anon
  USING (deleted_at IS NULL);

-- app_metadata.role = 'admin' must be set on the owner Supabase Auth account
-- (matches middleware.ts which checks user.app_metadata?.role === 'admin')
-- All mutations go via service_role API routes — authenticated role only needs SELECT.
CREATE POLICY "owner_read_categories" ON categories
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Policies: products
-- anon chỉ thấy sản phẩm available và chưa bị xóa
CREATE POLICY "anon_read_products" ON products
  FOR SELECT TO anon
  USING (is_available = true AND deleted_at IS NULL);

CREATE POLICY "owner_read_products" ON products
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Policies: product_options
-- anon chỉ thấy options của sản phẩm available và chưa bị xóa
CREATE POLICY "anon_read_product_options" ON product_options
  FOR SELECT TO anon
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_options.product_id
        AND p.is_available = true
        AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "owner_read_product_options" ON product_options
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Policies: product_option_values
-- anon chỉ thấy values của options thuộc sản phẩm available và chưa bị xóa
CREATE POLICY "anon_read_product_option_values" ON product_option_values
  FOR SELECT TO anon
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM product_options po
      JOIN products p ON p.id = po.product_id
      WHERE po.id = product_option_values.option_id
        AND po.deleted_at IS NULL
        AND p.is_available = true
        AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "owner_read_product_option_values" ON product_option_values
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Table privileges: PostgREST checks these before evaluating RLS policies.
-- anon needs SELECT to read menu; authenticated (owner) needs SELECT to read via client.
-- INSERT/UPDATE/DELETE are handled exclusively via service_role API routes.
GRANT SELECT ON categories            TO anon, authenticated;
GRANT SELECT ON products              TO anon, authenticated;
GRANT SELECT ON product_options       TO anon, authenticated;
GRANT SELECT ON product_option_values TO anon, authenticated;
