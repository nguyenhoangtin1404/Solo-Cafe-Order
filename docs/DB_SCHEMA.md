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
| price | int | VND, không dùng float |
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
| order_code | varchar | UNIQUE, human-readable (e.g. #A001) |
| status | varchar | new \| making \| done \| cancelled |
| total_amount | int | VND, tổng tại lúc submit |
| note | text | ghi chú toàn đơn |
| created_at | timestamp | default now() |

### Status Flow
```
new → making → done
new → cancelled
```
- Chỉ cancel được khi status = `new`
- Không sửa giá sau khi đã submit

---

## order_items

| Column | Type | Note |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK → orders.id |
| product_id | uuid | FK → products.id (soft ref) |
| product_name | varchar | snapshot tên tại lúc order |
| quantity | int | |
| unit_price | int | snapshot giá tại lúc order |
| note | text | ghi chú từng món |

> `product_name` và `unit_price` là snapshot — không thay đổi dù product sau bị xóa/đổi giá.

---

## Constraints & Indexes

```sql
UNIQUE (orders.order_code)
INDEX (orders.status)
INDEX (orders.created_at)
INDEX (products.category_id)
INDEX (products.is_available)
```

---

## Rules

- Không xóa cột đang có data — migration only
- AI không được tự thay đổi schema mà không có spec
- Giá tiền luôn là `int` (VND), không dùng `decimal`/`float`
- Không hard-delete order đã complete — dùng status
