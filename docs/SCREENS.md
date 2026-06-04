# Vibe Coffee — Danh sách màn hình

> **Tổng cộng: 28 màn hình** · 4 phases + hệ thống  
> Ảnh thiết kế: `docs/design-system/screens/`

---

## Phase 1 — MVP

### Khách (Public)

**1. Menu** — Trang chính: tabs danh mục, grid sản phẩm, search

| v1                                          | v2                                          |
| ------------------------------------------- | ------------------------------------------- |
| ![menu_1](design-system/screens/menu_1.png) | ![menu_2](design-system/screens/menu_2.png) |

---

**2. Product Detail Modal** — Chọn size/topping, số lượng, ghi chú

| EN                                                          | VI                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| ![product_detail](design-system/screens/product_detail.png) | ![product_detail_vi](design-system/screens/product_detail_vi.png) |

---

**3. Cart** — Giỏ hàng: danh sách items, tổng tiền, nhập tên + ghi chú

| Có item                                 | Trống                                               |
| --------------------------------------- | --------------------------------------------------- |
| ![cart](design-system/screens/cart.png) | ![cart_empty](design-system/screens/cart_empty.png) |

---

**4. Order Success** — Xác nhận đặt thành công: order code, items, thời gian chờ

![order_success](design-system/screens/order_success.png)

---

**5. Order Tracking** — Realtime status: code lớn, progress, nút cancel

| Đang pha                                                  | Xong                                                      |
| --------------------------------------------------------- | --------------------------------------------------------- |
| ![track_order_1](design-system/screens/track_order_1.png) | ![track_order_2](design-system/screens/track_order_2.png) |

> Xem thêm: ![order_completed](design-system/screens/order_completed.png)

---

### Owner (Auth required)

**6. Login** — Đăng nhập email + password

![login](design-system/screens/login.png)

---

**7. Order Queue** — Realtime dashboard: 3 tabs Mới / Đang pha / Xong, âm thanh thông báo

| Queue                                             | Completed                                                             | No Orders                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ![dashboard](design-system/screens/dashboard.png) | ![dashboard_completed](design-system/screens/dashboard_completed.png) | ![dashboard_no_orders](design-system/screens/dashboard_no_orders.png) |

| History                                                           | Interactive                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ![dashboard_history](design-system/screens/dashboard_history.png) | ![dashboard_interactive](design-system/screens/dashboard_interactive.png) |

---

**8. Order Detail** — Modal/drawer chi tiết đơn: items, ghi chú, action buttons

![order_detail](design-system/screens/order_detail.png)

---

**9. Product List** — Danh sách sản phẩm: toggle available, search, filter

![admin_product_list](design-system/screens/admin_product_list.png)

---

**10. Product Form** — Thêm/sửa sản phẩm: ảnh, giá, mô tả, options

![admin_product_form](design-system/screens/admin_product_form.png)

---

**11. Category Management** — Thêm/sửa/sắp xếp thứ tự danh mục

| List                                                                  | Form                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ![admin_category_list](design-system/screens/admin_category_list.png) | ![admin_category_form](design-system/screens/admin_category_form.png) |

---

## Phase 2 — Operations

**12. Revenue Dashboard** — Doanh thu ngày/tuần/tháng, top sản phẩm, biểu đồ

![revenue](design-system/screens/revenue.png)

---

**13. Order History** — Lịch sử đơn đã xong: filter theo ngày, tìm kiếm

![order_history](design-system/screens/order_history.png)

---

**14. QR Code Generator** — Tạo, preview và in/tải QR cho bàn hoặc takeaway

![admin_qr_code](design-system/screens/admin_qr_code.png)

---

**15. Settings** — Tên quán, giờ mở cửa, thông báo, thời gian pha mặc định

![settings](design-system/screens/settings.png)

---

## Phase 3 — Loyalty

### Owner

**16. Customer List** — Danh sách khách quen: điểm tích lũy, lịch sử order

![customers](design-system/screens/customers.png)

---

**17. Voucher Management** — Tạo/quản lý mã giảm giá, điều kiện áp dụng

| List                                                                | Form                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------- |
| ![voucher_management](design-system/screens/voucher_management.png) | ![voucher_form](design-system/screens/voucher_form.png) |

---

**18. Loyalty Dashboard** — Thống kê điểm, khách trung thành, tỉ lệ quay lại

![loyalty_dashboard](design-system/screens/loyalty_dashboard.png)

---

### Khách

**19. Customer Profile / Loyalty Card** — Điểm tích lũy, lịch sử order, voucher có sẵn

| Card                                                    | History                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| ![loyalty_card](design-system/screens/loyalty_card.png) | ![loyalty_history](design-system/screens/loyalty_history.png) |

---

**20. Voucher Wallet** — Danh sách voucher của khách, trạng thái còn/hết hạn

![voucher_detail](design-system/screens/voucher_detail.png)

---

## Phase 4 — Gamification

**21. Lucky Wheel** — Vòng quay may mắn sau mỗi order

| Wheel                                                 | Winning                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| ![lucky_wheel](design-system/screens/lucky_wheel.png) | ![winning_reward](design-system/screens/winning_reward.png) |

---

**22. Secret Menu** — Menu ẩn: unlock khi đủ điểm hoặc có code

| Locked                                                | Unlocked                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| ![secret_menu](design-system/screens/secret_menu.png) | ![secret_menu_unlocked](design-system/screens/secret_menu_unlocked.png) |

---

**23. Mini Game** — Quiz cà phê, đoán hương vị

| Question                                          | Correct Answer                                          |
| ------------------------------------------------- | ------------------------------------------------------- |
| ![quiz_game](design-system/screens/quiz_game.png) | ![quiz_correct](design-system/screens/quiz_correct.png) |

---

**24. Leaderboard** — Top khách trong tháng, badge, thành tích

| Game Hub                                        | Leaderboard                                           |
| ----------------------------------------------- | ----------------------------------------------------- |
| ![game_hub](design-system/screens/game_hub.png) | ![leaderboard](design-system/screens/leaderboard.png) |

---

## Hệ thống (xuyên suốt)

**25. 404 / Not Found** — URL sai hoặc order không tồn tại

![404](design-system/screens/404.png)

---

**26. Empty States** — Giỏ trống, menu trống, không có đơn mới

| Cart Empty                                          | Menu Empty                                          |
| --------------------------------------------------- | --------------------------------------------------- |
| ![cart_empty](design-system/screens/cart_empty.png) | ![menu_empty](design-system/screens/menu_empty.png) |

---

**27. Error / Offline** — Mất mạng, lỗi server

| Network Error                                             | Server Error 500                                        |
| --------------------------------------------------------- | ------------------------------------------------------- |
| ![network_error](design-system/screens/network_error.png) | ![server_error](design-system/screens/server_error.png) |

---

**28. Loading Skeleton** — Placeholder khi đang fetch data

| Menu Skeleton                                             | Dashboard Skeleton                                                  | Loading                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| ![skeleton_menu](design-system/screens/skeleton_menu.png) | ![skeleton_dashboard](design-system/screens/skeleton_dashboard.png) | ![loading](design-system/screens/loading.png) |

---

## Realtime Connection States

> Các trạng thái kết nối Supabase Realtime — hiển thị indicator trên từng page.

| Home                                                                          | Menu                                                                          | Cart                                                                          | Dashboard                                                                               | Reconnecting                                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ![realtime_connected_home](design-system/screens/realtime_connected_home.png) | ![realtime_connected_menu](design-system/screens/realtime_connected_menu.png) | ![realtime_connected_cart](design-system/screens/realtime_connected_cart.png) | ![realtime_connected_dashboard](design-system/screens/realtime_connected_dashboard.png) | ![realtime_reconnecting](design-system/screens/realtime_reconnecting.png) |

---

## Tóm tắt

| Phase                  | Màn hình | Số lượng |
| ---------------------- | -------- | -------- |
| Phase 1 — MVP          | 1 → 11   | 11       |
| Phase 2 — Operations   | 12 → 15  | 4        |
| Phase 3 — Loyalty      | 16 → 20  | 5        |
| Phase 4 — Gamification | 21 → 24  | 4        |
| Hệ thống               | 25 → 28  | 4        |
| **Tổng**               |          | **28**   |

---

_Thiết kế: Sunrise Brew Design System · Xem chi tiết tại [`design-system/DESIGN_LIBRARY.md`](design-system/DESIGN_LIBRARY.md)_
