-- Fix get_best_selling_products: cast quantity to bigint before multiplication
-- to prevent integer overflow on large quantity * unit_price products.

CREATE OR REPLACE FUNCTION get_best_selling_products(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (
  product_name text,
  quantity     bigint,
  revenue      bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    oi.product_name,
    SUM(oi.quantity)::bigint                              AS quantity,
    SUM(oi.quantity::bigint * oi.unit_price)::bigint      AS revenue
  FROM   public.order_items oi
  JOIN   public.orders      o  ON o.id = oi.order_id
  WHERE  o.status      = 'done'
    AND  o.created_at >= p_from
    AND  o.created_at <  p_to
  GROUP BY oi.product_name
  ORDER BY quantity DESC
  LIMIT 10;
$$;

REVOKE EXECUTE ON FUNCTION get_best_selling_products(timestamptz, timestamptz) FROM public;
GRANT  EXECUTE ON FUNCTION get_best_selling_products(timestamptz, timestamptz) TO service_role;
