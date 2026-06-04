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

| Code                        | HTTP | Meaning                                           |
| --------------------------- | ---- | ------------------------------------------------- |
| `VALIDATION_ERROR`          | 400  | Input không đúng format hoặc thiếu required field |
| `PRODUCT_NOT_FOUND`         | 404  | Product ID không tồn tại                          |
| `ORDER_NOT_FOUND`           | 404  | Order ID không tồn tại                            |
| `CATEGORY_NOT_FOUND`        | 404  | Category ID không tồn tại                         |
| `PRODUCT_UNAVAILABLE`       | 422  | Product `is_available = false`                    |
| `INVALID_STATUS_TRANSITION` | 422  | Đổi status không đúng flow                        |
| `CATEGORY_HAS_PRODUCTS`     | 422  | Xóa category còn chứa product                     |
| `PRICE_MISMATCH`            | 422  | unit_price client gửi khác DB (tampered)          |
| `UNAUTHORIZED`              | 401  | Chưa đăng nhập / session expired                  |
| `FORBIDDEN`                 | 403  | Đã login nhưng không có quyền                     |
| `RATE_LIMITED`              | 429  | Vượt rate limit                                   |
| `INTERNAL_ERROR`            | 500  | Lỗi server không xác định                         |

---

## HTTP Status Mapping

| HTTP | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK                                      |
| 201  | Created                                 |
| 400  | Bad Request / Validation                |
| 401  | Unauthorized                            |
| 403  | Forbidden                               |
| 404  | Not Found                               |
| 422  | Unprocessable (business rule violation) |
| 429  | Too Many Requests (rate limit)          |
| 500  | Internal Server Error                   |

---

## Rules

- Luôn trả đúng HTTP status code
- Message phải readable, không expose internal detail (stack trace, SQL error)
- Không log thông tin nhạy cảm ra response (token, password, PII)
- Server log đầy đủ chi tiết cho debugging, response chỉ trả `code + message`
- Dùng error boundary trong React để catch client-side errors — không để white screen
