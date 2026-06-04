-- supabase/migrations/20260604000002_realtime_publication.sql
-- Description: Add orders table to Supabase Realtime publication.
-- Required for dashboard (useOrderQueue) and tracking page (useOrderTracking) to receive
-- INSERT/UPDATE events without polling.
-- Verify in Supabase Dashboard: Database > Replication > supabase_realtime publication.

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
