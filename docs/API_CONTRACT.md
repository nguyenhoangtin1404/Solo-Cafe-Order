# API Contract

> Base path: `/api`
> Content-Type: `application/json`
> Error format: `{ "code": "ERROR_CODE", "message": "..." }`

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
      "selected_option_value_ids": ["uuid-size-L"]
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
      "selected_options": ["Size L"]
    }
  ]
}
```

- `wait_estimate`: ước tính thời gian chờ dựa trên số order đang pending × 3 phút/đơn

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
      "note": "Nhiều đường"
    }
  ]
}
```

**Errors**
- `404 ORDER_NOT_FOUND`

---

### POST /api/orders/:code/cancel

Khách tự cancel order. Chỉ được khi status = `new`.

**Request**: body rỗng

**Response 200**
```json
{ "order_code": "A001", "status": "cancelled" }
```

**Errors**
- `404 ORDER_NOT_FOUND`
- `422 INVALID_STATUS_TRANSITION` — status không còn là `new`

---

## Protected Endpoints (cần Owner auth)

> Session cookie via Supabase Auth. Middleware check server-side.
> Không có session → `401 UNAUTHORIZED`
>
> **Owner account**: 1 account cố định, tạo trên Supabase Dashboard. Không có signup.

---

### GET /api/orders

Lấy orders hôm nay. Hỗ trợ filter theo status.

**Query params**: `?status=new` (optional — `new` | `making` | `done` | `cancelled`)

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
      "items": [
        {
          "product_name": "Cà Phê Sữa",
          "quantity": 2,
          "unit_price": 45000,
          "note": "Nhiều đường"
        }
      ]
    }
  ]
}
```

---

### PATCH /api/orders/:id/status

Đổi trạng thái order. Flow: `new → making → done` hoặc `new → cancelled`.

**Request**
```json
{ "status": "making" }
```

**Response 200**
```json
{ "id": "uuid", "status": "making" }
```

**Errors**
- `404 ORDER_NOT_FOUND`
- `422 INVALID_STATUS_TRANSITION`
- `401 UNAUTHORIZED`

---

### PATCH /api/products/:id/availability

**Request**
```json
{ "is_available": false }
```

**Response 200**
```json
{ "id": "uuid", "is_available": false }
```

---

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

---

### PATCH /api/products/:id

Partial update. All fields optional.

**Request**: `{ "name": "...", "price": 35000, "image_url": "..." }`

**Response 200**: Updated product object.

---

### POST /api/upload/product-image

Upload ảnh lên Supabase Storage.

**Request**: `multipart/form-data`, field `file`
- Format: JPG, PNG, WebP — max 2MB

**Response 201**
```json
{ "url": "https://project.supabase.co/storage/v1/object/public/product-images/..." }
```

**Errors**: `400 VALIDATION_ERROR` (sai format / quá size), `401 UNAUTHORIZED`

---

## Notes

- Client không bao giờ gửi price — server tự tính từ DB
- `GET /api/orders/:code` và `POST /api/orders/:code/cancel` là public — dùng `order_code` làm token
- Thêm endpoint mới phải spec đầy đủ trước khi code
