-- Description: Thêm DB index cho aggregation queries của Reports dashboard

-- Aggregation queries lọc theo status + date range
CREATE INDEX idx_orders_report
ON orders(status, created_at DESC);

-- Hỗ trợ GROUP BY payment_method trong date range
CREATE INDEX idx_orders_payment_created
ON orders(payment_method, created_at DESC);
