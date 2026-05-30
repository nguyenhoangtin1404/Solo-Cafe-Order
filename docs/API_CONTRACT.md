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

**Empty case**: Trả về `categories: []` nếu không có sản phẩm available.

---

### POST /api/orders

Submit đơn hàng mới từ khách.

**Rate limit**: 10 requests / phút / IP. Vượt → `429 Too Many Requests`.

**Request**
```json
{
  "pickup_name": "Minh",
  "note": "Ít đá",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 40000,
      "note": "Nhiều đường",
      "selected_options": [
        { "option_value_id": "uuid" }
      ]
    }
  ]
}
```

- `pickup_name`: optional, max 50 ký tự, sanitize XSS
- `note`: optional, max 200 ký tự
- `items`: bắt buộc, không rỗng
- `unit_price`: client gửi lên, server **phải validate** lại với DB price

**Response 201**
```json
{
  "order_code": "A001",
  "pickup_name": "Minh",
  "total_amount": 80000,
  "items": [
    {
      "product_name": "Cà Phê Sữa",
      "quantity": 2,
      "unit_price": 40000
    }
  ]
}
```

**Errors**
- `400 VALIDATION_ERROR` — thiếu items, quantity ≤ 0, pickup_name > 50 ký tự
- `422 PRODUCT_UNAVAILABLE` — sản phẩm đã tắt (`is_available = false`)
- `422 PRODUCT_NOT_FOUND` — product_id không tồn tại
- `422 PRICE_MISMATCH` — unit_price client gửi khác DB (tampered)
- `429` — rate limit exceeded

---

## Protected Endpoints (cần Owner auth)

> Session cookie via Supabase Auth. Middleware check server-side.
> Nếu không có session: `401 UNAUTHORIZED`

---

### GET /api/orders

Lấy danh sách order hôm nay, mới nhất trước.

**Query params**: `?status=new` (optional filter by status)

**Response 200**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_code": "A001",
      "status": "new",
      "total_amount": 80000,
      "pickup_name": "Minh",
      "note": "Ít đá",
      "created_at": "2025-01-01T10:00:00Z",
      "items": [
        {
          "product_name": "Cà Phê Sữa",
          "quantity": 2,
          "unit_price": 40000,
          "note": "Nhiều đường"
        }
      ]
    }
  ]
}
```

---

### PATCH /api/orders/:id/status

Đổi trạng thái order. Phải đúng flow: `new → making → done` hoặc `new → cancelled`.

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

Bật/tắt sản phẩm. Cập nhật ngay, menu public filter theo `is_available`.

**Request**
```json
{ "is_available": false }
```

**Response 200**
```json
{ "id": "uuid", "is_available": false }
```

**Errors**
- `404 PRODUCT_NOT_FOUND`
- `401 UNAUTHORIZED`

---

### POST /api/products

Thêm sản phẩm mới.

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

**Response 201**
```json
{ "id": "uuid", "name": "Bạc Xỉu", "price": 30000, "is_available": true }
```

**Errors**
- `400 VALIDATION_ERROR`
- `404 CATEGORY_NOT_FOUND`
- `401 UNAUTHORIZED`

---

### PATCH /api/products/:id

Sửa thông tin sản phẩm (partial update).

**Request** (tất cả fields optional)
```json
{ "name": "...", "price": 35000, "description": "...", "image_url": "..." }
```

**Response 200**: Updated product object.

---

## Notes

- Thêm endpoint mới phải có spec đầy đủ: method, path, request/response schema, validation, auth, error codes
- Server luôn validate lại `unit_price` với DB — không trust client price
- Không tự giả định behavior nếu chưa có spec
