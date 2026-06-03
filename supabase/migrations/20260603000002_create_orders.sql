-- supabase/migrations/20260603000002_create_orders.sql
-- Description: Create orders, order_items tables; generate_order_code() function;
--              set_updated_at trigger; order_code_seq helper table.

-- order_code_seq: per-day atomic counter backing generate_order_code()
-- Isolated from orders so the counter row-lock does not block order INSERTs.
-- RLS enabled with no policies → only postgres/service_role can access directly;
-- generate_order_code() uses SECURITY DEFINER so it bypasses RLS regardless of caller.
CREATE TABLE order_code_seq (
  date     date NOT NULL PRIMARY KEY,
  counter  int  NOT NULL
);

-- orders (no deleted_at — cancel = status 'cancelled')
CREATE TABLE orders (
  id              uuid        DEFAULT extensions.uuid_generate_v7() PRIMARY KEY,
  order_code      varchar     NOT NULL,
  status          varchar     NOT NULL DEFAULT 'new'
                              CHECK (status IN ('new', 'making', 'done', 'cancelled')),
  total_amount    int         NOT NULL CHECK (total_amount > 0),
  payment_method  varchar     NOT NULL DEFAULT 'cash'
                              CHECK (payment_method IN ('cash', 'bank_transfer')),
  pickup_name     varchar,
  note            text,
  customer_ref    varchar,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE order_items (
  id                uuid    NOT NULL DEFAULT extensions.uuid_generate_v7() PRIMARY KEY,
  order_id          uuid    NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id        uuid,                                   -- soft ref: no FK (product may be soft-deleted)
  product_name      varchar NOT NULL,                       -- snapshot at submit time
  quantity          int     NOT NULL CHECK (quantity > 0),
  unit_price        int     NOT NULL CHECK (unit_price > 0),-- VND snapshot, never from client
  selected_options  jsonb   NOT NULL DEFAULT '[]'::jsonb,   -- [{option_name, value_name, extra_price}]
  note              text
);

-- Indexes
-- Dashboard primary query: active orders sorted by arrival time
CREATE INDEX idx_orders_status_created ON orders(created_at DESC)
  WHERE status IN ('new', 'making');

-- order_code is unique within a calendar day (HCM timezone) — codes reset to A001 each day.
-- Global UNIQUE on order_code alone would collide across days (day 2's A001 vs day 1's A001).
-- Tracking-page lookup queries by order_code; the API returns the most-recent match.
CREATE UNIQUE INDEX uq_orders_order_code_daily
  ON orders(order_code, ((created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date));

-- Items always fetched joined to their parent order
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- generate_order_code()
-- Format: A001–A999 → B001–B999 → … , resets to A001 at midnight Asia/Ho_Chi_Minh.
-- Atomicity: INSERT … ON CONFLICT DO UPDATE is a single atomic statement;
-- PostgreSQL acquires an exclusive row-lock on the conflict target before the UPDATE,
-- so concurrent calls are serialised without explicit advisory locks.
-- SECURITY DEFINER: runs as the function owner (postgres) so it can always INSERT into
-- order_code_seq regardless of the calling role (anon, authenticated, or service_role).
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS varchar
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_today        date;
  v_counter      int;
  v_letter_index int;
BEGIN
  v_today := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

  INSERT INTO order_code_seq (date, counter)
  VALUES (v_today, 1)
  ON CONFLICT (date)
  DO UPDATE SET counter = order_code_seq.counter + 1
  RETURNING counter INTO v_counter;

  -- Each letter covers 999 codes: A001–A999, B001–B999, … , Z001–Z999 (26×999 = 25974/day max).
  -- Hard limit: raise rather than emit a non-letter char (chr(91)='[') silently.
  v_letter_index := (v_counter - 1) / 999;
  IF v_letter_index > 25 THEN
    RAISE EXCEPTION 'generate_order_code: daily limit exceeded (counter=%)', v_counter;
  END IF;

  RETURN chr(65 + v_letter_index)
      || lpad(((v_counter - 1) % 999 + 1)::text, 3, '0');
END;
$$;

-- set_updated_at(): trigger function reused by any table that carries updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS enabled; policies and table grants are added in the RLS policies migration (GitHub issue #20).
ALTER TABLE order_code_seq ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;

-- Restrict generate_order_code() to service_role only.
-- By default PostgreSQL grants EXECUTE to PUBLIC; any anon caller could consume daily
-- order codes via RPC, exhausting the counter or causing unexpected increments.
REVOKE EXECUTE ON FUNCTION generate_order_code() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION generate_order_code() TO service_role;
