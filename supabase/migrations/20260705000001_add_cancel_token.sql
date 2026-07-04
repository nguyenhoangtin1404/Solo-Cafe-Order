-- supabase/migrations/20260705000001_add_cancel_token.sql
-- Issue #178: add cancel_token to orders for brute-force protection on cancel endpoint.
-- cancel_token is a random UUID generated at insert time, returned to the customer only
-- at order submission. The cancel endpoint requires both order_code AND cancel_token so
-- an attacker cannot cancel arbitrary orders just by guessing sequential order codes.

ALTER TABLE orders
  ADD COLUMN cancel_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Replace the create_order RPC so it returns the cancel_token alongside the order id.
-- Returns JSONB: { "id": "<uuid>", "cancel_token": "<uuid>" }
CREATE OR REPLACE FUNCTION create_order(
  p_pickup_name    varchar,
  p_note           text,
  p_payment_method varchar,
  p_total_amount   int,
  p_items          jsonb   -- [{product_id, product_name, quantity, unit_price, selected_options, note}]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order_id     uuid;
  v_cancel_token uuid;
BEGIN
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'create_order: p_items must contain at least one item';
  END IF;

  INSERT INTO orders (order_code, total_amount, payment_method, pickup_name, note)
  VALUES (generate_order_code(), p_total_amount, p_payment_method, p_pickup_name, p_note)
  RETURNING id, cancel_token INTO v_order_id, v_cancel_token;

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

  RETURN jsonb_build_object(
    'id',           v_order_id,
    'cancel_token', v_cancel_token
  );
END;
$$;

-- Restore grants (SECURITY DEFINER but still restrict callers)
REVOKE EXECUTE ON FUNCTION create_order FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION create_order TO service_role;
