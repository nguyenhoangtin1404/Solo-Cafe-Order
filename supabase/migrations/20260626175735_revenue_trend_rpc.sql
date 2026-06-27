-- Revenue trend RPCs — DB-side aggregation by hour and by day (#161)

CREATE OR REPLACE FUNCTION get_revenue_by_hour(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (hour int, revenue bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int,
    SUM(total_amount)::bigint
  FROM public.orders
  WHERE status      = 'done'
    AND created_at >= p_from
    AND created_at <  p_to
  GROUP BY 1
  ORDER BY 1
$$;

CREATE OR REPLACE FUNCTION get_revenue_by_day(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (day text, revenue bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    TO_CHAR((created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD'),
    SUM(total_amount)::bigint
  FROM public.orders
  WHERE status      = 'done'
    AND created_at >= p_from
    AND created_at <  p_to
  GROUP BY 1
  ORDER BY 1
$$;
