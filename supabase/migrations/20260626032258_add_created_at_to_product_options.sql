-- Re-apply: ensure created_at exists on product_options (idempotent)
ALTER TABLE product_options
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
