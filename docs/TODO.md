# TODO / BACKLOG

> Cập nhật: 2026-06-27

---

## Trạng thái hiện tại

**Phase 1 — QR Menu MVP:** ✅ Code complete (tất cả 41 issues #16–#118 đã merge)

**Phase 2 — Operations (partial):** ✅ Reports dashboard done

---

## Việc cần làm ngay (blocking deploy)

- [ ] **#117 Smoke test** — chạy manual checklist trước khi deploy (xem `docs/ISSUES.md`)
- [ ] **#118 Deploy to Vercel** — setup 10 env vars, connect GitHub, verify build

---

## Phase 2 — Còn lại

- [ ] Print / share QR code cho bàn
- [ ] MoMo / VNPAY integration + `payment_status`
- [ ] `cancel_token` riêng cho cancel endpoint (thay brute-force order_code)
- [ ] Mobile optimization — Lighthouse ≥ 90
- [ ] Offline detection UI ("Đang mất mạng...")
- [ ] Service worker / PWA caching (hiện chỉ có manifest)

---

## Cải thiện kỹ thuật (backlog)

- [ ] Jest unit tests cho `OrderService` (#54) — hiện chưa có, chỉ có mock setup
- [ ] Image cleanup khi upload ảnh mới (xóa ảnh cũ trong Supabase Storage)
- [ ] Pagination cho admin product list (hiện load all)
- [ ] Cursor pagination cho dashboard tab "Xong" (done + cancelled)

---

## Done

### Phase 1 (tất cả #16–#118)
- [x] Project scaffolding — Next.js App Router + TypeScript + Tailwind + shadcn
- [x] Supabase client setup (browser + server + admin)
- [x] DB migrations — categories, products, options, orders, order_items
- [x] DB function `generate_order_code()` + trigger `set_updated_at`
- [x] RLS policies + Realtime publication
- [x] Supabase Storage bucket (product-images)
- [x] Seed data (idempotent)
- [x] TypeScript types + Zod validators
- [x] Owner auth + middleware (`/dashboard`, `/admin` protected)
- [x] Service role client + `requireOwner()` helper
- [x] Product & Category repository + service
- [x] Order repository + service (submit, cancel, updateStatus, wait_estimate)
- [x] `GET /api/menu` — public menu với categories + products
- [x] `POST /api/orders` — rate limit 10/min/IP + bank_transfer_info
- [x] `PATCH /api/orders/[id]/status` — owner only, validate transitions
- [x] `POST /api/orders/[code]/cancel` — public, status = new only
- [x] `GET /api/orders/[code]` — public tracking lookup
- [x] `GET /api/orders` — owner list, cursor pagination, filter by status
- [x] Custom hooks — `useCart`, `useOrderQueue`, `useOrderTracking`
- [x] Menu page — CategoryTabs, MenuCard, ProductModal + options
- [x] Cart page — CartItem, CartSummary, payment_method radio
- [x] Order success screen — bank_transfer_info block, sessionStorage
- [x] Order tracking page — realtime + cancel + connection status
- [x] Dashboard — realtime queue, sound notification, filter tabs, OrderCard
- [x] Dashboard — order detail drawer
- [x] Admin panel — list products, availability toggle, add/edit/delete, options, image upload
- [x] Admin panel — category management (CRUD, soft delete)
- [x] Bank transfer env vars + `getBankTransferInfo()`
- [x] PWA manifest + meta tags + icons
- [x] Error pages (404, error boundary, global-error)
- [x] Redirect `/` → `/menu` (308 permanent)
- [x] Bottom navigation thống nhất (PublicBottomNav, OwnerBottomNav)

### Phase 2 — Reports Dashboard
- [x] DB report indexes + optimization
- [x] RPC `get_order_summary` — KPI (orders count, revenue, avg wait time)
- [x] RPC `get_revenue_trend` — theo giờ hoặc theo ngày
- [x] RPC `get_revenue_by_category` — pie chart breakdown
- [x] RPC `get_best_selling_products` — top 10 by quantity
- [x] `GET /api/reports/summary`, `revenue`, `categories`, `products`
- [x] `/reports` page + DateFilter, SummaryKPIs, RevenueChart, RevenueByCategoryChart, BestSellingProducts
- [x] Password reset flow (`/auth/reset-password`)
- [x] UI/UX redesigns — login, menu 2-col grid, cart thumbnails, tracking page, dashboard drawer, illustrations
- [x] Security — revoke EXECUTE on RPC from anon/authenticated
