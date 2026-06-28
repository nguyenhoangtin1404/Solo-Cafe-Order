-- Remove order_code from the Realtime WAL publication for orders.
-- With order_code in the payload, any anon Realtime subscriber can enumerate
-- all order codes from INSERT events and then call the public API to harvest PII.
-- Removing it prevents bulk enumeration while keeping the columns needed for
-- status tracking (id, status, cancelled_by) and stale-event detection (updated_at).
--
-- The owner dashboard (useOrderQueue) adapts: INSERT/UPDATE events now carry `id`
-- instead of `order_code`; the hook fetches full order via the auth-gated
-- GET /api/dashboard/orders/[id] endpoint using the UUID.
--
-- Customer tracking (useOrderTracking) is unaffected: it subscribes with an
-- `id=eq.{uuid}` filter (orderId is always available from the SSR-fetched initialOrder),
-- and uses spread-merge on UPDATE events — order_code is never read from the payload.
ALTER PUBLICATION supabase_realtime DROP TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE orders (id, status, cancelled_by, updated_at, created_at);
