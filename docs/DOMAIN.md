# Domain Knowledge

## Entities

### Product
- Có category (bắt buộc)
- Giá là VND (int), không âm
- `is_available = false` → ẩn khỏi menu khách, không thể thêm vào cart
- Có thể có nhiều options (Size, Topping...)
- Mỗi option có nhiều values, mỗi value có thể có `extra_price`

### Order
- Sinh `order_code` human-readable khi submit (format `#A001`, `#A002`...)
- Status lifecycle: `new → making → done` hoặc `new → cancelled`
- **Chỉ cancel được khi status = `new`**
- `total_amount` = tổng tính lúc submit, không tính lại sau
- `order_items` snapshot `product_name` + `unit_price` — bất biến sau khi tạo
- Không cần customer account — khách anonymous

### Cart (client-side only)
- Cart chỉ tồn tại ở local state / localStorage
- Không persist cart xuống database
- Clear cart sau khi submit order thành công

### Owner (Admin)
- 1 Supabase Auth account cho owner
- Có quyền đổi trạng thái order
- Có quyền bật/tắt `is_available` của product
- Có quyền đổi giá, upload ảnh
- Xem realtime dashboard

---

## Business Rules

1. Khách không cần tài khoản để đặt hàng
2. Order chỉ đổi status theo chiều tiến — không đổi ngược (`done` → `making` là không hợp lệ)
3. Không cho sửa order sau khi đã submit
4. Product hết hàng → `is_available = false`, ẩn khỏi menu
5. Giá hiển thị = `product.price + sum(selected option values.extra_price)`
6. `total_amount` phải bằng sum của `(unit_price * quantity)` của tất cả items

---

## Domain Principles

- Domain rules không phụ thuộc vào Supabase hay Next.js
- Service layer chịu trách nhiệm enforce domain rules
- API Route chỉ validate shape, không validate business rules
- Nếu rule chưa được mô tả trong tài liệu này → hỏi lại, không được tự giả định

---

## Screens & Ownership

| Screen | Người dùng | Auth cần? |
|---|---|---|
| `/menu` | Khách | Không |
| `/cart` | Khách | Không |
| `/order-success` | Khách | Không |
| `/dashboard` | Owner | Có |
| `/admin` | Owner | Có |
