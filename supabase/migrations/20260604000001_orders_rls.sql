-- supabase/migrations/20260604000001_orders_rls.sql
-- Description: RLS policies and table grants for orders + order_items.
-- API routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS completely).
-- These policies protect: (1) anon browser client, (2) Supabase Realtime subscriptions.
--
-- INSERT on orders/order_items always goes through service_role API routes — no anon INSERT
-- policy is needed and no GRANT INSERT is given to anon, which removes an unnecessary attack
-- surface (direct Supabase REST calls with the anon key cannot inject fake orders).

-- orders: anon SELECT needed for:
--   • tracking page realtime subscription (useOrderTracking via Supabase Realtime)
--   • Phase 1 tradeoff: USING (true) exposes all orders to anon key holders;
--     direct data access via GET /api/orders/[code] (service_role) is the intended path.
CREATE POLICY "anon_read_orders" ON orders
  FOR SELECT TO anon
  USING (true);

-- authenticated (owner) SELECT — required for Supabase Realtime RLS check on the dashboard.
-- The browser client subscribes to the orders table as `authenticated`; without this policy
-- the Realtime engine drops events before they reach useOrderQueue.
CREATE POLICY "owner_read_orders" ON orders
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- order_items: owner dashboard SELECT (GET /api/orders uses service_role, but this covers
-- any future direct client queries from the owner dashboard)
CREATE POLICY "owner_read_order_items" ON order_items
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Table grants
-- No UPDATE grant to authenticated: status changes go through PATCH /api/orders/[id]/status
-- which uses service_role (bypasses RLS). Direct client UPDATE intentionally blocked to
-- prevent bypassing INVALID_STATUS_TRANSITION validation in the service layer.
GRANT SELECT ON orders      TO anon;
GRANT SELECT ON orders      TO authenticated;
GRANT SELECT ON order_items TO authenticated;
