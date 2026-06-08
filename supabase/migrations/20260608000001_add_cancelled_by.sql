-- supabase/migrations/20260608000001_add_cancelled_by.sql
-- Description: Add cancelled_by to orders for audit trail.
--   Distinguishes customer-initiated from owner-initiated cancellations.
--   NULL on non-cancelled orders; populated atomically during the status update.

ALTER TABLE orders
  ADD COLUMN cancelled_by varchar
  CHECK (cancelled_by IN ('customer', 'owner'));
