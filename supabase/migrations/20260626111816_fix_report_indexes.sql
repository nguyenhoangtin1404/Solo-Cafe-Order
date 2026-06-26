-- Description: Fix report indexes — correct column order, add covering columns, add order_items index
-- Replaces idx_orders_report and idx_orders_payment_created with optimized versions

-- Drop old indexes
DROP INDEX IF EXISTS idx_orders_report;
DROP INDEX IF EXISTS idx_orders_payment_created;

-- created_at leads so date-range filter hits index boundary first
-- INCLUDE (total_amount) enables index-only scan for SUM(total_amount)
CREATE INDEX idx_orders_created_status
  ON orders(created_at, status) INCLUDE (total_amount);

CREATE INDEX idx_orders_created_payment
  ON orders(created_at, payment_method) INCLUDE (total_amount);

-- order_items needs this for best-sellers subquery (order_id IN (...))
CREATE INDEX idx_order_items_order_id
  ON order_items(order_id);
