# Database Schema

> All tables live in Supabase (PostgreSQL). RLS enabled on all tables.

---

## Conventions

### UUID v7

Tất cả Primary Keys dùng **UUID v7** — time-ordered, tốt hơn UUID v4 cho index performance.

```sql
-- Enable extension (1 lần duy nhất trong migration đầu tiên)
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Dùng làm default cho tất cả PK
id uuid DEFAULT uuid_generate_v7() PRIMARY KEY
```

> UUID v7 encode timestamp vào prefix → rows insert theo thứ tự thời gian → B-tree index ít bị fragmentation hơn UUID v4 random.

### Soft Delete

**Tất cả delete đều là soft delete** — không bao giờ hard delete.

```sql
deleted_at timestamptz DEFAULT NULL
-- NULL   = record đang active
-- non-NULL = record đã bị xóa (timestamp lúc xóa)
```

**Query luôn filter:**

```sql
WHERE deleted_at IS NULL
```

**Khi "xóa":**

```sql
UPDATE <table> SET deleted_at = now() WHERE id = $1
```

---

## categories

| Column     | Type        | Note                           |
| ---------- | ----------- | ------------------------------ |
| id         | uuid        | PK, DEFAULT uuid_generate_v7() |
| name       | varchar     | not null                       |
| sort_order | int         | for display ordering           |
| created_at | timestamptz | DEFAULT now()                  |
| deleted_at | timestamptz | NULL = active, soft delete     |

---

## products

| Column       | Type        | Note                           |
| ------------ | ----------- | ------------------------------ |
| id           | uuid        | PK, DEFAULT uuid_generate_v7() |
| category_id  | uuid        | FK → categories.id             |
| name         | varchar     | not null                       |
| description  | text        |                                |
| price        | int         | VND, NOT NULL, > 0             |
| image_url    | varchar     | Supabase Storage URL           |
| is_available | boolean     | DEFAULT true                   |
| created_at   | timestamptz | DEFAULT now()                  |
| deleted_at   | timestamptz | NULL = active, soft delete     |

---

## product_options

| Column     | Type        | Note                           |
| ---------- | ----------- | ------------------------------ |
| id         | uuid        | PK, DEFAULT uuid_generate_v7() |
| product_id | uuid        | FK → products.id               |
| name       | varchar     | e.g. "Size", "Topping"         |
| type       | varchar     | CHECK: 'select' hoặc 'multi'   |
| deleted_at | timestamptz | NULL = active, soft delete     |

---

## product_option_values

| Column      | Type        | Note                           |
| ----------- | ----------- | ------------------------------ |
| id          | uuid        | PK, DEFAULT uuid_generate_v7() |
| option_id   | uuid        | FK → product_options.id        |
| name        | varchar     | e.g. "M", "L", "XL"            |
| extra_price | int         | DEFAULT 0, VND                 |
| deleted_at  | timestamptz | NULL = active, soft delete     |

---

## orders

| Column         | Type        | Note                                                   |
| -------------- | ----------- | ------------------------------------------------------ |
| id             | uuid        | PK, DEFAULT uuid_generate_v7()                         |
| order_code     | varchar     | UNIQUE, sinh bởi DB function, reset hàng ngày          |
| status         | varchar     | new \| making \| done \| cancelled                     |
| total_amount   | int         | VND, snapshot tại lúc submit                           |
| pickup_name    | varchar     | nullable                                               |
| note           | text        | ghi chú toàn đơn                                       |
| payment_method | varchar     | cash \| bank_transfer \| momo \| vnpay, DEFAULT 'cash' |
| customer_ref   | varchar     | nullable, Phase 3                                      |
| created_at     | timestamptz | DEFAULT now()                                          |
| updated_at     | timestamptz | DEFAULT now(), tự cập nhật khi có thay đổi             |

> `payment_status` (pending/paid/failed) chưa có ở Phase 1 — thêm migration ở Phase 2 khi tích hợp MoMo/VNPAY.

> Orders không có `deleted_at` — dùng `status = 'cancelled'` thay thế. Không xóa order.

### order_code Generation

```sql
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS varchar AS $$
DECLARE
  last_code    varchar;
  last_letter  text;
  last_num     int;
  new_num      int;
  new_letter   text;
  vn_today     date;
BEGIN
  -- Dùng timezone nhất quán cho cả filter lẫn so sánh
  vn_today := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

  SELECT order_code INTO last_code
  FROM orders
  WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = vn_today
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
    new_letter := CHR(ASCII(last_letter) + 1);
  END IF;

  RETURN new_letter || LPAD(new_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

> ⚠️ Gọi trong transaction khi tạo order. Reset theo timezone `Asia/Ho_Chi_Minh`.

### Status Flow

```
new → making → done
new → cancelled
```

---

## order_items

| Column           | Type    | Note                                   |
| ---------------- | ------- | -------------------------------------- |
| id               | uuid    | PK, DEFAULT uuid_generate_v7()         |
| order_id         | uuid    | FK → orders.id                         |
| product_id       | uuid    | FK → products.id (soft ref)            |
| product_name     | varchar | snapshot                               |
| quantity         | int     | NOT NULL, > 0                          |
| unit_price       | int     | snapshot VND (gồm extra_price options) |
| selected_options | jsonb   | snapshot options — xem format bên dưới |
| note             | text    |                                        |

> `order_items` không soft delete — xóa order thì update status = 'cancelled', items giữ nguyên để audit.

### selected_options Format

```json
[
  { "option_name": "Size", "value_name": "L", "extra_price": 5000 },
  { "option_name": "Topping", "value_name": "Trân Châu", "extra_price": 8000 }
]
```

---

## Constraints & Indexes

```sql
UNIQUE (orders.order_code)
CHECK  (products.price > 0)
CHECK  (order_items.quantity > 0)
CHECK  (product_options.type IN ('select', 'multi'))

-- Performance indexes
INDEX (orders.status)
INDEX (orders.created_at)
INDEX (orders.updated_at)
INDEX (products.category_id)
INDEX (products.is_available)

-- Soft delete indexes (partial index — chỉ index active records)
INDEX (products.id)              WHERE deleted_at IS NULL
INDEX (categories.id)            WHERE deleted_at IS NULL
INDEX (product_options.id)       WHERE deleted_at IS NULL
INDEX (product_option_values.id) WHERE deleted_at IS NULL

-- Trigger tự cập nhật updated_at trên orders
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## RLS Policies

### Nguyên tắc

- **Client-side**: bị RLS giới hạn
- **Server-side API Routes**: dùng `service_role_key` bypass RLS hoàn toàn
- RLS filter `deleted_at IS NULL` để bảo vệ khi client truy cập trực tiếp

### Policies

| Table                 | anon                                                  | authenticated (owner) |
| --------------------- | ----------------------------------------------------- | --------------------- |
| categories            | SELECT WHERE deleted_at IS NULL                       | ALL                   |
| products              | SELECT WHERE is_available=true AND deleted_at IS NULL | ALL                   |
| product_options       | SELECT WHERE deleted_at IS NULL                       | ALL                   |
| product_option_values | SELECT WHERE deleted_at IS NULL                       | ALL                   |
| orders                | INSERT                                                | ALL                   |
| order_items           | INSERT                                                | ALL                   |

### API Routes dùng service_role cho

- Public tracking: `GET /api/orders/:code`, `POST /api/orders/:code/cancel`
- Owner reads/writes: tất cả protected endpoints

---

## Image Upload Rules

- Format: JPG, PNG, WebP — max 2MB
- Path: `product-images/{product_id}/{timestamp}.webp`

---

## Supabase Storage

### Bucket: `product-images`

| Setting             | Value                                    |
| ------------------- | ---------------------------------------- |
| Public              | `true` — URL load được không cần auth    |
| File size limit     | 2 097 152 bytes (2 MB)                   |
| Allowed MIME types  | `image/jpeg`, `image/png`, `image/webp`  |

### Policies (`storage.objects`)

| Policy                          | Role            | Operation | Condition                               |
| ------------------------------- | --------------- | --------- | --------------------------------------- |
| `public_read_product_images`    | `anon`          | SELECT    | `bucket_id = 'product-images'`          |
| `owner_read_product_images`     | `authenticated` | SELECT    | bucket + `app_metadata.role = 'admin'`  |
| `owner_insert_product_images`   | `authenticated` | INSERT    | bucket + `app_metadata.role = 'admin'`  |
| `owner_update_product_images`   | `authenticated` | UPDATE    | bucket + `app_metadata.role = 'admin'`  |
| `owner_delete_product_images`   | `authenticated` | DELETE    | bucket + `app_metadata.role = 'admin'`  |

> Upload không có auth hoặc không phải admin → **403 Forbidden**.  
> File > 2MB → bị reject tại storage level.

---

## Migration Rules

- **Không hard delete** — luôn dùng soft delete (`deleted_at = now()`)
- Không xóa cột đang có data
- AI không tự thay đổi schema mà không có spec
- Giá tiền luôn là `int` (VND)
- Mỗi migration là 1 file riêng trong `supabase/migrations/`
- Migration đầu tiên phải `CREATE EXTENSION IF NOT EXISTS pg_uuidv7`
