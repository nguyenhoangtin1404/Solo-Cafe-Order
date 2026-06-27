-- Revoke public EXECUTE on get_order_summary — was missing in original migration (#160)
-- Matches security pattern used by other report RPCs (get_revenue_by_hour, get_best_selling_products, etc.)

REVOKE EXECUTE ON FUNCTION public.get_order_summary(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_summary(timestamptz, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_order_summary(timestamptz, timestamptz) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_order_summary(timestamptz, timestamptz) TO service_role;
