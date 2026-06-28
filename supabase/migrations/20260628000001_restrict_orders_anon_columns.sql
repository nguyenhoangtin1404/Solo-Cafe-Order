-- Restrict anon REST API access to non-PII columns only.
-- Previously GRANT SELECT ON orders TO anon exposed all columns including
-- pickup_name, note, total_amount — readable by anyone with the public anon key.
-- Column-level grants protect the PostgREST REST API; Realtime WAL payload
-- is controlled separately via the publication definition.
REVOKE SELECT ON orders FROM anon;
GRANT SELECT (id, order_code, status, cancelled_by, updated_at, created_at) ON orders TO anon;
