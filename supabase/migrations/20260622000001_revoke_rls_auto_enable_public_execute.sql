-- Revoke EXECUTE on SECURITY DEFINER function from all roles.
-- PostgreSQL grants EXECUTE to PUBLIC by default, so revoking only from
-- anon/authenticated leaves those roles with the privilege via PUBLIC.
-- Revoking from PUBLIC removes it for all roles.
-- Supabase linter warnings:
--   anon_security_definer_function_executable (lint 0028)
--   authenticated_security_definer_function_executable (lint 0029)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable' AND p.pronargs = 0
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;
