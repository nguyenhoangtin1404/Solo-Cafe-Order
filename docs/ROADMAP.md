# Roadmap — Solo Cafe Order

---

## Phase 1 — QR Menu MVP (~3–4 tuần solo dev)

### Critical Path

```
#16 → #17 → #25 → #36 → #39 → #40 → #47 → #48   (customer submit flow)
#18 → #19 → #38 → #39                               (DB → orders)
#19 → #26 → #50 → #51                            (Realtime — risk cao nhất)
#117 → #118                                          (smoke test → deploy)
```

> **Rule cho solo dev:** Làm theo critical path trước. Parallel streams chỉ khi đang chờ (test chạy, build, review). Đừng context-switch quá nhiều trong 1 ngày.

---

### Week 1 — Foundation (M1)

**Mục tiêu cuối tuần:** DB migrate xong, API `/menu` trả data, owner login được.

| Ngày      | Focus                              | Issues                                                                                                            |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Day 1** | Project setup + DB schema products | #16 scaffolding, #18 migration categories/products, #21 Storage bucket                                               |
| **Day 2** | DB schema orders + Supabase client | #19 migration orders + order_code fn + trigger, #17 Supabase client + sanitize                                      |
| **Day 3** | DB policies + seed + types         | #20 RLS policies, #22 seed data, #26 Realtime publication, #23 types + Zod                                           |
| **Day 4** | Auth + service role + small setup  | #24 auth + middleware, #25 service role client, #115 bank env vars, #116 PWA manifest, #79 error pages, #78 redirect |
| **Day 5** | Product layer + API menu           | #36 product repo + service, #37 GET /api/menu                                                                     |

**M1 Checkpoint:**

- [x] `npm run dev` chạy
- [x] `GET /api/menu` trả categories + products (test bằng curl)
- [x] `/login` → redirect `/dashboard` (owner account đã tạo trên Supabase)
- [x] `/dashboard` không auth → redirect `/login`

---

### Week 2 — Core Order Loop Backend (M2 backend)

**Mục tiêu cuối tuần:** Toàn bộ API orders hoạt động, Realtime đã validate.

| Ngày       | Focus                                    | Issues                                                                                    |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Day 6**  | ⚡ Realtime spike + Order repo           | **#50 Realtime spike** (làm TRƯỚC — risk cao nhất), #38 order repository                 |
| **Day 7**  | Order service (business logic nặng nhất) | #39 order service (submitOrder, cancelOrder, updateStatus, wait_estimate)                 |
| **Day 8**  | Submit + Status APIs                     | #40 POST /api/orders (rate limit + bank_transfer_info), #41 PATCH status, #42 POST cancel |
| **Day 9**  | Tracking + Dashboard APIs + Tests        | #43 GET /api/orders/[code], #44 GET /api/orders (owner + pagination), #54 Jest unit tests |
| **Day 10** | Custom hooks                             | #45 useCart + useOrderQueue + useOrderTracking                                            |

**M2-backend Checkpoint:**

- [x] `POST /api/orders` → 201 với order_code + wait_estimate string
- [x] `POST /api/orders` lần 11/phút → 429 RATE_LIMITED
- [x] Supabase Dashboard: insert order → console log event trong < 2 giây (#50 spike pass)
- [x] `npm test` → OrderService tests pass

---

### Week 3 — Frontend + Admin + Ship (M2 frontend + M3)

**Mục tiêu cuối tuần:** App live trên Vercel, full flow từ QR đến dashboard.

| Ngày       | Focus                         | Issues                                                                                  |
| ---------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| **Day 11** | Menu page                     | #46 Menu page (CategoryTabs, MenuCard, ProductModal + options)                          |
| **Day 12** | Cart + Order success          | #47 Cart page (submit + payment_method radio), #48 Order success screen                 |
| **Day 13** | Tracking + Dashboard          | #49 Order tracking page (realtime + cancel), #51 Dashboard full (OrderCard + Realtime) |
| **Day 14** | Dashboard UX + Loading states | #52 Sound + filter tabs + title badge, #53 Loading/empty/error states                   |
| **Day 15** | Admin product                 | #76 Admin list + availability toggle, #111 Add/edit product                              |
| **Day 16** | Admin options + image         | #113 Options management, #114 Image upload                                                |
| **Day 17** | Admin category + smoke test   | #81 Category admin, #117 Smoke test checklist                                            |
| **Day 18** | Deploy                        | #118 Deploy to Vercel + env setup                                                        |

**M3 / Done Checkpoint:**

- [x] Scan QR `/` → `/menu` → thêm vào cart → submit → nhận order_code < 60 giây
- [x] Dashboard nhận order mới realtime < 2 giây + sound
- [x] Owner cập nhật status → tracking page khách cập nhật ngay
- [x] Upload ảnh product, toggle availability hoạt động
- [x] `npm run build` clean, Lighthouse PWA ≥ 80
- [ ] App live trên Vercel ← **pending #117 smoke test → #118 deploy**

---

### Parallel Streams (làm khi chờ)

| Khi đang chờ...          | Có thể làm song song                            |
| ------------------------ | ----------------------------------------------- |
| Build / test chạy        | Viết seed data, viết Zod schemas                |
| #39 order service (nặng) | #116 PWA manifest, #79 error pages, #78 redirect |
| Backend M2 xong          | #45 custom hooks (không cần API sẵn)            |
| #51 dashboard UI        | #52 sound (Web Audio API, không cần API)        |

---

### Risk Register

| Risk                                   | Mức      | Mitigation                                                                          |
| -------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| Supabase Realtime không hoạt động      | 🔴 Cao   | **#50 spike ngay Day 6** — phát hiện sớm, còn thời gian xoay xở                    |
| `generate_order_code()` race condition | 🟡 Trung | Test concurrent Day 2 khi viết migration                                            |
| options management phức tạp hơn tưởng  | 🟡 Trung | #113 để cuối M3, không ảnh hưởng core flow                                           |
| Payment bank_transfer UX phức tạp      | 🟡 Trung | #115 + #40 làm cùng nhau Day 8                                                       |
| 3 tuần không đủ                        | 🟡 Trung | Nếu trễ: bỏ #113 (options admin) + #81 (category admin), ship với toggle + add basic |

---

### Nếu bị trễ — Fallback Scope

Thứ tự có thể defer sang Phase 2 mà không ảnh hưởng core flow:

```
#113 Options management       → quản lý options thủ công trên Supabase Dashboard
#81 Category admin           → thêm category thủ công
#114 Image upload             → dùng URL ảnh từ ngoài tạm thời
#52 Sound notification       → dashboard vẫn dùng được, chỉ thiếu sound
#54 Jest unit tests          → test thủ công qua smoke checklist #117
```

---

## Phase 2 — Operations (~2 tuần)

> Đã bắt đầu — xem Done items bên dưới.

**Done:**
- [x] Reports dashboard — KPI, revenue trend, revenue by category, best selling products
- [x] Password reset flow
- [x] Bottom navigation thống nhất + UI/UX redesigns toàn app

**Còn lại:**
- [ ] Print / share QR code
- [ ] Mobile optimization (Lighthouse ≥ 90)
- [ ] MoMo / VNPAY integration + `payment_status`
- [ ] `cancel_token` cho cancel endpoint (thay brute-force order_code)
- [ ] Offline detection UI

## Phase 3 — Loyalty (~3 tuần)

> `customer_ref` đã sẵn từ Phase 1 schema — không breaking change.

- Customer soft identity (phone number optional)
- Point system, voucher, buy X get Y
- Customer order history

## Phase 4 — Gamification (~2 tuần)

- Lucky wheel sau order
- Secret menu (unlock bằng code)
- Mini game

---

## Out of Scope

```
Native mobile app
Multi-store / multi-tenant
Inventory management
Offline sync
Staff management
Full accounting / ERP
AI recommendation
```
