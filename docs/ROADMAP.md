# Roadmap — Solo Cafe Order

---

## Phase 1 — QR Menu MVP (~3–4 tuần solo dev)

### Critical Path

```
#1 → #2 → #35 → #10 → #13 → #14 → #21 → #22   (customer submit flow)
#3 → #4 → #12 → #13                               (DB → orders)
#4 → #36 → #24a → #24b                            (Realtime — risk cao nhất)
#33 → #34                                          (smoke test → deploy)
```

> **Rule cho solo dev:** Làm theo critical path trước. Parallel streams chỉ khi đang chờ (test chạy, build, review). Đừng context-switch quá nhiều trong 1 ngày.

---

### Week 1 — Foundation (M1)

**Mục tiêu cuối tuần:** DB migrate xong, API `/menu` trả data, owner login được.

| Ngày      | Focus                              | Issues                                                                                                            |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Day 1** | Project setup + DB schema products | #1 scaffolding, #3 migration categories/products, #6 Storage bucket                                               |
| **Day 2** | DB schema orders + Supabase client | #4 migration orders + order_code fn + trigger, #2 Supabase client + sanitize                                      |
| **Day 3** | DB policies + seed + types         | #5 RLS policies, #7 seed data, #36 Realtime publication, #8 types + Zod                                           |
| **Day 4** | Auth + service role + small setup  | #9 auth + middleware, #35 service role client, #40 bank env vars, #30 PWA manifest, #31 error pages, #32 redirect |
| **Day 5** | Product layer + API menu           | #10 product repo + service, #11 GET /api/menu                                                                     |

**M1 Checkpoint:**

- [ ] `npm run dev` chạy
- [ ] `GET /api/menu` trả categories + products (test bằng curl)
- [ ] `/login` → redirect `/dashboard` (owner account đã tạo trên Supabase)
- [ ] `/dashboard` không auth → redirect `/login`

---

### Week 2 — Core Order Loop Backend (M2 backend)

**Mục tiêu cuối tuần:** Toàn bộ API orders hoạt động, Realtime đã validate.

| Ngày       | Focus                                    | Issues                                                                                    |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Day 6**  | ⚡ Realtime spike + Order repo           | **#24a Realtime spike** (làm TRƯỚC — risk cao nhất), #12 order repository                 |
| **Day 7**  | Order service (business logic nặng nhất) | #13 order service (submitOrder, cancelOrder, updateStatus, wait_estimate)                 |
| **Day 8**  | Submit + Status APIs                     | #14 POST /api/orders (rate limit + bank_transfer_info), #15 PATCH status, #16 POST cancel |
| **Day 9**  | Tracking + Dashboard APIs + Tests        | #17 GET /api/orders/[code], #18 GET /api/orders (owner + pagination), #37 Jest unit tests |
| **Day 10** | Custom hooks                             | #19 useCart + useOrderQueue + useOrderTracking                                            |

**M2-backend Checkpoint:**

- [ ] `POST /api/orders` → 201 với order_code + wait_estimate string
- [ ] `POST /api/orders` lần 11/phút → 429 RATE_LIMITED
- [ ] Supabase Dashboard: insert order → console log event trong < 2 giây (#24a spike pass)
- [ ] `npm test` → OrderService tests pass

---

### Week 3 — Frontend + Admin + Ship (M2 frontend + M3)

**Mục tiêu cuối tuần:** App live trên Vercel, full flow từ QR đến dashboard.

| Ngày       | Focus                         | Issues                                                                                  |
| ---------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| **Day 11** | Menu page                     | #20 Menu page (CategoryTabs, MenuCard, ProductModal + options)                          |
| **Day 12** | Cart + Order success          | #21 Cart page (submit + payment_method radio), #22 Order success screen                 |
| **Day 13** | Tracking + Dashboard          | #23 Order tracking page (realtime + cancel), #24b Dashboard full (OrderCard + Realtime) |
| **Day 14** | Dashboard UX + Loading states | #25 Sound + filter tabs + title badge, #26 Loading/empty/error states                   |
| **Day 15** | Admin product                 | #27 Admin list + availability toggle, #28 Add/edit product                              |
| **Day 16** | Admin options + image         | #38 Options management, #29 Image upload                                                |
| **Day 17** | Admin category + smoke test   | #39 Category admin, #33 Smoke test checklist                                            |
| **Day 18** | Deploy                        | #34 Deploy to Vercel + env setup                                                        |

**M3 / Done Checkpoint:**

- [ ] Scan QR `/` → `/menu` → thêm vào cart → submit → nhận order_code < 60 giây
- [ ] Dashboard nhận order mới realtime < 2 giây + sound
- [ ] Owner cập nhật status → tracking page khách cập nhật ngay
- [ ] Upload ảnh product, toggle availability hoạt động
- [ ] `npm run build` clean, Lighthouse PWA ≥ 80
- [ ] App live trên Vercel

---

### Parallel Streams (làm khi chờ)

| Khi đang chờ...          | Có thể làm song song                            |
| ------------------------ | ----------------------------------------------- |
| Build / test chạy        | Viết seed data, viết Zod schemas                |
| #13 order service (nặng) | #30 PWA manifest, #31 error pages, #32 redirect |
| Backend M2 xong          | #19 custom hooks (không cần API sẵn)            |
| #24b dashboard UI        | #25 sound (Web Audio API, không cần API)        |

---

### Risk Register

| Risk                                   | Mức      | Mitigation                                                                          |
| -------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| Supabase Realtime không hoạt động      | 🔴 Cao   | **#24a spike ngay Day 6** — phát hiện sớm, còn thời gian xoay xở                    |
| `generate_order_code()` race condition | 🟡 Trung | Test concurrent Day 2 khi viết migration                                            |
| options management phức tạp hơn tưởng  | 🟡 Trung | #38 để cuối M3, không ảnh hưởng core flow                                           |
| Payment bank_transfer UX phức tạp      | 🟡 Trung | #40 + #14 làm cùng nhau Day 8                                                       |
| 3 tuần không đủ                        | 🟡 Trung | Nếu trễ: bỏ #38 (options admin) + #39 (category admin), ship với toggle + add basic |

---

### Nếu bị trễ — Fallback Scope

Thứ tự có thể defer sang Phase 2 mà không ảnh hưởng core flow:

```
#38 Options management       → quản lý options thủ công trên Supabase Dashboard
#39 Category admin           → thêm category thủ công
#29 Image upload             → dùng URL ảnh từ ngoài tạm thời
#25 Sound notification       → dashboard vẫn dùng được, chỉ thiếu sound
#37 Jest unit tests          → test thủ công qua smoke checklist #33
```

---

## Phase 2 — Operations (~2 tuần)

- Daily revenue summary trên dashboard
- Print / share QR code
- Mobile optimization (Lighthouse ≥ 90)
- MoMo / VNPAY integration + `payment_status`
- `cancel_token` cho cancel endpoint (thay brute-force order_code)
- Offline detection UI

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
