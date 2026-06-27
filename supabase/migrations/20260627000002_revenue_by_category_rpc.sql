-- Description: get_revenue_by_category RPC — revenue breakdown by product category (#165)
-- JOINs order_items → products (soft-ref) → categories to get category name.
-- Accepts risk: category reflects current assignment, not category at time of sale.

CREATE OR REPLACE FUNCTION get_revenue_by_category(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (
  category_name text,
  revenue       bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    c.name                                                  AS category_name,
    SUM(oi.quantity::bigint * oi.unit_price)::bigint        AS revenue
  FROM   public.order_items oi
  JOIN   public.orders      o  ON o.id         = oi.order_id
  JOIN   public.products    p  ON p.id         = oi.product_id
                               AND p.deleted_at IS NULL
  JOIN   public.categories  c  ON c.id         = p.category_id
                               AND c.deleted_at IS NULL
  WHERE  o.status      = 'done'
    AND  o.created_at >= p_from
    AND  o.created_at <  p_to
  GROUP BY c.name
  ORDER BY revenue DESC;
$$;

REVOKE EXECUTE ON FUNCTION get_revenue_by_category(timestamptz, timestamptz) FROM public;
GRANT  EXECUTE ON FUNCTION get_revenue_by_category(timestamptz, timestamptz) TO service_role;
