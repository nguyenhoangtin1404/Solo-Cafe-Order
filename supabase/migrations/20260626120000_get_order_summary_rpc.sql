-- Description: get_order_summary RPC — DB-side aggregation for reports KPI cards (#160)
-- Avoids fetching all order rows into Node.js; returns 3 aggregated integers.

CREATE OR REPLACE FUNCTION get_order_summary(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (
  revenue     bigint,
  order_count bigint,
  items_sold  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH done_orders AS (
    SELECT id, total_amount
    FROM   orders
    WHERE  status      = 'done'
      AND  created_at >= p_from
      AND  created_at <  p_to
  )
  SELECT
    COALESCE(SUM(ord.total_amount), 0)::bigint AS revenue,
    COUNT(ord.id)::bigint                      AS order_count,
    COALESCE((
      SELECT SUM(oi.quantity)
      FROM   order_items oi
      WHERE  oi.order_id IN (SELECT id FROM done_orders)
    ), 0)::bigint                              AS items_sold
  FROM done_orders ord;
$$;
