-- supabase/seed.sql
-- Idempotent: INSERT ... ON CONFLICT DO NOTHING — safe to run multiple times.
-- Fixed UUID v7 values (hardcoded) to keep references stable across environments.

-- ─── Categories ──────────────────────────────────────────────────────────────
INSERT INTO categories (id, name, sort_order) VALUES
  ('01910000-0000-7001-8000-000000000001', 'Cà phê',        1),
  ('01910000-0000-7001-8000-000000000002', 'Trà',           2),
  ('01910000-0000-7001-8000-000000000003', 'Đồ ăn vặt',     3),
  ('01910000-0000-7001-8000-000000000004', 'Nước trái cây', 4)
ON CONFLICT (id) DO NOTHING;

-- ─── Products ─────────────────────────────────────────────────────────────────
INSERT INTO products (id, category_id, name, description, price, is_available) VALUES
  -- Cà phê
  ('01910000-0000-7002-8000-000000000001', '01910000-0000-7001-8000-000000000001',
   'Cà phê sữa đá', 'Cà phê phin truyền thống pha với sữa đặc và đá viên', 35000, true),
  ('01910000-0000-7002-8000-000000000002', '01910000-0000-7001-8000-000000000001',
   'Bạc xỉu', 'Sữa nhiều hơn, cà phê nhẹ — hoàn hảo cho buổi sáng thư giãn', 35000, true),
  ('01910000-0000-7002-8000-000000000003', '01910000-0000-7001-8000-000000000001',
   'Cà phê đen đá', 'Cà phê phin đậm đặc nguyên chất, không đường', 25000, true),
  ('01910000-0000-7002-8000-000000000004', '01910000-0000-7001-8000-000000000001',
   'Cappuccino', 'Espresso với foam sữa mịn theo phong cách Ý', 45000, true),
  -- Trà
  ('01910000-0000-7002-8000-000000000005', '01910000-0000-7001-8000-000000000002',
   'Trà đào', 'Trà xanh lạnh pha với đào tươi và đường rock', 45000, true),
  ('01910000-0000-7002-8000-000000000006', '01910000-0000-7001-8000-000000000002',
   'Trà sữa trân châu', 'Trà sữa Đài Loan classic với trân châu đen dai mềm', 50000, true),
  -- is_available = false — ẩn khỏi menu khách
  ('01910000-0000-7002-8000-000000000007', '01910000-0000-7001-8000-000000000002',
   'Trà xanh matcha', 'Matcha Uji Nhật Bản nguyên chất — tạm hết', 50000, false),
  -- Đồ ăn vặt
  ('01910000-0000-7002-8000-000000000008', '01910000-0000-7001-8000-000000000003',
   'Bánh mì nướng bơ', 'Bánh mì sandwich nướng giòn với bơ Anchor', 25000, true),
  ('01910000-0000-7002-8000-000000000009', '01910000-0000-7001-8000-000000000003',
   'Khoai tây chiên', 'Khoai tây chiên giòn vàng, ăn kèm tương cà', 30000, true),
  -- Nước trái cây
  ('01910000-0000-7002-8000-00000000000a', '01910000-0000-7001-8000-000000000004',
   'Cam vắt tươi', 'Cam ép tươi nguyên chất, không đường', 40000, true),
  ('01910000-0000-7002-8000-00000000000b', '01910000-0000-7001-8000-000000000004',
   'Sinh tố bơ', 'Bơ Đắk Lắk xay với sữa tươi và đường', 55000, true)
ON CONFLICT (id) DO NOTHING;

-- ─── Product options ──────────────────────────────────────────────────────────
INSERT INTO product_options (id, product_id, name, type) VALUES
  -- Cà phê sữa đá: chọn size
  ('01910000-0000-7003-8000-000000000001', '01910000-0000-7002-8000-000000000001', 'Size', 'select'),
  -- Trà sữa trân châu: chọn size + thêm topping
  ('01910000-0000-7003-8000-000000000002', '01910000-0000-7002-8000-000000000006', 'Size', 'select'),
  ('01910000-0000-7003-8000-000000000003', '01910000-0000-7002-8000-000000000006', 'Topping', 'multi')
ON CONFLICT (id) DO NOTHING;

-- ─── Product option values ────────────────────────────────────────────────────
INSERT INTO product_option_values (id, option_id, name, extra_price) VALUES
  -- Size cho Cà phê sữa đá
  ('01910000-0000-7004-8000-000000000001', '01910000-0000-7003-8000-000000000001', 'S',  0),
  ('01910000-0000-7004-8000-000000000002', '01910000-0000-7003-8000-000000000001', 'M',  5000),
  ('01910000-0000-7004-8000-000000000003', '01910000-0000-7003-8000-000000000001', 'L',  10000),
  -- Size cho Trà sữa trân châu
  ('01910000-0000-7004-8000-000000000004', '01910000-0000-7003-8000-000000000002', 'S',  0),
  ('01910000-0000-7004-8000-000000000005', '01910000-0000-7003-8000-000000000002', 'M',  5000),
  ('01910000-0000-7004-8000-000000000006', '01910000-0000-7003-8000-000000000002', 'L',  10000),
  -- Topping cho Trà sữa trân châu
  ('01910000-0000-7004-8000-000000000007', '01910000-0000-7003-8000-000000000003', 'Trân châu đen',  0),
  ('01910000-0000-7004-8000-000000000008', '01910000-0000-7003-8000-000000000003', 'Thạch cà phê',   5000),
  ('01910000-0000-7004-8000-000000000009', '01910000-0000-7003-8000-000000000003', 'Pudding trứng',  5000)
ON CONFLICT (id) DO NOTHING;

-- ─── Demo order (bank_transfer — để test success screen bank block) ───────────
-- created_at đặt ngày hôm qua để không ảnh hưởng order_code của hôm nay
INSERT INTO orders (id, order_code, status, total_amount, payment_method, pickup_name, created_at, updated_at)
VALUES (
  '01910000-0000-7005-8000-000000000001',
  'A001',
  'done',
  80000,
  'bank_transfer',
  'Mon',
  '2026-06-03 08:00:00+07',
  '2026-06-03 09:30:00+07'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, selected_options)
VALUES (
  '01910000-0000-7005-8000-000000000002',
  '01910000-0000-7005-8000-000000000001',
  '01910000-0000-7002-8000-000000000001',
  'Cà phê sữa đá',
  2,
  40000,
  '[{"option_name": "Size", "value_name": "M", "extra_price": 5000}]'::jsonb
) ON CONFLICT (id) DO NOTHING;
