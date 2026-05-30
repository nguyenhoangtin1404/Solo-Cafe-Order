# Roadmap

---

## Phase 1 — QR Menu MVP (~3 tuần)

**Goal**: Khách scan QR và gửi order được. Owner nhận realtime và quản lý menu cơ bản.

### Tasks

**Tuần 1 — Foundation**
- [ ] #1 Setup Next.js + TailwindCSS + Supabase + shadcn/ui
- [ ] #2 DB schema + migrations + seed data
- [ ] #3 Owner auth — Supabase Auth login page (`/login`)
- [ ] #4 Middleware bảo vệ `/dashboard` và `/admin` (dùng `@supabase/ssr`)

**Tuần 2 — Customer Flow**
- [ ] #5 Menu page (public, mobile-first, category tabs)
- [ ] #6 Product card + detail modal + options (size, topping)
- [ ] #7 Cart logic (localStorage, validate availability khi submit)
- [ ] #8 Submit order API (`POST /api/orders` + rate limiting)
- [ ] #9 Order success screen (order_code, pickup_name, items, total)

**Tuần 3 — Owner Flow + Polish**
- [ ] #10 Realtime dashboard (Supabase Realtime, reconnect khi mất mạng)
- [ ] #11 Order status update (`PATCH /api/orders/:id/status`)
- [ ] #12 Basic admin panel (list products, toggle availability, add/edit product)
- [ ] #13 Deploy to Vercel + staging environment
- [ ] #14 Smoke test + fix bugs

### Acceptance Criteria (Phase 1 Done)

- [ ] Khách scan QR → gửi order thành công < 60 giây
- [ ] Dashboard nhận order mới realtime < 2 giây
- [ ] Owner đổi được status `new → making → done`
- [ ] Owner bật/tắt món từ admin panel, menu cập nhật ngay
- [ ] 2 đơn đồng thời → không duplicate `order_code`
- [ ] Submit với product đã tắt → `PRODUCT_UNAVAILABLE`
- [ ] Rate limit: > 10 requests/phút → 429
- [ ] Hoạt động trên iOS Safari + Android Chrome (mobile)
- [ ] Middleware chặn `/dashboard` và `/admin` nếu chưa login

---

## Phase 2 — Operations (~2 tuần)

**Goal**: Giảm stress vận hành hàng ngày. Đủ dùng thực tế lâu dài.

### Tasks

- [ ] Daily revenue summary (tổng doanh thu hôm nay trên dashboard)
- [ ] Mobile optimization pass (Lighthouse score ≥ 90)
- [ ] Print / share QR code (generate QR image PNG/PDF)
- [ ] Error boundary + offline detection UI
- [ ] `updated_at` + basic audit log cho orders

### Acceptance Criteria (Phase 2 Done)

- [ ] Owner xem doanh thu hôm nay trên dashboard
- [ ] QR code in ra được / share được link
- [ ] UI không crash khi mất mạng (hiển thị thông báo, không white screen)
- [ ] Lighthouse mobile score ≥ 90 trên trang `/menu`

---

## Phase 3 — Loyalty (~3 tuần)

**Goal**: Tăng retention khách hàng.

> **Note**: `customer_ref` column đã có sẵn từ Phase 1 (nullable). Phase 3 chỉ populate — không breaking change.

### Tasks

- [ ] Customer soft identity (phone number optional khi order)
- [ ] Point system (earn points per order)
- [ ] Voucher / discount code (apply khi checkout)
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
Multi-store / multi-tenant (có thể revisit sau Phase 3)
Inventory management phức tạp
Offline sync
Staff management
Full accounting / ERP
AI recommendation
```
