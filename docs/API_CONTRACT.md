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

**Response 201**
```json
{
  "order_code": "A001",
  "pickup_name": "Minh",
  "total_amount": 90000,
  "wait_estimate": "5-10 phút",
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

**Errors**
- `404 ORDER_NOT_FOUND`

---

### POST /api/orders/:code/cancel

Khách tự cancel order bằng `order_code`. Chỉ được khi status = `new`.

> ⚠️ **Security note**: `order_code` format `A001`–`Z999` (~25,000 codes/ngày) có thể bị brute-force. Risk thấp với quán nhỏ (attacker cancel order người khác không có lợi gì). Nếu cần bảo mật cao hơn ở Phase 2: thêm `cancel_token` random UUID vào orders.

**Request**: body rỗng

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

Lấy orders hôm nay. Hỗ trợ filter theo status và cursor-based pagination.

**Query params**:
- `?status=new` — optional, filter: `new` | `making` | `done` | `cancelled`
- `?limit=50` — optional, default 50, max 100
- `?cursor=<uuid>` — optional, UUID v7 của order cuối cùng trong page trước (time-ordered)

> Cursor-based pagination dùng UUID v7 (time-ordered) — hiệu quả hơn offset, không bị duplicate khi có order mới trong lúc phân trang.

**Response 200**
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
      "updated_at": "2025-01-01T10:05:00Z",
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
  ],
  "pagination": {
    "has_more": false,
    "next_cursor": null
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

### DELETE /api/products/:id

Soft delete sản phẩm — set `deleted_at = now()`. Không bao giờ hard delete.

- Product bị soft delete sẽ ẩn khỏi menu và admin panel
- Snapshot trong `order_items` vẫn còn nguyên (bảo toàn lịch sử)
- Có thể restore sau này nếu cần

**Response 200**: `{ "id": "uuid", "deleted_at": "2025-01-01T10:00:00Z" }`

**Errors**: `404 PRODUCT_NOT_FOUND`, `401 UNAUTHORIZED`

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
