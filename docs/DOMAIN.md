# Domain Knowledge

## Entities

### Product

- Có category (bắt buộc)
- Giá là VND (int > 0), không âm, không float
- `is_available = false` → ẩn khỏi menu khách, không thể thêm vào cart
- Có thể có nhiều options (Size, Topping...)
- Mỗi option có nhiều values, mỗi value có thể có `extra_price`
- Image: JPG/PNG/WebP, max 2MB, lưu trên Supabase Storage

### Order

- Sinh `order_code` bởi DB function — không sinh trong application code
- Format hiển thị: `A001`, `A002`... (không có `#`) reset mỗi ngày. Sau A999 → B001
- Status lifecycle: `new → making → done` hoặc `new → cancelled`
- **Cancel được khi status = `new`** — cả owner lẫn khách đều cancel được (khách dùng order_code)
- **Không đổi status ngược** — `done → making` là invalid
- `total_amount` = tổng tính lúc submit, bất biến
- `order_items` snapshot `product_name` + `unit_price` — bất biến sau khi tạo
- `pickup_name` (nullable): tên khách để owner gọi khi xong đồ
- `customer_ref` (nullable): dành cho Phase 3 loyalty — phone hoặc QR token
- Không cần customer account — khách anonymous

### Cart (client-side only)

- Cart chỉ tồn tại ở local state / localStorage
- Không persist cart xuống database
- **Validate lại `is_available` của từng product khi submit** — không tin cart state
- Clear cart sau khi submit order thành công
- Nếu product bị tắt giữa chừng → hiện thông báo, remove item khỏi cart

### Category

- Owner quản lý categories: thêm, sửa tên, đổi thứ tự, xóa
- **Chỉ xóa được category khi không còn product nào** — tránh orphan products
- `sort_order` quyết định thứ tự hiển thị trên menu

### Owner (Admin)

- **1 account cố định** — tạo sẵn trên Supabase Dashboard (email + password)
- Không có trang signup — owner chỉ dùng `/login`
- Có quyền đổi trạng thái order
- Có quyền bật/tắt `is_available` của product
- Có quyền thêm/sửa/xóa product, category, và upload ảnh lên Supabase Storage
- Xem realtime dashboard với âm thanh thông báo khi có order mới

---

## Business Rules

1. Khách không cần tài khoản để đặt hàng
2. `pickup_name` là optional — nhưng nên khuyến khích nhập để tránh nhầm đồ
3. Order chỉ đổi status theo chiều tiến — không đổi ngược
4. **Khách có thể cancel order bằng `order_code`** — chỉ khi status còn `new`
5. Owner có thể cancel bất kỳ order nào khi status = `new`
6. Không cho sửa items sau khi đã submit
7. Product hết hàng → `is_available = false`, ẩn khỏi menu ngay
8. **Giá do server tính**: `unit_price = product.price + sum(selected option_value.extra_price)`. Client chỉ gửi `product_id` + `selected_option_value_ids`, không gửi price
9. `total_amount = sum(unit_price × quantity)` của tất cả items, tính server-side
10. `order_code` sinh bởi DB function trong transaction — không bao giờ duplicate
11. Input người dùng (`pickup_name`, `note`) phải sanitize trước khi lưu — không cho XSS
12. `order_items.selected_options` lưu snapshot options dạng JSON — owner biết pha size gì, topping gì
13. Category chỉ xóa được khi không còn product — tránh orphan data
14. **Cancel security**: `order_code` format `A001–Z999` có ~25,000 codes/ngày — đủ an toàn cho quán nhỏ. Nếu cần bảo mật cao hơn (Phase 2+): thêm `cancel_token` UUID riêng

---

## Estimated Wait Time

Hiển thị trên order success screen để khách biết chờ bao lâu.

**Cách tính**: đếm số order đang `new` + `making` trước order hiện tại × thời gian trung bình 1 đồ (mặc định 3 phút).

```
wait_estimate = (pending_orders_ahead) × 3 phút
Hiển thị: "Khoảng 5-10 phút" (làm tròn lên range)
```

> Chỉ là ước tính, không cam kết. Hiển thị dạng range (e.g. "5-10 phút"), không phải số chính xác.

---

## Owner Notification (Dashboard)

- Khi có order `INSERT` mới từ Supabase Realtime → phát âm thanh beep
- Dùng Web Audio API hoặc `<audio>` element
- Âm thanh chỉ phát được sau user interaction đầu tiên (browser policy)
- Visual fallback: badge đỏ trên tab title "🔴 Có đơn mới"

---

## Dashboard Filter

Owner xem orders theo tab:

| Tab | Filter |
|---|---|
| Tất cả | Tất cả orders hôm nay |
| Đang chờ | status = `new` |
| Đang làm | status = `making` |
| Xong | status = `done` hoặc `cancelled` |

---

## Customer Order Tracking

Sau khi submit, khách có thể vào `/order/[code]` để xem trạng thái realtime.

- Hiển thị: `order_code`, `pickup_name`, status hiện tại, danh sách món
- Realtime: subscribe Supabase channel để update status tự động
- Nút **Cancel** hiển thị chỉ khi status = `new`
- Khi status = `done`: hiển thị "Đồ của bạn đã xong, lấy tại quầy! 🎉"
- Không cần auth — truy cập bằng `order_code` (unguessable đủ trong ngày)

---

## Empty States

| Context | Hiển thị |
|---|---|
| Menu — không có sản phẩm available | "Hôm nay quán tạm đóng 🙏" |
| Cart — trống | "Chưa chọn món nào" + nút quay lại menu |
| Dashboard — không có order | "Chưa có đơn hàng hôm nay ☕" |
| Admin — chưa có product | "Chưa có sản phẩm nào" + nút thêm mới |

---

## QR Code

- QR trỏ đến `NEXT_PUBLIC_APP_URL/menu`
- `NEXT_PUBLIC_APP_URL` khai báo trong env (ví dụ: `https://your-cafe.vercel.app`)
- Generate QR image trong admin panel để owner in/share

---

## Phase 3 Preparation (Loyalty)

- Column `customer_ref` đã có từ Phase 1 (nullable)
- Phase 3 chỉ populate `customer_ref` = phone number hoặc loyalty QR token
- Không cần migrate orders table khi lên Phase 3

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
| `/order/[code]` | Khách | Không (dùng order_code) |
| `/login` | Owner | Không (form login) |
| `/dashboard` | Owner | Có |
| `/admin` | Owner | Có |
