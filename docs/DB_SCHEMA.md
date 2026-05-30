# Database Schema

> All tables live in Supabase (PostgreSQL). RLS enabled on all tables.

---

## categories

| Column | Type | Note |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| name | varchar | not null |
| sort_order | int | for display ordering |
| created_at | timestamp | default now() |

---

## products

| Column | Type | Note |
|---|---|---|
| id | uuid | PK |
| category_id | uuid | FK → categories.id |
| name | varchar | not null |
| description | text | |
| price | int | VND, NOT NULL, > 0, không dùng float |
| image_url | varchar | Supabase Storage URL |
| is_available | boolean | DEFAULT true |
| created_at | timestamp | default now() |

---

## product_options

| Column | Type | Note |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK → products.id |
| name | varchar | e.g. "Size", "Topping" |
| type | varchar | 'select' hoặc 'multi' |

---

## product_option_values

| Column | Type | Note |
|---|---|---|
| id | uuid | PK |
| option_id | uuid | FK → product_options.id |
| name | varchar | e.g. "M", "L", "XL" |
| extra_price | int | DEFAULT 0, VND |

---

## orders

| Column | Type | Note |
|---|---|---|
| id | uuid | PK |
| order_code | varchar | UNIQUE, sinh bởi DB function, reset hàng ngày |
| status | varchar | new \| making \| done \| cancelled |
| total_amount | int | VND, snapshot tại lúc submit, không tính lại |
| pickup_name | varchar | nullable — tên khách lấy đồ (owner gọi tên này) |
| note | text | ghi chú toàn đơn |
| customer_ref | varchar | nullable — dành cho Phase 3 (phone / QR token) |
| created_at | timestamp | default now() |

### order_code Generation

`order_code` **không được sinh trong application code** — phải dùng DB function để tránh race condition.

```sql
-- Format: A001 → A999 → B001 → ... (reset theo ngày)
-- Gọi: SELECT generate_order_code() trong transaction tạo order
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS varchar AS $$
DECLARE
  last_code    varchar;
  last_letter  text;
  last_num     int;
  new_num      int;
  new_letter   text;
BEGIN
  SELECT order_code INTO last_code
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF last_code IS NULL THEN
    RETURN 'A001';
  END IF;

  last_letter := LEFT(last_code, 1);
  last_num    := RIGHT(last_code, 3)::int;

  IF last_num < 999 THEN
    new_num    := last_num + 1;
    new_letter := last_letter;
  ELSE
    new_num    := 1;
    new_letter := CHR(ASCII(last_letter) + 1); -- A→B, B→C...
  END IF;

  RETURN new_letter || LPAD(new_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

> ⚠️ Gọi function này **bên trong transaction** khi tạo order để đảm bảo atomicity.

### Status Flow

```
new → making → done
new → cancelled
```

- Chỉ cancel được khi status = `new`
- Không đổi status ngược (done → making là invalid)
- Không sửa giá sau khi đã submit

---

## order_items

| Column | Type | Note |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → orders.id |
| product_id | uuid | FK → products.id (soft ref) |
| product_name | varchar | snapshot tên tại lúc order |
| quantity | int | NOT NULL, > 0 |
| unit_price | int | snapshot giá tại lúc order (bao gồm extra_price của options) |
| selected_options | jsonb | snapshot options được chọn — xem format bên dưới |
| note | text | ghi chú từng món |

### selected_options Format

```json
[
  { "option_name": "Size", "value_name": "L", "extra_price": 5000 },
  { "option_name": "Topping", "value_name": "Trân Châu", "extra_price": 8000 }
]
```

- Snapshot tại lúc order — bất biến dù option sau bị đổi tên/xóa
- `extra_price` lưu để đối chiếu, không tính lại
- Empty array `[]` nếu không chọn option nào

> `product_name`, `unit_price`, `selected_options` là snapshot hoàn toàn bất biến.

---

## Constraints & Indexes

```sql
UNIQUE (orders.order_code)
CHECK  (products.price > 0)
CHECK  (order_items.quantity > 0)
INDEX  (orders.status)
INDEX  (orders.created_at)
INDEX  (products.category_id)
INDEX  (products.is_available)
```

---

## RLS Policies

### Nguyên tắc

- **Client-side** (browser gọi Supabase trực tiếp): bị RLS giới hạn
- **Server-side** (Next.js API Routes dùng `service_role_key`): bypass RLS hoàn toàn

> Tất cả data access trong project này đi qua API Routes server-side. RLS là lớp bảo vệ phòng khi có misconfiguration, không phải primary auth logic.

### Policies (cho client-side safety)

| Table | anon | authenticated (owner) |
|---|---|---|
| categories | SELECT | ALL |
| products | SELECT (is_available=true) | ALL |
| product_options | SELECT | ALL |
| product_option_values | SELECT | ALL |
| orders | INSERT | ALL |
| order_items | INSERT | ALL |

### API Routes dùng service_role cho

- `GET /api/orders/:code` — đọc order theo order_code (public tracking)
- `POST /api/orders/:code/cancel` — update status (public cancel)
- `GET /api/orders` — đọc tất cả orders hôm nay (protected, owner)
- `PATCH /api/orders/:id/status` — update status (protected, owner)

---

## Image Upload Rules

- Format: JPG, PNG, WebP
- Max size: 2MB per image
- Resize server-side nếu > 1200px
- Path: `product-images/{product_id}/{timestamp}.webp`

---

## Migration Rules

- Không xóa cột đang có data — migration only
- AI không được tự thay đổi schema mà không có spec
- Giá tiền luôn là `int` (VND), không dùng `decimal`/`float`
- Thêm column mới phải có DEFAULT hoặc nullable
- Mỗi migration là 1 file riêng trong `supabase/migrations/`
