-- Fix get_revenue_by_category RPC (#165 code-review):
-- 1. GROUP BY c.id, c.name instead of c.name alone — prevents merging distinct
--    categories that share the same display name (no UNIQUE constraint on name).
-- 2. Document soft-delete risk: order_items whose product or category is
--    soft-deleted after the sale are excluded from this aggregation (no snapshot
--    of category_name exists on order_items). This means the category pie chart
--    may undercount vs the KPI total (which uses orders.total_amount snapshot).
--    Accepted tradeoff — same as the category-reassignment risk noted in migration 000002.

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
  GROUP BY c.id, c.name
  ORDER BY revenue DESC;
$$;

REVOKE EXECUTE ON FUNCTION get_revenue_by_category(timestamptz, timestamptz) FROM public;
GRANT  EXECUTE ON FUNCTION get_revenue_by_category(timestamptz, timestamptz) TO service_role;
