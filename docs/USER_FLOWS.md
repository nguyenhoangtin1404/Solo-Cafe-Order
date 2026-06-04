# User Flows

## Personas

| Persona   | Mô tả                                                             |
| --------- | ----------------------------------------------------------------- |
| **Khách** | Người mua — scan QR, chọn món, gửi order, theo dõi trạng thái     |
| **Owner** | Chủ quán — nhận order realtime, cập nhật trạng thái, quản lý menu |

---

## Flow 1 — Khách đặt hàng (Happy Path)

```
[Khách scan QR tại bàn / quầy]
        ↓
[/menu — xem menu theo danh mục]
        ↓
[Chọn sản phẩm → mở Product Modal]
        ↓
[Chọn size/topping (nếu có) → Thêm vào giỏ]
        ↓
[Tiếp tục chọn thêm món hoặc vào giỏ hàng]
        ↓
[/cart — xem giỏ hàng]
  - Xem danh sách items + tổng tiền
  - Nhập tên lấy đồ (pickup_name) — optional nhưng UI khuyến khích ("Chúng tôi sẽ gọi tên này khi đồ xong")
  - Nhập ghi chú tổng đơn — optional
        ↓
[Bấm "Đặt hàng"]
  → Server validate is_available của từng product
  → Server tính unit_price + total_amount
  → Sinh order_code bởi DB function
  → Tính wait_estimate
        ↓
[/order-success — xác nhận đặt thành công]
  - Hiển thị: order_code, pickup_name, danh sách món, wait_estimate
  - Nút "Theo dõi đơn hàng" → /order/[code]
        ↓
[/order/[code] — tracking realtime]
  - Xem status cập nhật tự động
  - Nút Cancel (chỉ hiện khi status = new)
```

---

## Flow 2 — Khách cancel order

```
[/order/[code]] — status = "new"
        ↓
[Bấm "Huỷ đơn"]
        ↓
[Confirm dialog: "Bạn chắc chắn muốn huỷ?"]
        ↓
[Gọi POST /api/orders/[code]/cancel]
        ↓
[Status cập nhật → "cancelled"]
  - Hiển thị: "Đơn hàng đã bị huỷ"
  - Nút "Đặt lại" → /menu
```

---

## Flow 3 — Khách gặp sản phẩm hết hàng

```
[Bấm "Đặt hàng" ở giỏ hàng]
        ↓
[Server validate → product X is_available = false]
        ↓
[Trả về lỗi PRODUCT_UNAVAILABLE]
        ↓
[UI hiển thị toast: "Sản phẩm [tên] đã hết, vui lòng xoá khỏi giỏ"]
  - Highlight item bị lỗi trong cart
  - Không submit — user phải xoá item trước
```

---

## Flow 4 — Owner xử lý order (Happy Path)

```
[Owner mở /dashboard trên điện thoại / máy tính]
        ↓
[Lần đầu: bấm banner "Bật thông báo âm thanh 🔔"]
        ↓
[Chờ order mới]
        ↓
[Có order INSERT → beep + card mới xuất hiện ở tab "Đang chờ"]
  - Hiển thị: order_code, pickup_name, danh sách món, thời gian, ghi chú
        ↓
[Owner bấm "Bắt đầu pha"] → status: new → making
  - Card chuyển sang tab "Đang làm"
        ↓
[Pha xong → bấm "Xong"] → status: making → done
  - Card biến khỏi "Đang làm"
  - Gọi khách: "Gọi tên [pickup_name]" hoặc "Đơn [order_code]"
```

---

## Flow 5 — Owner cancel order

```
[Tab "Đang chờ" — order status = new]
        ↓
[Bấm "Huỷ đơn" trên card]
        ↓
[Confirm: "Huỷ đơn [A001]?"]
        ↓
[status: new → cancelled]
  - Card biến khỏi tab
```

---

## Flow 6 — Owner quản lý menu

### Tắt sản phẩm hết hàng

```
[/admin — danh sách sản phẩm]
        ↓
[Toggle "Còn hàng" → tắt]
        ↓
[is_available = false]
  - Sản phẩm biến khỏi /menu ngay lập tức
  - Khách đang xem menu không thấy sản phẩm nữa
```

### Thêm sản phẩm mới

```
[/admin → nút "Thêm sản phẩm"]
        ↓
[ProductForm — nhập: tên, mô tả, giá, category, ảnh]
  - Upload ảnh → Supabase Storage
        ↓
[Thêm options nếu có (Size, Topping...)]
  - Mỗi option có nhiều values + extra_price
        ↓
[Lưu → sản phẩm xuất hiện trên /menu]
```

---

## Flow 7 — Owner đăng nhập

```
[Truy cập /dashboard hoặc /admin khi chưa login]
        ↓
[Middleware redirect → /login]
        ↓
[Nhập email + password]
        ↓
[Supabase Auth verify]
  ✓ Thành công → redirect về trang ban đầu
  ✗ Thất bại → hiển thị lỗi "Email hoặc mật khẩu không đúng"
```

---

## Edge Cases

| Tình huống                              | Xử lý                                       |
| --------------------------------------- | ------------------------------------------- |
| Giỏ hàng trống → bấm Đặt hàng           | Disable nút, hiện "Chưa chọn món nào"       |
| Submit order thất bại (network)         | Toast lỗi, giữ nguyên giỏ hàng              |
| Mở /order/[code] với code không tồn tại | 404 page: "Không tìm thấy đơn hàng"         |
| Owner bị logout giữa chừng              | Middleware redirect về /login               |
| Realtime mất kết nối                    | Hiện dot đỏ, tự reconnect, không cần reload |
| Khách thêm product rồi product bị tắt   | Vẫn giữ trong cart, validate lúc submit     |
