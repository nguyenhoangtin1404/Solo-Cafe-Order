# Wireframes — Phase 1

> Layout phác thảo bố cục màn hình. Mobile-first (375px).
> `[ ]` = button, `[___]` = input field, `{img}` = hình ảnh, `(x)` = radio/checkbox

---

## 1. Menu — /menu

```
┌─────────────────────────────┐
│  ☰  Solo Cafe          🛒 2 │  ← header: tên quán + cart badge
├─────────────────────────────┤
│  [Cà Phê] [Trà] [Đá Xay]   │  ← category tabs (scroll ngang)
├─────────────────────────────┤
│  ┌──────────┐ ┌──────────┐  │
│  │  {img}   │ │  {img}   │  │  ← product grid (2 cột)
│  │ Bạc Xỉu  │ │ Cà Phê   │  │
│  │ 30,000đ  │ │ Sữa      │  │
│  │ [Thêm +] │ │ 35,000đ  │  │
│  └──────────┘ │ [Thêm +] │  │
│               └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │  {img}   │ │  {img}   │  │
│  │   ...    │ │   ...    │  │
│  └──────────┘ └──────────┘  │
│                              │
│         (scroll)             │
└─────────────────────────────┘
```

---

## 2. Product Detail Modal

```
┌─────────────────────────────┐
│                        [✕]  │  ← nút đóng
│  ┌─────────────────────┐    │
│  │       {img}         │    │  ← ảnh sản phẩm (full width)
│  └─────────────────────┘    │
│  Cà Phê Sữa                 │  ← tên sản phẩm
│  35,000đ                    │  ← giá base
│  Cà phê sữa truyền thống... │  ← mô tả
│                              │
│  Size                        │  ← option group
│  (•) M — +0đ                 │
│  ( ) L — +5,000đ             │
│                              │
│  Topping                     │
│  [ ] Trân châu — +5,000đ    │
│  [ ] Thạch — +3,000đ        │
│                              │
│  Số lượng                    │
│  [-]  1  [+]                 │
│                              │
│  Ghi chú món này             │
│  [Ít đường, nhiều đá...___] │
│                              │
│  [ Thêm vào giỏ — 35,000đ ] │  ← CTA button (full width)
└─────────────────────────────┘
```

---

## 3. Cart — /cart

```
┌─────────────────────────────┐
│  ←  Giỏ hàng (2 món)        │  ← header
├─────────────────────────────┤
│  Cà Phê Sữa — Size L         │
│  Trân châu                   │
│  [-] 1 [+]          35,000đ  │  ← item row
│  Ghi chú: ít đường           │
│  ─────────────────────────   │
│  Bạc Xỉu                     │
│  [-] 2 [+]          60,000đ  │
│  ─────────────────────────   │
├─────────────────────────────┤
│  Tên lấy đồ (không bắt buộc)│
│  [Tên của bạn______________] │
│                              │
│  Ghi chú cho quán            │
│  [Ít đá toàn bộ___________] │
├─────────────────────────────┤
│  Tạm tính          95,000đ  │
│                              │
│  [   Đặt hàng — 95,000đ   ] │  ← CTA
└─────────────────────────────┘
```

---

## 4. Order Success — /order-success

```
┌─────────────────────────────┐
│                              │
│          ✅                  │  ← icon to do
│   Đặt hàng thành công!      │
│                              │
│  ┌─────────────────────┐    │
│  │  Mã đơn hàng        │    │
│  │      A001           │    │  ← order_code lớn
│  │  Gọi tên: Minh      │    │  ← pickup_name
│  └─────────────────────┘    │
│                              │
│  ⏱ Thời gian chờ: 5-10 phút │
│                              │
│  Cà Phê Sữa (L) × 1         │  ← danh sách món
│  Bạc Xỉu × 2                │
│                              │
│  Tổng cộng       95,000đ    │
│                              │
│  [ Theo dõi đơn hàng →  ]   │  ← link /order/[code]
│  [ Đặt thêm                ]│
└─────────────────────────────┘
```

---

## 5. Order Tracking — /order/[code]

### Status: new
```
┌─────────────────────────────┐
│  Solo Cafe                   │
├─────────────────────────────┤
│  Đơn hàng A001              │  ← order_code
│  Gọi tên: Minh              │  ← pickup_name
│                              │
│  ●────────────────────       │  ← progress bar
│  Đang chờ  Đang pha  Xong   │
│                              │
│  ⏱ Khoảng 5-10 phút         │
│                              │
│  ─────────────────────────   │
│  Cà Phê Sữa (L, Trân châu)  │
│  1 × 35,000đ                 │
│  Bạc Xỉu × 2                 │
│  2 × 30,000đ                 │
│  ─────────────────────────   │
│  Tổng          95,000đ      │
│                              │
│  [ Huỷ đơn hàng ]           │  ← chỉ hiện khi new
└─────────────────────────────┘
```

### Status: done
```
│          🎉                  │
│  Đồ của bạn đã xong!        │
│  Lấy tại quầy nhé Minh ☕   │
```

---

## 6. Login — /login

```
┌─────────────────────────────┐
│                              │
│       Solo Cafe ☕           │
│       Đăng nhập              │
│                              │
│  Email                       │
│  [owner@cafe.com___________] │
│                              │
│  Mật khẩu                    │
│  [••••••••••••••••_________] │
│                              │
│  [      Đăng nhập          ] │
│                              │
│  ⚠ Email hoặc mật khẩu      │  ← hiện khi lỗi
│    không đúng                │
└─────────────────────────────┘
```

---

## 7. Dashboard — /dashboard

```
┌─────────────────────────────┐
│  Dashboard          🔔 bật  │  ← nút bật âm thanh (nếu chưa bật)
├─────────────────────────────┤
│  [Đang chờ 3][Đang làm 1][Xong]│  ← tabs
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │ A003 · 14:32  Minh  │    │  ← card order mới (highlight)
│  │ Cà Phê Sữa (L) × 1  │    │
│  │ Bạc Xỉu × 2          │    │
│  │ Ghi chú: ít đá       │    │
│  │ [Bắt đầu pha ▶]     │    │  ← action button
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ A002 · 14:28  Lan   │    │
│  │ Trà Sữa × 1          │    │
│  │ [Bắt đầu pha ▶]     │    │
│  └─────────────────────┘    │
│                              │
│  🟢 Realtime đang kết nối   │  ← connection indicator
└─────────────────────────────┘
```

### Tab Đang làm:
```
│  ┌─────────────────────┐    │
│  │ A001 · 14:20  Hùng  │    │
│  │ Cà Phê Đen × 1       │    │
│  │ [Đã xong ✓]         │    │
│  └─────────────────────┘    │
```

---

## 8. Admin — Product List — /admin

```
┌─────────────────────────────┐
│  ← Quản lý menu             │
│  [+ Thêm sản phẩm]          │
├─────────────────────────────┤
│  [Tất cả] [Cà Phê] [Trà]   │  ← filter tabs
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │{img} Cà Phê Sữa     │    │
│  │      35,000đ   ●    │    │  ← toggle is_available
│  │      [Sửa]          │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │{img} Bạc Xỉu         │    │
│  │      30,000đ   ○    │    │  ← tắt (hết hàng)
│  │      [Sửa]          │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

---

## 9. Admin — Product Form — /admin/products/new (hoặc /edit/[id])

```
┌─────────────────────────────┐
│  ← Thêm sản phẩm            │
├─────────────────────────────┤
│  Ảnh sản phẩm               │
│  ┌─────────────────────┐    │
│  │   [+ Upload ảnh]    │    │  ← upload zone
│  └─────────────────────┘    │
│                              │
│  Tên sản phẩm *             │
│  [Cà Phê Sữa_______________]│
│                              │
│  Danh mục *                  │
│  [Cà Phê              ▼]    │  ← select
│                              │
│  Giá (VND) *                 │
│  [35000_____________________]│
│                              │
│  Mô tả                       │
│  [Cà phê sữa truyền thống..] │  ← textarea
│                              │
│  Options (size, topping...)  │
│  ┌─────────────────────┐    │
│  │ Size      [select▼] │    │
│  │ M   +0đ      [✕]    │    │
│  │ L   +5000đ   [✕]    │    │
│  │ [+ Thêm giá trị]    │    │
│  └─────────────────────┘    │
│  [+ Thêm option]             │
│                              │
│  Còn hàng  ●                │  ← toggle
│                              │
│  [        Lưu sản phẩm     ]│
└─────────────────────────────┘
```
