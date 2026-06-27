-- Grant EXECUTE back to service_role after revoking from PUBLIC.
-- REVOKE FROM PUBLIC removes privilege for all roles including service_role
-- (which is not a PostgreSQL superuser on Supabase Cloud). The service layer
-- calls these RPCs via createAdminSupabaseClient() which uses service_role.
GRANT EXECUTE ON FUNCTION public.get_revenue_by_hour(timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_by_day(timestamptz, timestamptz) TO service_role;
