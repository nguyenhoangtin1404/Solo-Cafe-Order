-- Add created_at to product_options for deterministic ordering
ALTER TABLE product_options
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
