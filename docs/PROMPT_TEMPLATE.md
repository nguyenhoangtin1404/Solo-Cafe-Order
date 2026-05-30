# Prompt Template cho AI

Dùng template này khi yêu cầu AI làm task cụ thể.

## Rules cơ bản (luôn apply)

1. Đọc `CLAUDE.md` trước
2. Tuân thủ `docs/AI_RULES.md` nghiêm ngặt
3. Đọc file liên quan trước khi code
4. Chỉ sửa file được chỉ định
5. Không tự thêm feature ngoài scope
6. Không đổi architecture

---

## Template cơ bản

```
Context:
- File liên quan: <path/to/file.ts>
- Domain rules: <rule cụ thể từ docs/DOMAIN.md nếu liên quan>
- API contract: <endpoint nếu liên quan>

Task:
<Mô tả rõ ràng cần làm gì>

Constraints:
- <ràng buộc 1>
- <ràng buộc 2>

Expected output:
- <kết quả mong đợi>
```

---

## Ví dụ — Tạo Submit Order API

```
Context:
- File: app/api/orders/route.ts
- Domain rules: snapshot product_name + unit_price, validate product available
- API contract: POST /api/orders (xem docs/API_CONTRACT.md)

Task:
Implement POST /api/orders — nhận cart items, tạo order + order_items trong DB.

Constraints:
- Validate product còn available trước khi tạo
- Snapshot product_name và unit_price vào order_items
- Sinh order_code dạng #A001, tăng dần
- Không hardcode

Expected output:
- Route handler hoàn chỉnh
- OrderService.submitOrder()
- Trả về { order_code, total_amount }
```

---

## Ví dụ — Fix Bug

```
Context:
- File: components/dashboard/OrderCard.tsx

Task:
Realtime update không trigger re-render khi order status thay đổi.

Constraints:
- Không refactor toàn bộ component
- Chỉ fix phần subscription/state

Expected output:
- Minimal diff
- Giải thích ngắn root cause
```
