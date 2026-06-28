-- Restrict Realtime WAL payload to non-PII columns for the orders table.
-- Previously the supabase_realtime publication sent the full row on every
-- INSERT/UPDATE, so any anon Realtime subscriber received pickup_name, note,
-- total_amount, and payment_method.
--
-- Owner dashboard (useOrderQueue) adapts: UPDATE events use spread-merge so
-- existing full-row data is preserved; INSERT events trigger an API fetch for
-- the full order instead of relying on the payload.
ALTER PUBLICATION supabase_realtime DROP TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE orders (id, order_code, status, cancelled_by, updated_at, created_at);
