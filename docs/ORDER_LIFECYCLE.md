# Order Lifecycle

## Vòng đời đầy đủ

```
                    ┌─────────────────────────────────────────────┐
                    │               Khách submit                   │
                    └──────────────────┬──────────────────────────┘
                                       ↓
                              ┌────────────────┐
                              │   [new]        │  ← order vừa tạo
                              │ order_code sinh│
                              │ wait_estimate  │
                              └────────┬───────┘
                                       │
               ┌───────────────────────┼────────────────────────┐
               ↓                       ↓                        │
     Owner bấm "Bắt đầu"     Khách/Owner bấm "Huỷ"            │
               ↓                       ↓                        │
      ┌────────────────┐     ┌──────────────────┐              │
      │   [making]     │     │   [cancelled]    │              │
      │ Đang pha chế   │     │ Đơn bị huỷ       │              │
      └────────┬───────┘     └──────────────────┘              │
               │                                                 │
               ↓                                                 │
     Owner bấm "Xong"                                           │
               ↓                                                 │
      ┌────────────────┐                                         │
      │   [done]       │ ←───────────────────────────────────────┘
      │ Khách lấy đồ   │   (không thể từ new → done trực tiếp)
      └────────────────┘
```

## Trạng thái

| Status | Ý nghĩa | Ai thấy |
|---|---|---|
| `new` | Vừa đặt, chờ xử lý | Khách: "Đang chờ xác nhận" / Owner: tab Đang chờ |
| `making` | Owner đang pha chế | Khách: "Đang pha chế" / Owner: tab Đang làm |
| `done` | Đồ đã xong | Khách: "Xong rồi, lấy tại quầy!" / Owner: tab Xong |
| `cancelled` | Đơn bị huỷ | Khách: "Đơn đã bị huỷ" / Owner: tab Xong |

## Transition hợp lệ

| Từ | Sang | Ai thực hiện |
|---|---|---|
| `new` | `making` | Owner |
| `making` | `done` | Owner |
| `new` | `cancelled` | Owner hoặc Khách |

## Transition KHÔNG hợp lệ

| Transition | Lý do |
|---|---|
| `making` → `new` | Không đổi ngược |
| `making` → `cancelled` | Đã bắt tay làm rồi |
| `done` → bất kỳ | Terminal state |
| `cancelled` → bất kỳ | Terminal state |

Tất cả invalid transition trả về lỗi `INVALID_STATUS_TRANSITION`.

---

## Dữ liệu snapshot

Khi order được tạo, các trường sau được **snapshot** và **bất biến**:

| Trường | Lý do snapshot |
|---|---|
| `order_items.product_name` | Product có thể bị đổi tên sau |
| `order_items.unit_price` | Product có thể đổi giá sau |
| `order_items.selected_options` | Options có thể bị sửa/xoá |
| `orders.total_amount` | Tổng tiền không thay đổi sau submit |

→ Lịch sử order luôn phản ánh đúng những gì khách đã đặt tại thời điểm đó.

---

## Order Code

- Sinh bởi **DB function** trong transaction — không bao giờ duplicate
- Format: `A001`→`A999`→`B001`→`B999`→...→`Z999`
- Reset mỗi ngày lúc 00:00 (dựa vào `DATE(created_at) = CURRENT_DATE`)
- Tổng capacity: 26 × 999 = **25,974 orders/ngày** — quá đủ cho quán cafe solo
- Dùng để gọi khách khi xong đồ

---

## Wait Estimate

Tính tại thời điểm submit:

```
pending_ahead = COUNT(orders WHERE status IN ('new','making') AND created_at < current_order.created_at)
wait_minutes  = pending_ahead × 3
range_min     = max(wait_minutes, 3)
range_max     = range_min + 5
display       = "Khoảng {range_min}-{range_max} phút"
```

**Ví dụ**: 3 orders đang chờ trước → `3 × 3 = 9 phút` → hiển thị "Khoảng 9-14 phút"

Nếu không có order nào trước: "Khoảng 3-8 phút" (1 đồ đầu tiên).

> Chỉ là ước tính, không cam kết. Owner có thể pha nhanh hơn hoặc chậm hơn.

---

## Cancel Security

Khách cancel bằng `order_code` — không cần token riêng ở Phase 1.

| Phase | Cơ chế | Lý do |
|---|---|---|
| Phase 1 | Cancel bằng `order_code` | Simple, đủ an toàn (~25k codes/ngày) |
| Phase 2+ | Thêm `cancel_token` UUID riêng | Nếu cần bảo mật cao hơn |

Rủi ro Phase 1: người biết `order_code` của người khác có thể cancel order đó. Thực tế: codes reset mỗi ngày + format sequential → không dễ đoán trong context quán nhỏ.
