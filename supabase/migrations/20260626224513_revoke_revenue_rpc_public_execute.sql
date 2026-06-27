-- Revoke PUBLIC EXECUTE on revenue trend RPCs (SECURITY DEFINER).
-- Without this, any caller with the anon key can call these functions
-- directly via /rpc/get_revenue_by_hour and /rpc/get_revenue_by_day,
-- bypassing the owner-only /api/reports/revenue route guard.
REVOKE EXECUTE ON FUNCTION public.get_revenue_by_hour(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_revenue_by_day(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
