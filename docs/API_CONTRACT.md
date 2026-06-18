# API Contract

> Base path: `/api`
> Content-Type: `application/json`
> Error format: `{ "code": "ERROR_CODE", "message": "..." }`
>
> **Server-side policy**: Tất cả API Routes dùng `SUPABASE_SERVICE_ROLE_KEY` để bypass RLS.
> Auth check (session) được thực hiện trong code, không phụ thuộc vào RLS.

---

## Public Endpoints (không cần auth)

### GET /api/menu

Lấy toàn bộ menu, nhóm theo category. Chỉ trả về sản phẩm `is_available = true`.

**Response 200**

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Cà Phê",
      "sort_order": 1,
      "products": [
        {
          "id": "uuid",
          "name": "Cà Phê Sữa",
          "description": "...",
          "price": 35000,
          "image_url": "https://...",
          "options": [
            {
              "id": "uuid",
              "name": "Size",
              "type": "select",
              "values": [
                { "id": "uuid", "name": "M", "extra_price": 0 },
                { "id": "uuid", "name": "L", "extra_price": 5000 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Empty case**: `categories: []` nếu không có sản phẩm available.

---

### POST /api/orders

Submit đơn hàng mới từ khách.

**Rate limit**: 10 requests / phút / IP (Upstash). Vượt → `429`.

> **Price policy**: Client không gửi giá. Server tự tính từ DB.

**Request**

```json
{
  "pickup_name": "Minh",
  "note": "Ít đá",
  "payment_method": "cash",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "note": "Nhiều đường",
      "selected_option_value_ids": ["uuid-size-L", "uuid-topping-tran-chau"]
    }
  ]
}
```

> `payment_method`: `"cash"` (default) | `"bank_transfer"` | `"momo"` (Phase 2) | `"vnpay"` (Phase 2).
> Phase 1 chỉ accept `cash` và `bank_transfer` — gửi giá trị khác → `400 VALIDATION_ERROR`.

**Response 201**

```json
{
  "order_code": "A001",
  "pickup_name": "Minh",
  "total_amount": 90000,
  "wait_estimate": "5-10 phút",
  "payment_method": "bank_transfer",
  "bank_transfer_info": {
    "account_number": "...",
    "account_name": "...",
    "bank_name": "...",
    "qr_image_url": "..."
  },
  "items": [
    {
      "product_name": "Cà Phê Sữa",
      "quantity": 2,
      "unit_price": 45000,
      "selected_options": [
        { "option_name": "Size", "value_name": "L", "extra_price": 5000 }
      ]
    }
  ]
}
```

> `bank_transfer_info` chỉ có trong response khi `payment_method = "bank_transfer"`, null với các method khác.

**Errors**

- `400 VALIDATION_ERROR`
- `422 PRODUCT_UNAVAILABLE`
- `422 PRODUCT_NOT_FOUND`
- `429` — rate limit

---

### GET /api/orders/:code

Lấy thông tin order theo `order_code` — dành cho khách xem tracking page.

**Response 200**

```json
{
  "id": "uuid",
  "order_code": "A001",
  "status": "making",
  "pickup_name": "Minh",
  "total_amount": 90000,
  "created_at": "2025-01-01T10:00:00Z",
  "items": [
    {
      "product_name": "Cà Phê Sữa",
      "quantity": 2,
      "unit_price": 45000,
      "note": "Nhiều đường",
      "selected_options": [
        { "option_name": "Size", "value_name": "L", "extra_price": 5000 }
      ]
    }
  ]
}
```

> `id` là UUID của đơn hàng — dùng làm `order_id` khi cancel.

**Errors**

- `404 ORDER_NOT_FOUND`

---

### POST /api/orders/:code/cancel

Khách tự cancel order bằng `order_code`. Chỉ được khi status = `new`.

**Request body**

```json
{ "order_id": "uuid-of-the-order" }
```

`order_id` là UUID của đơn hàng — lấy từ response của `GET /api/orders/:code` khi khách vào trang tracking. Server dùng nó để xác minh quyền sở hữu; chỉ người biết UUID mới có thể cancel. (UUID không được trả về khi submit order.)

**Response 200**

```json
{ "order_code": "A001", "status": "cancelled" }
```

**Errors**

- `404 ORDER_NOT_FOUND`
- `422 INVALID_STATUS_TRANSITION` — status không còn là `new`

---

## Protected Endpoints — Orders (cần Owner auth)

> Session cookie via Supabase Auth. Middleware check server-side.
> Không có session → `401 UNAUTHORIZED`

### GET /api/orders

Lấy orders hôm nay. Behaviour khác nhau tùy `status`:

**Query params**:

- `?status=` — `new` | `making` | `done` | `cancelled` | _(bỏ trống = tất cả)_
- `?limit=30` — chỉ áp dụng khi `status=done/cancelled` hoặc không có status. Default 30, max 100
- `?cursor=<uuid>` — UUID v7 của order cuối cùng trong page trước (infinite scroll)

**Loading strategy theo status:**

| status               | Pagination             | Lý do                              |
| -------------------- | ---------------------- | ---------------------------------- |
| `new`                | Load all, không cursor | Owner phải thấy hết pending orders |
| `making`             | Load all, không cursor | Tương tự — không được bỏ sót       |
| `done` / `cancelled` | Cursor-based, 30/lần   | Chỉ tra cứu, có thể accumulate lớn |
| _(không có)_         | Cursor-based, 30/lần   | Tất cả orders hôm nay              |

> Cursor-based dùng UUID v7 (time-ordered) — không bị duplicate khi có order mới trong lúc user đang scroll.

**Response 200 — status=new hoặc making (no pagination)**

```json
{
  "orders": [
    {
      "id": "uuid",
      "order_code": "A001",
      "status": "new",
      "total_amount": 90000,
      "pickup_name": "Minh",
      "note": "Ít đá",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z",
      "items": [
        {
          "product_name": "Cà Phê Sữa",
          "quantity": 2,
          "unit_price": 45000,
          "note": "Nhiều đường",
          "selected_options": [
            { "option_name": "Size", "value_name": "L", "extra_price": 5000 }
          ]
        }
      ]
    }
  ]
}
```

**Response 200 — status=done hoặc không có status (có pagination)**

```json
{
  "orders": [...],
  "pagination": {
    "has_more": true,
    "next_cursor": "uuid-of-last-item"
  }
}
```

### PATCH /api/orders/:id/status

Flow: `new → making → done` hoặc `new → cancelled`.

**Request**: `{ "status": "making" }`

**Response 200**: `{ "id": "uuid", "status": "making" }`

**Errors**: `404 ORDER_NOT_FOUND`, `422 INVALID_STATUS_TRANSITION`, `401 UNAUTHORIZED`

---

## Protected Endpoints — Products (cần Owner auth)

### GET /api/products

Lấy tất cả products (kể cả `is_available = false`) cho admin panel.

**Response 200**

```json
{
  "products": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "name": "Cà Phê Sữa",
      "price": 35000,
      "image_url": "https://...",
      "is_available": true
    }
  ]
}
```

### POST /api/products

**Request**

```json
{
  "category_id": "uuid",
  "name": "Bạc Xỉu",
  "description": "...",
  "price": 30000,
  "image_url": "https://..."
}
```

**Response 201**: Created product object.

**Errors**: `400 VALIDATION_ERROR`, `404 CATEGORY_NOT_FOUND`, `401 UNAUTHORIZED`

### PATCH /api/products/:id

Partial update — tất cả fields optional.

**Request**: `{ "name": "...", "price": 35000, "image_url": "...", "description": "..." }`

**Response 200**: Updated product object.

**Errors**: `404 PRODUCT_NOT_FOUND`, `401 UNAUTHORIZED`

### PATCH /api/products/:id/availability

**Request**: `{ "is_available": false }`

**Response 200**: `{ "id": "uuid", "is_available": false }`

### GET /api/products/:id

Lấy chi tiết product kèm options (admin).

**Response 200**

```json
{
  "product": {
    "id": "uuid",
    "category_id": "uuid",
    "name": "Cà Phê Sữa",
    "price": 35000,
    "image_url": "https://...",
    "is_available": true,
    "options": [
      {
        "id": "uuid",
        "name": "Size",
        "type": "select",
        "values": [
          { "id": "uuid", "name": "M", "extra_price": 0 },
          { "id": "uuid", "name": "L", "extra_price": 5000 }
        ]
      }
    ]
  }
}
```

**Errors**: `404 PRODUCT_NOT_FOUND`, `401 UNAUTHORIZED`

### DELETE /api/products/:id

Soft delete sản phẩm — set `deleted_at = now()`. Không bao giờ hard delete.

- Product bị soft delete sẽ ẩn khỏi menu và admin panel
- Snapshot trong `order_items` vẫn còn nguyên (bảo toàn lịch sử)
- Có thể restore sau này nếu cần

**Response 204**: No content.

**Errors**: `404 PRODUCT_NOT_FOUND`, `401 UNAUTHORIZED`

---

## Protected Endpoints — Product Options (cần Owner auth)

### POST /api/products/:id/options

Thêm option group cho product.

**Request**: `{ "name": "Size", "type": "select" }`

> `type`: `"select"` (chọn đúng 1) | `"multi"` (chọn nhiều)

**Response 201**

```json
{ "option": { "id": "uuid", "product_id": "uuid", "name": "Size", "type": "select" } }
```

**Errors**: `400 VALIDATION_ERROR`, `404 PRODUCT_NOT_FOUND`, `401 UNAUTHORIZED`

### PATCH /api/products/:id/options/:optionId

Cập nhật option group. Tất cả fields optional.

**Request**: `{ "name": "Kích cỡ", "type": "multi" }`

**Response 200**: `{ "option": { ... } }`

**Errors**: `400 VALIDATION_ERROR`, `404 OPTION_NOT_FOUND`, `401 UNAUTHORIZED`

### DELETE /api/products/:id/options/:optionId

Soft delete option group và tất cả values bên trong (`deleted_at = now()`).

**Response 200**: `{ "id": "uuid", "deleted_at": "2025-01-01T10:00:00Z" }`

**Errors**: `404 OPTION_NOT_FOUND`, `401 UNAUTHORIZED`

### POST /api/products/:id/options/:optionId/values

Thêm value vào option group.

**Request**: `{ "name": "L", "extra_price": 5000 }`

> `extra_price`: số nguyên ≥ 0, tối đa 500,000.

**Response 201**

```json
{ "value": { "id": "uuid", "option_id": "uuid", "name": "L", "extra_price": 5000 } }
```

**Errors**: `400 VALIDATION_ERROR`, `404 OPTION_NOT_FOUND`, `401 UNAUTHORIZED`

### PATCH /api/products/:id/options/:optionId/values/:valueId

Cập nhật option value. Tất cả fields optional.

**Request**: `{ "name": "L", "extra_price": 6000 }`

**Response 200**: `{ "value": { ... } }`

**Errors**: `400 VALIDATION_ERROR`, `404 VALUE_NOT_FOUND`, `401 UNAUTHORIZED`

### DELETE /api/products/:id/options/:optionId/values/:valueId

Soft delete option value.

**Response 200**: `{ "id": "uuid", "deleted_at": "2025-01-01T10:00:00Z" }`

**Errors**: `404 VALUE_NOT_FOUND`, `401 UNAUTHORIZED`

---

## Protected Endpoints — Categories (cần Owner auth)

### GET /api/categories

Lấy tất cả categories, có kèm số lượng products.

**Response 200**

```json
{
  "categories": [
    { "id": "uuid", "name": "Cà Phê", "sort_order": 1, "product_count": 5 }
  ]
}
```

### POST /api/categories

**Request**: `{ "name": "Trà Sữa", "sort_order": 3 }`

**Response 201**: `{ "id": "uuid", "name": "Trà Sữa", "sort_order": 3 }`

**Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`

### PATCH /api/categories/:id

**Request**: `{ "name": "...", "sort_order": 2 }`

**Response 200**: Updated category object.

**Errors**: `404 CATEGORY_NOT_FOUND`, `401 UNAUTHORIZED`

### DELETE /api/categories/:id

Soft delete category — set `deleted_at = now()`. Không bao giờ hard delete.

Chỉ soft delete được nếu category không có active product (`deleted_at IS NULL`).

**Response 200**: `{ "id": "uuid", "deleted_at": "2025-01-01T10:00:00Z" }`

**Errors**

- `404 CATEGORY_NOT_FOUND`
- `422 CATEGORY_HAS_PRODUCTS` — còn active product trong category
- `401 UNAUTHORIZED`

---

## Protected Endpoints — Upload

### POST /api/upload/product-image

Upload ảnh lên Supabase Storage.

**Request**: `multipart/form-data`, field `file`

- Format: JPG, PNG, WebP — max 2MB

**Response 201**: `{ "url": "https://project.supabase.co/storage/v1/object/public/product-images/..." }`

**Errors**: `400 VALIDATION_ERROR` (sai format / quá size), `401 UNAUTHORIZED`

---

## Notes

- Client không bao giờ gửi price — server tự tính từ DB
- Tất cả API Routes dùng `service_role_key` — không phụ thuộc RLS cho logic auth
- `GET /api/orders/:code` và `POST /api/orders/:code/cancel` là public — dùng `order_code` làm identifier
- Thêm endpoint mới phải spec đầy đủ trước khi code
