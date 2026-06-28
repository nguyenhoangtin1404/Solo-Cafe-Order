-- Remove order_code from the anon REST grant.
-- Migration 000001 granted (id, order_code, status, cancelled_by, updated_at, created_at)
-- to anon. With RLS USING (true), anyone holding the public anon key could query
-- orders?select=order_code to enumerate every order code, then call the public
-- GET /api/orders/[code] endpoint to retrieve pickup_name, note, totals, and items.
-- No client-side code uses PostgREST to read order_code directly; the tracking page
-- looks up orders via the Next.js API route (server-side service role key) and the
-- Realtime subscription filters by UUID, not order_code.
REVOKE SELECT ON orders FROM anon;
GRANT SELECT (id, status, cancelled_by, updated_at, created_at) ON orders TO anon;
