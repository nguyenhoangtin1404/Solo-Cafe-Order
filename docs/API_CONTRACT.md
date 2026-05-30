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

**Rate limit**: 10 requests / phút / IP (Upstash). Vượt → `429 Too Many Requests`.

> **Price policy**: Client **không gửi giá**. Server tự tra DB để tính `unit_price` và `extra_price` cho từng item. Không thể tamper giá từ client.

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

- `pickup_name`: optional, max 50 ký tự, sanitize XSS
- `note`: optional, max 200 ký tự, sanitize XSS
- `items`: bắt buộc, không rỗng
- `selected_option_value_ids`: list UUID của option values được chọn (có thể rỗng)
- **Không có `unit_price` trong request** — server tự tính

**Server tính giá như sau:**
```
unit_price = product.price + sum(extra_price của các option_value được chọn)
total_amount = sum(unit_price × quantity) của tất cả items
```

**Response 201**
```json
{
  "order_code": "A001",
  "pickup_name": "Minh",
  "total_amount": 90000,
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

**Errors**
- `400 VALIDATION_ERROR` — thiếu items, quantity ≤ 0, pickup_name > 50 ký tự
- `422 PRODUCT_UNAVAILABLE` — sản phẩm đã tắt (`is_available = false`)
- `422 PRODUCT_NOT_FOUND` — product_id không tồn tại
- `429` — rate limit exceeded

---

## Protected Endpoints (cần Owner auth)

> Supabase Auth session cookie. Middleware check server-side.
> Không có session → `401 UNAUTHORIZED`
>
> **Owner account**: 1 account cố định, tạo sẵn trên Supabase Dashboard.
> Không có trang signup — owner chỉ dùng `/login`.

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

Bật/tắt sản phẩm. Menu public cập nhật ngay.

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

> `image_url`: upload lên Supabase Storage trước, sau đó gửi URL ở đây.

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

### POST /api/upload/product-image

Upload ảnh sản phẩm lên Supabase Storage. Trả về URL để dùng khi tạo/sửa product.

**Request**: `multipart/form-data`, field `file`

**Validation**:
- Format: JPG, PNG, WebP
- Max size: 2MB

**Response 201**
```json
{ "url": "https://your-project.supabase.co/storage/v1/object/public/product-images/..." }
```

**Errors**
- `400 VALIDATION_ERROR` — sai format hoặc > 2MB
- `401 UNAUTHORIZED`

---

## Notes

- Thêm endpoint mới phải có spec đầy đủ: method, path, request/response schema, validation, auth, error codes
- Client không bao giờ gửi price — server tự tính từ DB
- Không tự giả định behavior nếu chưa có spec
