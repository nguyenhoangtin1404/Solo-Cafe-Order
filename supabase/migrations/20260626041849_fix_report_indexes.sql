-- Add dashboard queue index and order_items lookup index (#158)

-- Partial index for active orders (new/making) — powers realtime dashboard queue
CREATE INDEX idx_orders_status_created
  ON orders(created_at DESC)
  WHERE status IN ('new', 'making');

-- order_id lookup for order_items joins
CREATE INDEX idx_order_items_order_id
  ON order_items(order_id);
