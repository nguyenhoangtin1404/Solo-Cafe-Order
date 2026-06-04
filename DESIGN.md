# Sunrise Brew Aesthetic - Design System

Hệ thống thiết kế hiện đại, năng động và tràn đầy năng lượng buổi sáng cho ứng dụng đặt cà phê **Vibe Coffee**.

## 1. Bảng màu (Color Palette)

Sử dụng tông màu ấm của ánh nắng sớm kết hợp với màu nâu đậm đà của cà phê trên nền kem dịu nhẹ.

| Token             | Giá trị   | Ứng dụng                                                       |
| :---------------- | :-------- | :------------------------------------------------------------- |
| `primary`         | `#ffb000` | Màu chủ đạo (Brand Color), các nút CTA, biểu tượng quan trọng. |
| `surface`         | `#fff8f3` | Nền màn hình chính, tạo cảm giác sạch sẽ và ấm áp.             |
| `on-surface`      | `#1c0a00` | Màu văn bản chính, tiêu đề, mang lại độ tương phản cao.        |
| `secondary`       | `#7a4012` | Màu nhấn, trạng thái phụ, hoặc các chi tiết trang trí.         |
| `surface-variant` | `#fff1e3` | Nền cho các thẻ (cards) hoặc các phần phân tách nội dung.      |
| `outline`         | `#e6d8c8` | Màu đường viền, đường kẻ phân cách nhẹ nhàng.                  |

**Màu trạng thái đơn hàng (Status Colors):**

| Token              | Giá trị   | Trạng thái                                      |
| :----------------- | :-------- | :---------------------------------------------- |
| `status-new`       | `#f59e0b` | `new` — Đơn mới, chờ xác nhận (vàng amber).     |
| `status-making`    | `#ffb000` | `making` — Đang pha chế (dùng lại `primary`).   |
| `status-done`      | `#22c55e` | `done` — Hoàn thành, sẵn sàng lấy đồ (xanh lá). |
| `status-cancelled` | `#ef4444` | `cancelled` — Đã huỷ (đỏ).                      |

## 2. Kiểu chữ (Typography)

Hệ thống sử dụng font chữ hiện đại và dễ đọc, tối ưu cho trải nghiệm di động.

- **Font family:** `Space Grotesk` (Sans-serif)
- **Headline Large:** 32px / Bold (Tiêu đề trang Landing Page)
- **Headline Medium:** 24px / Semi-bold (Tiêu đề màn hình)
- **Body Large:** 16px / Regular (Nội dung chính, thông tin sản phẩm)
- **Label Small:** 12px / Medium (Nhãn thanh điều hướng, thông tin phụ)
- **Number/Code:** Luôn sử dụng `Space Grotesk` hoặc `Monospace` cho mã đơn hàng và giá tiền.

## 3. Thành phần (Components)

### Nút (Buttons)

- **Chính (Primary):** Nền màu `#ffb000`, chữ màu trắng hoặc nâu đậm, bo góc tối đa (`rounded-full`).
- **Phụ (Secondary):** Viền màu `#ffb000`, chữ màu `#ffb000`, nền trong suốt.

### Thẻ (Cards)

- Bo góc mềm mại (`rounded-2xl`).
- Đổ bóng nhẹ nhàng để tạo chiều sâu trên nền kem.

### Thanh điều hướng (Bottom Navigation)

- Nền trắng mờ hoặc kem sáng (`backdrop-blur`).
- Icon dạng line-art, nét dày 2px, màu cam `#ffb000`.

### Biểu tượng (Icons)

- **Thư viện:** [Lucide Icons](https://lucide.dev/) — đồng bộ với hệ sinh thái shadcn/ui.
- Style: line-art, stroke width `2px`, bo góc `round`.
- Kích thước chuẩn: `16px` (inline), `20px` (button), `24px` (navigation).

### Input Fields

- Bo góc `rounded-xl`.
- Viền màu `outline` (`#e6d8c8`) khi rỗng, chuyển sang `primary` (`#ffb000`) khi focus.
- Placeholder màu `#c4a882` (tone kem trung tính).

## 4. Spacing Scale

Dựa trên Tailwind CSS (đơn vị `1 = 4px`). Ưu tiên dùng các giá trị sau để giữ nhất quán:

| Token Tailwind  | Giá trị | Dùng cho                                   |
| :-------------- | :------ | :----------------------------------------- |
| `p-2` / `gap-2` | 8px     | Khoảng cách nội phần tử nhỏ (icon + label) |
| `p-3` / `gap-3` | 12px    | Padding nút, khoảng cách dòng              |
| `p-4` / `gap-4` | 16px    | Padding card, khoảng cách section nhỏ      |
| `p-6` / `gap-6` | 24px    | Padding màn hình, khoảng cách section lớn  |
| `p-8` / `gap-8` | 32px    | Khoảng cách lớn giữa các block             |

## 5. Yêu cầu Mobile-First

Thiết kế ưu tiên trải nghiệm trên điện thoại. Mọi component phải đạt **P1** trước khi mở rộng lên desktop.

| Yêu cầu                                                            | Mức độ | Lý do                                                          |
| :----------------------------------------------------------------- | :----: | :------------------------------------------------------------- |
| Tap target tối thiểu `44 × 44px` cho mọi nút, link, icon tương tác | **P1** | Tránh chạm nhầm, đáp ứng chuẩn WCAG 2.5.5                      |
| Font tối thiểu `16px` cho body text — không nhỏ hơn                | **P1** | Safari/iOS tự zoom khi input < 16px, gây vỡ layout             |
| `line-height` tối thiểu `1.5` cho nội dung dài (mô tả, ghi chú)    | **P1** | Dễ đọc trên màn nhỏ, tránh các dòng dính nhau                  |
| Viewport meta: `width=device-width, initial-scale=1`               | **P1** | Bắt buộc để layout co giãn đúng trên mobile                    |
| PWA: `manifest.json` + Service Worker — app installable            | **P1** | Khách scan QR cần trải nghiệm native-like, không cần app store |
| Breakpoint thiết kế theo thứ tự: `mobile → tablet → desktop`       | **P2** | Viết CSS mobile trước, dùng `md:` / `lg:` để mở rộng           |
| Màn hình tham chiếu chính: `390px` (iPhone 14)                     | **P2** | Chiếm phần lớn thiết bị khách hàng Việt Nam                    |
| Hỗ trợ tablet (`768px`): layout 2 cột cho menu                     | **P2** | Owner có thể dùng iPad để xem dashboard                        |
| Offline fallback cho trang menu (Service Worker cache)             | **P2** | Khách mở lại khi mất mạng vẫn thấy menu                        |
| Desktop (`1280px`+): dashboard owner hiển thị đầy đủ sidebar       | **P3** | Owner ít khi dùng desktop, không phải ưu tiên MVP              |

### Responsive Breakpoints (Tailwind)

| Tên         | Giá trị    | Mục tiêu                     |
| :---------- | :--------- | :--------------------------- |
| _(default)_ | `< 768px`  | Mobile — màn hình khách hàng |
| `md:`       | `≥ 768px`  | Tablet — iPad owner          |
| `lg:`       | `≥ 1024px` | Desktop — dashboard mở rộng  |

## 6. Nguyên tắc thiết kế (Principles)

- **Sự thoáng đãng (Whitespace):** Tăng khoảng cách giữa các phần để tạo sự thoải mái cho mắt.
- **Tính chuyển động (Motion):** Sử dụng các hiệu ứng "bay vào giỏ hàng" (Fly-to-cart) và thanh tiến trình sinh động.
- **Tính nhất quán:** Toàn bộ biểu tượng (Icons) phải đồng bộ về độ dày nét và phong cách bo góc.
- **Không hỗ trợ Dark Mode:** App chỉ có light theme. Toàn bộ màu sắc được định nghĩa cho nền sáng.

## 7. Screens Reference

> Ảnh thiết kế export từ Stitch — lưu tại `docs/design-system/screens/`

### Phase 1 — MVP (Khách)

| Menu v1                                          | Menu v2                                          | Product Detail                                                   |
| ------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------- |
| ![menu_1](docs/design-system/screens/menu_1.png) | ![menu_2](docs/design-system/screens/menu_2.png) | ![product_detail](docs/design-system/screens/product_detail.png) |

| Cart                                         | Order Success                                                  | Track Order                                                    |
| -------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| ![cart](docs/design-system/screens/cart.png) | ![order_success](docs/design-system/screens/order_success.png) | ![track_order_1](docs/design-system/screens/track_order_1.png) |

### Phase 1 — MVP (Owner)

| Login                                          | Dashboard                                              | Order Detail                                                 |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| ![login](docs/design-system/screens/login.png) | ![dashboard](docs/design-system/screens/dashboard.png) | ![order_detail](docs/design-system/screens/order_detail.png) |

| Product List                                                             | Product Form                                                             | Category                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| ![admin_product_list](docs/design-system/screens/admin_product_list.png) | ![admin_product_form](docs/design-system/screens/admin_product_form.png) | ![admin_category_list](docs/design-system/screens/admin_category_list.png) |

### Phase 2 — Operations

| Revenue                                            | Order History                                                  | QR Code                                                        | Settings                                             |
| -------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| ![revenue](docs/design-system/screens/revenue.png) | ![order_history](docs/design-system/screens/order_history.png) | ![admin_qr_code](docs/design-system/screens/admin_qr_code.png) | ![settings](docs/design-system/screens/settings.png) |

### Phase 3 — Loyalty

| Loyalty Dashboard                                                      | Loyalty Card                                                 | Voucher                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ![loyalty_dashboard](docs/design-system/screens/loyalty_dashboard.png) | ![loyalty_card](docs/design-system/screens/loyalty_card.png) | ![voucher_management](docs/design-system/screens/voucher_management.png) |

### Phase 4 — Gamification

| Lucky Wheel                                                | Secret Menu                                                | Quiz                                                   | Leaderboard                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| ![lucky_wheel](docs/design-system/screens/lucky_wheel.png) | ![secret_menu](docs/design-system/screens/secret_menu.png) | ![quiz_game](docs/design-system/screens/quiz_game.png) | ![leaderboard](docs/design-system/screens/leaderboard.png) |

### Empty States & Errors

| Cart Empty                                               | Menu Empty                                               | 404                                        | Network Error                                                  | Server Error                                                 |
| -------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------ |
| ![cart_empty](docs/design-system/screens/cart_empty.png) | ![menu_empty](docs/design-system/screens/menu_empty.png) | ![404](docs/design-system/screens/404.png) | ![network_error](docs/design-system/screens/network_error.png) | ![server_error](docs/design-system/screens/server_error.png) |

### Loading & Skeleton

| Loading                                            | Menu Skeleton                                                  | Dashboard Skeleton                                                       |
| -------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| ![loading](docs/design-system/screens/loading.png) | ![skeleton_menu](docs/design-system/screens/skeleton_menu.png) | ![skeleton_dashboard](docs/design-system/screens/skeleton_dashboard.png) |
