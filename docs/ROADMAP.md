# Roadmap

---

## Phase 1 — QR Menu MVP (~3 tuần)

**Goal**: Khách scan QR → gửi order → xem tracking → owner nhận realtime → quản lý menu cơ bản.

### Tasks

**Tuần 1 — Foundation**
- [ ] #1 Setup Next.js + TailwindCSS + Supabase + shadcn/ui
- [ ] #2 DB schema + migrations + seed data (~10 sản phẩm mẫu)
- [ ] #3 Owner auth — Supabase Auth login page (`/login`)
- [ ] #4 Middleware bảo vệ `/dashboard` và `/admin` (dùng `@supabase/ssr`)

**Tuần 2 — Customer Flow**
- [ ] #5 Menu page (public, mobile-first, category tabs)
- [ ] #6 Product card + detail modal + options
- [ ] #7 Cart logic (localStorage, validate availability khi submit)
- [ ] #8 Submit order API (`POST /api/orders` + rate limiting + wait estimate)
- [ ] #9 Order success screen (order_code, pickup_name, items, wait_estimate)
- [ ] #10 Order tracking page `/order/[code]` (realtime status + cancel button)

**Tuần 3 — Owner Flow + Polish**
- [ ] #11 Realtime dashboard (Supabase Realtime, âm thanh khi order mới, tab filter)
- [ ] #12 Order status update (`PATCH /api/orders/:id/status`)
- [ ] #13 Basic admin panel (list products, toggle availability, add/edit product, upload ảnh)
- [ ] #14 Deploy to Vercel + staging environment
- [ ] #15 Smoke test + fix bugs

### Acceptance Criteria (Phase 1 Done)

- [ ] Khách scan QR → gửi order thành công < 60 giây
- [ ] Order success screen hiển thị `wait_estimate` đúng theo queue
- [ ] Khách vào `/order/[code]` xem được status realtime
- [ ] Khách cancel được order khi status = `new`
- [ ] Dashboard nhận order mới realtime < 2 giây + phát âm thanh
- [ ] Dashboard filter đúng theo tab (Đang chờ / Đang làm / Xong)
- [ ] Owner đổi được status `new → making → done`
- [ ] Owner bật/tắt món từ admin panel, menu cập nhật ngay
- [ ] 2 đơn submit đồng thời → không duplicate `order_code`
- [ ] Rate limit > 10 req/phút → 429
- [ ] Hoạt động trên iOS Safari + Android Chrome

---

## Phase 2 — Operations (~2 tuần)

**Goal**: Giảm stress vận hành hàng ngày.

### Tasks

- [ ] Daily revenue summary (tổng doanh thu hôm nay trên dashboard)
- [ ] Print / share QR code (generate từ `NEXT_PUBLIC_APP_URL/menu`)
- [ ] Mobile optimization pass (Lighthouse score ≥ 90)
- [ ] Error boundary + offline detection UI
- [ ] `updated_at` + audit log cơ bản cho orders

### Acceptance Criteria (Phase 2 Done)

- [ ] Owner xem doanh thu hôm nay trên dashboard
- [ ] QR code in ra được / share được link
- [ ] UI không crash khi mất mạng (hiển thị thông báo)
- [ ] Lighthouse mobile score ≥ 90 trên `/menu`

---

## Phase 3 — Loyalty (~3 tuần)

**Goal**: Tăng retention khách hàng.

> **Note**: `customer_ref` có sẵn từ Phase 1 (nullable). Phase 3 chỉ populate — không breaking change.

### Tasks

- [ ] Customer soft identity (phone number optional khi order)
- [ ] Point system (earn points per order)
- [ ] Voucher / discount code
- [ ] Buy X get Y
- [ ] Customer order history (tra cứu qua phone)

---

## Phase 4 — Gamification (~2 tuần)

**Goal**: Tăng trải nghiệm và viral.

### Tasks

- [ ] Lucky wheel sau khi order thành công
- [ ] Secret menu (unlock bằng code)
- [ ] Reward animation
- [ ] Mini game after order

---

## Out of Scope

```
Native mobile app
Multi-store / multi-tenant
Inventory management phức tạp
Offline sync
Staff management
Full accounting / ERP
AI recommendation
```
