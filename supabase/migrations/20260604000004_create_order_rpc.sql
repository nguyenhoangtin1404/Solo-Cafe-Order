-- supabase/migrations/20260604000004_create_order_rpc.sql
-- Atomic order creation: generate_order_code + orders INSERT + order_items INSERT
-- run in a single transaction so a failed items insert never leaves an orphan order row.
-- p_total_amount / unit_price are NOT validated here — order.service (API layer) must
-- recompute prices from DB and match total before calling this RPC.

CREATE OR REPLACE FUNCTION create_order(
  p_pickup_name    varchar,
  p_note           text,
  p_payment_method varchar,
  p_total_amount   int,
  p_items          jsonb   -- [{product_id, product_name, quantity, unit_price, selected_options, note}]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'create_order: p_items must contain at least one item';
  END IF;

  INSERT INTO orders (order_code, total_amount, payment_method, pickup_name, note)
  VALUES (generate_order_code(), p_total_amount, p_payment_method, p_pickup_name, p_note)
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (
    order_id, product_id, product_name,
    quantity, unit_price, selected_options, note
  )
  SELECT
    v_order_id,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name',
    (item ->> 'quantity')::int,
    (item ->> 'unit_price')::int,
    COALESCE(item -> 'selected_options', '[]'::jsonb),
    NULLIF(item ->> 'note', '')
  FROM jsonb_array_elements(p_items) AS item;

  RETURN v_order_id;
END;
$$;

-- Only service_role (API routes) may call this function
REVOKE EXECUTE ON FUNCTION create_order FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION create_order TO service_role;
