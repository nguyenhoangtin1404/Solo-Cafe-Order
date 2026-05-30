# API Contract

> Base path: `/api`  
> Content-Type: `application/json`  
> Error format: `{ "code": "ERROR_CODE", "message": "..." }`

---

## Public Endpoints (không cần auth)

### GET /api/menu
Lấy toàn bộ menu, nhóm theo category. Chỉ trả về `is_available = true`.

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

---

### POST /api/orders
Submit đơn hàng mới từ khách.

**Request**
```json
{
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

**Response 201**
```json
{
  "order_code": "#A001",
  "total_amount": 80000
}
```

**Errors**
- `400 VALIDATION_ERROR` — thiếu field, quantity ≤ 0
- `422 PRODUCT_UNAVAILABLE` — sản phẩm đã hết / tắt
- `422 PRODUCT_NOT_FOUND` — product_id không tồn tại

---

## Protected Endpoints (cần Owner auth)

> Gửi session cookie qua Supabase Auth. Middleware check session server-side.

### GET /api/orders
Lấy danh sách order (mặc định hôm nay, sắp xếp mới nhất trước).

**Query params**: `?status=new` (optional filter)

**Response 200**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_code": "#A001",
      "status": "new",
      "total_amount": 80000,
      "note": "Ít đá",
      "created_at": "2025-01-01T10:00:00Z",
      "items": [...]
    }
  ]
}
```

---

### PATCH /api/orders/:id/status
Đổi trạng thái order.

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
- `422 INVALID_STATUS_TRANSITION` — không đúng flow (e.g. done → making)
- `401 UNAUTHORIZED`

---

### PATCH /api/products/:id/availability
Bật/tắt sản phẩm.

**Request**
```json
{ "is_available": false }
```

**Response 200**
```json
{ "id": "uuid", "is_available": false }
```

---

## Notes

- Thêm endpoint mới phải có spec đầy đủ: method, path, request/response schema, validation rules, auth, error codes
- Không tự giả định behavior nếu chưa có spec
