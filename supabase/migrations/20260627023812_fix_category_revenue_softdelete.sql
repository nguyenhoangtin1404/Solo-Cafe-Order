-- Fix get_revenue_by_category: include revenue from soft-deleted products/categories.
-- Previous INNER JOIN with deleted_at IS NULL silently dropped order_items whose
-- product or category was soft-deleted after the sale, causing the pie chart total
-- to diverge from the KPI summary (which uses orders.total_amount snapshot).
-- Fix: LEFT JOIN without deleted_at filter; bucket unresolvable items as '(Đã xóa)'.

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
    COALESCE(c.name, '(Đã xóa)')                           AS category_name,
    SUM(oi.quantity::bigint * oi.unit_price)::bigint        AS revenue
  FROM   public.order_items oi
  JOIN   public.orders      o  ON o.id         = oi.order_id
  LEFT JOIN public.products p  ON p.id         = oi.product_id
  LEFT JOIN public.categories c ON c.id        = p.category_id
  WHERE  o.status      = 'done'
    AND  o.created_at >= p_from
    AND  o.created_at <  p_to
  GROUP BY c.id, c.name
  ORDER BY revenue DESC;
$$;

REVOKE EXECUTE ON FUNCTION get_revenue_by_category(timestamptz, timestamptz) FROM public;
GRANT  EXECUTE ON FUNCTION get_revenue_by_category(timestamptz, timestamptz) TO service_role;
