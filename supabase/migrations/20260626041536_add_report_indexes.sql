-- Add optimized report indexes for Reports dashboard (#158)

-- created_at leads so date-range filter hits index boundary first
-- INCLUDE (total_amount) enables index-only scan for SUM(total_amount)
CREATE INDEX idx_orders_created_status
  ON orders(created_at, status) INCLUDE (total_amount);

CREATE INDEX idx_orders_created_payment
  ON orders(created_at, payment_method) INCLUDE (total_amount);
