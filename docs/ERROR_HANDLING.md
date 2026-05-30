# Error Handling Standard

## Error Response Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description"
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input không đúng format/required |
| `PRODUCT_NOT_FOUND` | 404 | Product ID không tồn tại |
| `ORDER_NOT_FOUND` | 404 | Order ID không tồn tại |
| `PRODUCT_UNAVAILABLE` | 422 | Product `is_available = false` |
| `INVALID_STATUS_TRANSITION` | 422 | Đổi status không đúng flow |
| `UNAUTHORIZED` | 401 | Chưa đăng nhập / session expired |
| `FORBIDDEN` | 403 | Không có quyền |
| `INTERNAL_ERROR` | 500 | Lỗi server không xác định |

---

## HTTP Status Mapping

| HTTP | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable (business rule violation) |
| 500 | Internal Server Error |

---

## Rules

- Luôn trả đúng HTTP status code
- Message phải readable, không expose internal detail
- Không log stack trace ra response
- Server log đầy đủ, response chỉ trả code + message
