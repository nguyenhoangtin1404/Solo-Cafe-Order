# Báo cáo thị trường: QR Ordering & POS Cafe Take-Away
## Đối thủ cạnh tranh của Vibe Coffee

> Tổng hợp từ 5 nguồn nghiên cứu độc lập · Cập nhật tháng 5/2026  
> Phạm vi: Solo operator · Take-away · Thị trường Việt Nam

---

## Tóm tắt nhanh (TL;DR)

| Kết luận | Chi tiết |
|---|---|
| **Đối thủ free mạnh nhất** | GloriaFood (global) · POS365 (VN) |
| **Đối thủ trả phí rẻ nhất VN** | MISA CukCuk 199k/tháng |
| **Nền tảng nguy hiểm nhất** | GrabFood/ShopeeFood: cắn 25–40% doanh thu |
| **Tính năng không ai có** | Order tracking page + wait estimate + take-away-first flow |
| **Lợi thế tự build** | $0 commission · 100% data · custom workflow · break-even tháng 1 |

---

## 1. Bản đồ thị trường

Chia làm 4 nhóm theo mô hình kinh doanh:

```
                    KHÔNG HOA HỒNG
                          ↑
    Tự build ─────────────●─────── GloriaFood
    (Vibe Coffee)         │        POS365 free
                          │        Loyverse free
  KHÔNG          ─────────┼─────────────────── CÓ
  TÙY CHỈNH               │               TÙY CHỈNH
                    KiotViet ●
                    CukCuk ●   ● iPOS
                          │
            GrabFood ─────●───── ShopeeFood
                          ↓
                    CÓ HOA HỒNG (25–30%)
```

---

## 2. Bảng so sánh tổng thể

| Công cụ | Phí/tháng | Hoa hồng | QR self-order | Realtime | Tiếng Việt | Data khách | Order tracking | Solo take-away |
|---|---|---|---|---|---|---|---|---|
| **GrabFood** | 0 (setup 1,2tr) | **25–30%** | ✗ app riêng | ✓ | ✓ | ✗ platform giữ | ✗ | ✗ |
| **ShopeeFood** | 0 | **25%** | ✗ app riêng | ✓ | ✓ | ✗ platform giữ | ✗ | ✗ |
| **Square Free** | $0 | 0% + 3.3%+$0.30/tx | ✓ cơ bản | ⚠ Plus mới có | ✗ | ✓ | ✗ | ⚠ Chỉ US |
| **Square Plus** | $49/tháng | 0% + 2.9%+$0.30/tx | ✓ đầy đủ | ✓ | ✗ | ✓ | ✗ | ⚠ Chỉ US |
| **Toast Starter** | $0 (hardware $500+) | 0% + 3.5%+$0.15/tx | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ Chỉ US |
| **GloriaFood** | **$0 mãi mãi** | **0%** (payment: 2%) | ✓ | ✓ mobile app | **✓** | ✓ | ✗ | ✓ Tốt nhất global free |
| **MenuTiger Free** | $0 (200 đơn/tháng) | 0% | ✓ | ✓ | ⚠ chưa rõ | ✓ | ✗ | ⚠ giới hạn |
| **MenuTiger Regular** | $38/tháng | 0% | ✓ | ✓ | ⚠ chưa rõ | ✓ | ✗ | ⚠ |
| **KiotViet FnB** | 250–490k VND/tháng | 0% | ✓ tại bàn | ✓ | ✓ | ✓ | ✗ | ⚠ table-focused |
| **MISA CukCuk** | **199–499k VND/tháng** | 0% | ✓ | ✓ KDS | ✓ | ✓ | ✗ | ✓ Tốt nhất VN trả phí |
| **iPOS FABi** | 92–569k VND/tháng | 0% | ✓ + pre-pay | ✓ KDS mạnh | ✓ | ✓ | ✗ | ✓ |
| **POS365** | **0 → 179k VND/tháng** | 0% | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| **Loyverse** | $0 core | 0% | **✗ không có** | ✓ cơ bản | ✓ UI | ✓ | ✗ | ✗ (chỉ POS staff) |
| **🔥 Vibe Coffee** | **~0–25$/tháng infra** | **0%** | **✓ custom** | **✓ Supabase RT** | **✓ 100%** | **✓ 100%** | **✓ DUY NHẤT** | **✓✓✓** |

---

## 3. Phân tích chi tiết

---

### 3.1 Nền tảng giao đồ ăn — GrabFood & ShopeeFood

#### Chi phí thực tế (VN 2025–2026)

| | GrabFood | ShopeeFood |
|---|---|---|
| Hoa hồng | **25–30%/đơn** (đang tăng) | **25%/đơn** (đồ ăn/uống) |
| Setup | ~1,200,000 VND (HCM & HN) | Miễn phí |
| Quảng cáo in-app để duy trì thứ hạng | +10–20% doanh thu | tương tự |
| **Tổng chi phí thực** | **35–45%/đơn** | **~35%/đơn** |
| Market share VN | ~50% | ~40% |

**Baemin:** Đã rút khỏi Việt Nam tháng 12/2023 sau 4 năm thua lỗ.

#### Vấn đề cốt lõi: Không sở hữu data khách hàng
- Platform giữ toàn bộ: SĐT, lịch sử order, sở thích, địa chỉ
- Merchant chỉ nhận thông tin từng đơn — không thể liên lạc lại
- Rời platform = mất toàn bộ quan hệ khách hàng đã xây dựng

#### Khi nào nên dùng song song
✓ Muốn tiếp cận khách mới qua delivery (khách chưa biết đến quán)  
✗ **Không cần thiết cho take-away** — khách đã ở tại quán, platform không tạo thêm giá trị nhưng vẫn lấy 25–30%

---

### 3.2 SaaS Quốc tế

#### Square for Restaurants (Mỹ)
- **Free:** QR ordering cơ bản, unlimited items, xử lý thanh toán 3.3% + $0.30/tx
- **Plus ($49/tháng):** Realtime KDS, floor plan, advanced reporting, phí tx 2.9% + $0.30
- **⚠ Không khả dụng tại Việt Nam** — không hỗ trợ VND, không có VNPay/MoMo/ZaloPay

#### Toast POS (Mỹ)
- **Starter:** $0/tháng phần mềm nhưng **hardware bắt buộc $500–$1,000+**
- **Processing:** 3.5% + $0.15/tx online — đắt nhất trong nhóm
- **Tổng thực tế:** $300–$700+/tháng khi tính đủ
- **⚠ Không khả dụng tại Việt Nam** — chỉ hoạt động ở thị trường Mỹ

#### GloriaFood ⭐ Free tốt nhất toàn cầu
- **Miễn phí mãi mãi:** Unlimited đơn, 0% commission, QR ordering, quản lý menu
- **Trả thêm:** Online payment (2%), branded app ($59/tháng), website ($9/tháng)
- **Notification:** Push qua Android/iOS app — không có web dashboard
- **Tiếng Việt:** ✓ Được xác nhận (menu customer-facing)
- **⚠ Rủi ro 2025–2026:** Oracle mua lại → support chậm nghiêm trọng, ticket mất 1+ tuần

#### MenuTiger (QR Tiger)
- **Free:** 200 đơn/tháng, 1 cửa hàng, 10 QR codes, 49 items max, có branding
- **Regular (~$38/tháng):** Unlimited đơn, unlimited items, no branding
- **Commission:** 0% trên mọi plan
- **Tiếng Việt:** Chưa xác nhận (19 ngôn ngữ, VN chưa rõ)
- **Đánh giá:** Phù hợp test miễn phí, nhưng 200 đơn/tháng quá ít

---

### 3.3 Phần mềm Việt Nam

#### MISA CukCuk ⭐ Rẻ nhất trong nhóm trả phí VN

| Gói | Giá/tháng | Tính năng nổi bật |
|---|---|---|
| Standard | **199,000 VND** | POS đầy đủ, QR gọi món, menu, báo cáo, nhân viên |
| Professional | **299,000 VND** | + Kế toán, nhập kho, công nợ |
| Enterprise | **499,000 VND** | + CRM (MISA Lomas) |

- QR ordering: ✓ khách scan → chọn → gửi về bếp
- Realtime KDS, tích hợp hóa đơn điện tử (NĐ70/2025)
- Thương hiệu MISA uy tín, hoạt động lâu dài tại VN
- Hỗ trợ 24/7
- **Hạn chế:** Thiết kế cho table service, không có order tracking page cho khách

#### KiotViet FnB

| Gói | Giá/tháng | Ghi chú |
|---|---|---|
| Hỗ trợ | **250,000 VND** | 1 thiết bị |
| Chuyên nghiệp | **310,000 VND** | Phổ biến nhất |
| Cao cấp | **490,000 VND** | Đa chi nhánh |

- Cộng đồng lớn nhất VN: 200,000+ cửa hàng
- Tích hợp GrabFood + ShopeeFood (từ 6/2025)
- QR gọi món, quản lý kho, hóa đơn điện tử
- **Hạn chế:** Focus tại bàn, chưa tối ưu take-away scan-and-go

#### iPOS FABi

| Gói | Giá |
|---|---|
| FABiBox (basic) | **Miễn phí** + hardware 5.9tr VND |
| Thuê bao năm | **~91,600 VND/tháng** (~1.1tr/năm) |
| Thuê bao tháng | **569,000 VND/tháng** |

- QR ordering mạnh nhất nhóm VN: **hỗ trợ pre-payment qua MoMo/ZaloPay ngay trên phone khách**
- KDS, PDA cầm tay
- **Hạn chế:** Phức tạp nhất, learning curve cao

#### POS365

| Gói | Giá |
|---|---|
| **Miễn phí** | Vĩnh viễn (tính năng cơ bản) |
| Năm | **~179,000 VND/tháng** (~2.1tr/năm) |
| Trọn đời | 8.58tr VND một lần |

- Có gói miễn phí vĩnh viễn — duy nhất trong nhóm POS VN có QR order free
- 120,000+ người dùng từ 2017
- **Hạn chế:** Cộng đồng nhỏ hơn KiotViet, realtime kém hơn iPOS

#### Loyverse (Quốc tế)
- Core POS: **Miễn phí vĩnh viễn**, không giới hạn sản phẩm/đơn
- **⚠ Không có QR self-order** — chỉ là POS cho nhân viên dùng
- Hoạt động offline, chạy trên smartphone
- Không tích hợp MoMo/VietQR/hóa đơn điện tử VN

---

## 4. Phân tích tài chính

### Scenario thực tế: 200 đơn/tháng × 80,000 VND/đơn = 16,000,000 VND doanh thu

| Lựa chọn | Chi phí/tháng | Còn lại | Ghi chú |
|---|---|---|---|
| GrabFood (25%) | **4,000,000 VND** commission + ~2,000,000 ads | ~10,000,000 VND | Mất 37.5% |
| ShopeeFood (25%) | **4,000,000 VND** commission | ~12,000,000 VND | Mất 25% |
| Toast (US, $0 plan) | ~**3,000,000 VND** processing fees | ~13,000,000 VND | Chỉ Mỹ |
| Square Plus (US) | ~**1,800,000 VND** ($49 + processing) | ~14,200,000 VND | Chỉ Mỹ |
| iPOS FABi (tháng) | **569,000 VND** | ~15,431,000 VND | — |
| KiotViet Chuyên nghiệp | **310,000 VND** | ~15,690,000 VND | — |
| MISA CukCuk Standard | **199,000 VND** | ~15,801,000 VND | Rẻ nhất trả phí |
| POS365 | **0–179,000 VND** | ~15,821,000–16,000,000 VND | Có free tier |
| GloriaFood | **0 VND** (hoặc 2% nếu online pay) | ~15,680,000–16,000,000 VND | Rủi ro Oracle |
| **Vibe Coffee (tự build)** | **~0–620,000 VND** infra | **~15,380,000–16,000,000 VND** | **0% commission** |

### Break-even với GrabFood
Nếu bỏ ra **20,000,000 VND** thời gian tự build hệ thống:
- Tiết kiệm so với GrabFood: ~4,000,000 VND/tháng (chỉ commission, chưa tính ads)
- **Hoàn vốn sau: 5 tháng**
- Sau 12 tháng: tiết kiệm **~48,000,000 VND**

---

## 5. Tính năng quan trọng không có ở bất kỳ SaaS nào

Đây chính xác là lý do tự build Vibe Coffee có giá trị:

| Tính năng | Vibe Coffee | Thị trường |
|---|---|---|
| **Order tracking page cho khách** (theo order_code realtime) | ✓ | ✗ Không ai có |
| **Wait estimate theo queue** (queue × 3 phút, hiển thị range) | ✓ | ✗ Không ai có |
| **Take-away-first flow** (scan → order → đi, không cần table number) | ✓ | ⚠ Hầu hết focus tại bàn |
| **Order code format tùy chỉnh** (A001→A999, reset hàng ngày) | ✓ | ✗ SaaS dùng mã riêng |
| **Pickup name** (chủ quán gọi tên khi xong) | ✓ | ✗ |
| **Loyalty schema sẵn sàng từ ngày 1** (customer_ref) | ✓ | Phải trả thêm |
| **Gamification** (Phase 4: lucky wheel, secret menu) | Roadmap | Không ai có |

---

## 6. Kết luận & Khuyến nghị

### ✅ Tự build Vibe Coffee là quyết định đúng

**Tài chính:** Break-even với GrabFood trong 5 tháng. Sau đó tiết kiệm 4–6tr VND/tháng vĩnh viễn.

**Workflow fit:** Không có phần mềm nào trên thị trường tối ưu cho "solo operator + QR take-away + realtime + wait estimate" theo cách Vibe Coffee cần.

**Data sovereignty:** 100% data khách hàng thuộc về bạn — nền tảng giao đồ ăn dùng đây như con tin.

**Không vendor lock-in:** Baemin rời VN 12/2023. Oracle mua GloriaFood, support xấu đi. Bất kỳ SaaS nào cũng có thể thay đổi giá hoặc đóng cửa.

**Tương lai:** Schema đã có sẵn loyalty + gamification. Các SaaS phải trả thêm phí add-on cho những tính năng này.

### Khi nào nên dùng SaaS thay vì tự build

| Tình huống | Tool phù hợp |
|---|---|
| Cần chạy ngay trong vài giờ, chưa có dev time | GloriaFood (global) hoặc POS365 (VN) |
| Cần báo cáo kế toán tích hợp VN | MISA CukCuk |
| Cần cộng đồng hỗ trợ lớn nhất VN | KiotViet |
| Muốn khách pre-pay ngay trên phone | iPOS FABi |
| Có **delivery** (giao tận nơi) cần customer acquisition | GrabFood/ShopeeFood (chỉ dùng song song, không thay thế) |
| Mở rộng 3+ chi nhánh | Square / Toast (nếu mở rộng sang thị trường quốc tế) |

### Ưu tiên bổ sung để vượt GloriaFood (đối thủ free mạnh nhất)

| Tính năng GloriaFood có | Vibe Coffee cần làm | Phase |
|---|---|---|
| Mobile push notification cho owner | PWA + Web Push API | 1 |
| Online payment | Tích hợp VNPay/MoMo | 2 |
| Báo cáo doanh thu | Revenue dashboard | 2 |

---

---

## 7. Cơ hội mở rộng — Vibe Coffee as SaaS

> Từ internal tool → platform bán cho các solo cafe khác

### Moat cốt lõi

Vibe Coffee có lợi thế không ai có: **thiết kế cho solo operator, không nhân viên, mọi thứ tự động**. KiotViet/CukCuk không thể pivot về đây vì họ đã quá lớn và phức tạp. Thị trường địa chỉ: **~120,000+ quán cafe nhỏ tại Việt Nam**.

---

### 7.1 Multi-tenancy — Nền tảng SaaS

| Tính năng | Mô tả | Mức độ |
|---|---|---|
| **Subdomain routing** | `[ten-quan].vibecoffee.app` — mỗi quán 1 link riêng | Bắt buộc |
| **Custom domain** | Trỏ `order.tenquan.com` về hệ thống | Pro plan |
| **Onboarding < 5 phút** | Tạo quán → upload menu → có QR ngay | Bắt buộc |
| **Menu template** | 50+ template menu VN phổ biến chọn 1 click | Growth hack |
| **QR auto-generate** | QR có logo quán, xuất PDF/PNG in ngay | Bắt buộc |

---

### 7.2 AI Features — Điểm khác biệt tuyệt đối

Không SaaS VN nào đang làm tốt điều này:

| Tính năng | Mô tả |
|---|---|
| **AI setup menu từ ảnh** | Chụp bảng menu → AI điền tên, mô tả, giá gợi ý tự động |
| **AI viết mô tả sản phẩm** | Upload ảnh cốc cà phê → AI tự viết copy hấp dẫn |
| **AI daily insight** | "Hôm nay bán chạy: Cà phê sữa đá (47 ly). Cao điểm: 7–9h sáng." |
| **AI smart wait estimate** | Học theo lịch sử thực tế từng quán, không chỉ queue × 3 phút |
| **AI giá gợi ý** | "Quán tương tự khu vực bán Bạc xỉu 30–40k. Giá bạn: 25k — có thể tăng?" |
| **AI busy mode** | Tự phát hiện giờ cao điểm, tự động thêm buffer vào wait estimate |

---

### 7.3 Operations — Tiết kiệm thời gian chủ quán

| Tính năng | Mô tả |
|---|---|
| **One-tap sold out** | Nút đỏ to trên dashboard — hết hàng trong 2 giây |
| **Scheduled menu** | Sản phẩm tự ẩn/hiện theo giờ (sinh tố chỉ bán 7–11h sáng) |
| **Prep time per item** | Phin 5 phút, đá xay 2 phút → wait estimate chính xác hơn |
| **Busy mode manual** | Chủ bật "đang bận" → wait estimate tự tăng |
| **Holiday/closing** | Lên lịch đóng cửa, khách không order được khi quán đóng |
| **Multi-device sync** | Điện thoại + tablet cùng nhận đơn realtime |
| **Sound alerts tùy chỉnh** | Chọn âm thanh thông báo đơn mới |

---

### 7.4 Loyalty — Tạo khách quen

| Tính năng | Mô tả | Ghi chú |
|---|---|---|
| **Digital stamp card** | Mua 9 tặng 1 — không cần app, link QR riêng | Viral tự nhiên |
| **Points accumulation** | Mỗi đơn tích điểm, đổi voucher | `customer_ref` đã sẵn sàng trong schema |
| **Birthday reward** | Tự động gửi voucher ngày sinh nhật khách | |
| **VIP tier** | Khách chi > X triệu/tháng được ưu đãi riêng | |
| **Push notification broadcast** | Chủ quán gửi: "Hôm nay có Cold Brew mới!" | |

---

### 7.5 Network Effect — Từ SaaS → Ecosystem

| Tính năng | Mô tả | Tác động |
|---|---|---|
| **Tìm quán Vibe Coffee** | Directory: map + danh sách quán gần tôi | Khách nhận diện thương hiệu Vibe |
| **"Powered by Vibe Coffee" badge** | Logo nhỏ trên menu page → link đăng ký | Viral loop: mỗi khách là quảng cáo |
| **Customer universal profile** | 1 tài khoản theo dõi đơn ở nhiều quán | Lock-in cả 2 phía |
| **Inter-cafe referral** | Giới thiệu 1 quán mới → free 1 tháng | Acquisition cost $0 |
| **Vibe Coffee community** | Forum chủ quán chia sẻ kinh nghiệm, recipe | Retention |

---

### 7.6 Marketing Tools

| Tính năng | Mô tả |
|---|---|
| **QR print kit** | Template table tent, sticker, poster A4 — tải PDF in ngay |
| **Promo code** | Tạo mã giảm giá, chia sẻ Facebook/Zalo |
| **Flash sale** | Sản phẩm giảm giá trong X giờ — countdown cho khách |
| **Social proof** | "47 người đã order hôm nay" trên menu |
| **Review collection** | Sau lấy đơn, khách nhận link đánh giá 1 click |

---

### 7.7 Revenue Model đề xuất

```
FREE (mãi mãi)
├── 1 quán · 50 đơn/ngày · Vibe Coffee branding
├── QR menu + ordering cơ bản
└── Dashboard realtime

STARTER — 99,000 VND/tháng
├── Unlimited đơn
├── Xoá Vibe Coffee branding
├── Analytics 30 ngày
└── Custom QR design

PRO — 249,000 VND/tháng
├── Tất cả Starter
├── AI menu builder + AI insights
├── Loyalty (stamp card + points)
├── Scheduled menu + busy mode
└── Custom domain

GROWTH — 499,000 VND/tháng
├── Tất cả Pro
├── Multi-device (3 thiết bị)
├── Push notification broadcast
├── Flash sale + promo code
└── Priority support
```

---

### 7.8 Tiềm năng tài chính

| Scenario | Số quán | ARPU | Doanh thu/tháng |
|---|---|---|---|
| Early | 1,000 quán | 99,000 VND | **99 triệu VND** (~$4,000) |
| Growth | 1,000 quán | 249,000 VND | **249 triệu VND** (~$10,000) |
| Scale | 5,000 quán | 149,000 VND | **745 triệu VND** (~$30,000) |

Việt Nam có **~120,000+ quán cafe nhỏ** — thị trường địa chỉ rất lớn.

---

### 7.9 Roadmap mở rộng

```
Hiện tại  → MVP 1 quán (Phase 1 — đang build)
+3 tháng  → Multi-tenancy + onboarding < 5 phút
+6 tháng  → AI menu builder (killer feature để acquire)
+9 tháng  → Loyalty + push notification
+12 tháng → Network effect: directory + universal profile
+18 tháng → Raise hoặc bootstrap profitably
```

**Killer feature để acquire:** AI setup menu từ ảnh — solo owner không có thời gian nhập liệu. Nếu AI làm thay trong 2 phút, rào cản onboarding gần như về 0.

---

## Nguồn tham khảo

### Việt Nam
- [GrabFood commission cao — Vietnam Investment Review](https://vir.com.vn/grabfood-may-be-disadvantaged-by-high-commission-rates-69110.html)
- [ShopeeFood phí chiết khấu — ShopeeFood Uni (chính thức)](https://merchant.shopeefood.vn/edu/article/phi-mo-gian-hang-va-chiet-khau-tren-shopeefood-la-bao-nhieu)
- [So sánh chiết khấu GrabFood/ShopeeFood — KiotViet](https://www.kiotviet.vn/so-sanh-chiet-khau-va-chi-phi-dang-ky-ban-hang-tren-shopeefood-grabfood-gofood-baemin-cap-nhat-2023/)
- [Baemin rời VN — VietData](https://www.vietdata.vn/post/the-online-food-delivery-industry-in-vietnam-baemin-exits-market-after-4-years-of-losses)
- [MISA CukCuk bảng giá](https://www.cukcuk.vn/bang-gia/)
- [KiotViet điều chỉnh giá 5/2025](https://www.kiotviet.vn/kiotviet-thong-bao-dieu-chinh-gia-ban-san-pham-phan-mem-quan-ly-ban-hang/)
- [iPOS FABi điều chỉnh giá 6/2025](https://ipos.vn/thong-bao-dieu-chinh-gia-thue-bao-ipos-fabi/)
- [iPOS QR O2O](https://ipos.vn/phut-mot-goi-mon-bang-qr-code/)
- [POS365 bảng giá](https://www.pos365.vn/phi-dich-vu)
- [Vietnam food delivery market 2025 — Vietnam Briefing](https://www.vietnam-briefing.com/news/vietnams-food-delivery-services-sector-opportunities-and-challenges.html/)

### Quốc tế
- [GloriaFood pricing](https://www.gloriafood.com/pricing)
- [GloriaFood Vietnamese support](https://www.gloriafood.com/gloriafood-translation)
- [MenuTiger pricing](https://www.menutiger.com/pricing)
- [Square for Restaurants pricing](https://squareup.com/us/en/point-of-sale/restaurants/pricing)
- [Toast pricing](https://pos.toasttab.com/pricing)
- [Build vs Buy restaurant software — Olo](https://www.olo.com/blog/build-vs-buy-restaurant-software-debate-top-5-considerations)
- [True costs DIY vs third-party ordering — infi.us](https://www.infi.us/post/the-true-costs-of-online-ordering-diy-vs-third-party-platforms)
- [Loyverse POS pricing](https://loyverse.com/pricing)
- [Commission-free ordering — Restolabs](https://www.restolabs.com/blog/advantages-food-ordering-system-restaurants)
