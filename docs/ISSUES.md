# GitHub Issues — Solo Cafe Order

> Reviewed by: PM · PO · Tech Lead · Tester · Senior Dev (round 2 — cross-checked vs API_CONTRACT, DB_SCHEMA, DOMAIN, REALTIME, TESTING docs)
> Last updated: 2026-06-18
> Total: 41 issues · 3 milestones

---

## Milestones

| Milestone                | Mục tiêu                                  | Done khi                                              |
| ------------------------ | ----------------------------------------- | ----------------------------------------------------- |
| **M1 — Foundation**      | Hạ tầng chạy, DB sẵn sàng, auth hoạt động | DB migrate xong, API menu trả data, owner login được  |
| **M2 — Core Order Loop** | Khách order được, owner nhận realtime     | Scan QR → gửi order → dashboard hiển thị realtime     |
| **M3 — Admin + Ship**    | Owner quản lý menu, app live              | CRUD menu được, app chạy trên Vercel, smoke test pass |

---

## Labels

| Label      | Dùng cho                                 |
| ---------- | ---------------------------------------- |
| `setup`    | Scaffolding, config, env                 |
| `database` | Migration, seed, RLS, DB function        |
| `backend`  | API routes, service, repository          |
| `frontend` | Pages, components, hooks                 |
| `security` | Auth, rate limit, sanitize, RLS          |
| `ux`       | Loading states, empty states, toast, PWA |
| `deploy`   | Vercel, CI, smoke test                   |

---

## Milestone 1 — Foundation

### #16 · Project scaffolding

**Labels:** `setup`
**Blocked by:** —

**Scope:**

- Next.js (App Router) + TypeScript strict mode
- TailwindCSS + shadcn/ui init (bao gồm Toaster cho toast notifications)
- ESLint + Prettier config
- `next.config.js` — `images.remotePatterns` cho Supabase Storage URL, security headers
- `.env.example` đầy đủ **6 biến base** (thêm `NEXT_PUBLIC_APP_URL` cho QR link) — 4 bank vars bổ sung trong #115
  - Vercel deploy cần đủ 10 biến — xem #118 để không thiếu khi setup production
- Folder structure theo CLAUDE.md (`app/`, `components/`, `lib/`, `hooks/`, `types/`, `supabase/`)

**AC:**

- `npm run dev` chạy được
- `npm run lint` không lỗi
- `npm run typecheck` không lỗi
- `next/image` load được URL từ Supabase Storage domain

---

### #17 · Supabase client setup

**Labels:** `setup`, `backend`
**Blocked by:** #16

**Scope:**

- `lib/supabase/browser.ts` — browser client (`createBrowserClient`)
- `lib/supabase/server.ts` — server client (`createServerClient` với cookies)
- `lib/utils/sanitize.ts` — `sanitizeText(input, maxLength)`: strip HTML tags, trim, truncate

**AC:**

- Browser client dùng được trong Client Component
- Server client dùng được trong Server Component và API Route
- `sanitizeText('<script>alert(1)</script>', 50)` → plain text, ≤ 50 ký tự
- Không có Supabase call nào dùng `SUPABASE_SERVICE_ROLE_KEY` trong file này

---

### #18 · DB migration: Products & Categories

**Labels:** `database`
**Blocked by:** —

**Scope:**

- Enable extension **`pg_uuidv7`** (không phải `uuid-ossp`) để dùng `uuid_generate_v7()`
- Table `categories`: id (uuid v7 PK), name varchar, sort_order int, created_at timestamp, deleted_at timestamp null
- Table `products`: id (uuid v7 PK), category_id FK, name varchar, description text, price int (> 0 VND), image_url varchar null, is_available boolean default true, created_at timestamp, deleted_at timestamp null
- Table `product_options`: id (uuid v7 PK), product_id FK, name varchar, type varchar (`select` | `multi`), deleted_at timestamp null
- Table `product_option_values`: id (uuid v7 PK), option_id FK, name varchar, extra_price int default 0, deleted_at timestamp null

**AC:**

- Tất cả PK dùng `uuid_generate_v7()` as default
- `categories`, `products`, `product_options`, `product_option_values` đều có `deleted_at timestamp null`
- FK constraints có ON DELETE RESTRICT
- `CREATE EXTENSION IF NOT EXISTS pg_uuidv7` không lỗi trên Supabase

---

### #19 · DB migration: Orders + DB function + trigger

**Labels:** `database`
**Blocked by:** #18

**Scope:**

- Table `orders`: id (uuid v7 PK), order_code varchar unique, status varchar (new|making|done|cancelled), total_amount int, payment_method varchar (cash|bank_transfer) default 'cash', pickup_name varchar null, note text null, customer_ref varchar null, created_at timestamp, updated_at timestamp
  - **Không có `deleted_at`** — orders không soft delete, cancel = `status = 'cancelled'`
- Table `order_items`: id (uuid v7 PK), order_id FK, product_id uuid null (soft ref, không FK constraint), product_name varchar snapshot, quantity int (> 0), unit_price int snapshot VND, selected_options jsonb snapshot, note text null
- DB function `generate_order_code()`:
  - Format `A001`…`A999` → `B001`…, reset mỗi ngày theo `(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`
  - Dùng `SELECT ... FOR UPDATE` hoặc advisory lock — atomic, không race condition
- Trigger `set_updated_at` — auto-update `updated_at = NOW()` trước mỗi UPDATE trên `orders`

**AC:**

- Gọi `generate_order_code()` concurrent 10 lần trong cùng một giây không sinh duplicate
- `updated_at` tự cập nhật khi UPDATE order
- Order code reset về `A001` khi sang ngày mới (timezone Asia/Ho_Chi_Minh)
- `orders` không có cột `deleted_at`

---

### #20 · RLS policies

**Labels:** `database`, `security`
**Blocked by:** #18, #19

**Scope** (`supabase/policies.sql`):

> **Note:** API routes server-side dùng `SUPABASE_SERVICE_ROLE_KEY` — bypass RLS. RLS ở đây bảo vệ: (1) anon client trên browser, (2) Supabase Realtime subscription.

- `categories`, `products`, `product_options`, `product_option_values`:
  - Public SELECT (filter `deleted_at IS NULL` trong query, không phải policy)
  - Authenticated INSERT/UPDATE (owner via service_role — không cần policy cho API)
  - Không ai DELETE trực tiếp (hard delete bị block)
- `orders`:
  - **Public SELECT** (anon) — cần cho tracking page và Realtime subscribe: `FOR SELECT TO anon USING (true)`
  - Public INSERT (anon) — tạo order qua anon client hoặc service_role trong API
  - Authenticated UPDATE/DELETE (owner)
- `order_items`:
  - Authenticated SELECT (owner dashboard)
  - Public INSERT (anon, cùng transaction với order)
- `orders` không có `deleted_at` — không cần filter trong policy

**AC:**

- Anonymous browser: SELECT products ✅, DELETE products ❌
- Anonymous browser: SELECT `orders` (bất kỳ row) ✅, UPDATE orders ❌
- Realtime subscribe `orders` với anon key → nhận INSERT/UPDATE events ✅
- Tracking page đọc order bằng order_code với anon client ✅
- Unauthenticated gọi PATCH `/api/products` trực tiếp qua Supabase URL → bị RLS chặn

---

### #21 · Supabase Storage bucket setup

**Labels:** `setup`, `security`
**Blocked by:** —
**Note:** Prerequisite của #114 (image upload)

**Scope:**

- Bucket `product-images`: public read
- Storage policy: chỉ authenticated user upload/delete
- File size limit: 2MB (cấu hình trong Supabase Dashboard)
- Allowed MIME types: image/jpeg, image/png, image/webp

**AC:**

- Public URL của ảnh load được trên browser không cần auth
- Upload không auth → 403
- Upload file > 2MB → bị reject ở storage level

---

### #22 · Seed data

**Labels:** `database`
**Blocked by:** #18, #19

**Scope** (`supabase/seed.sql`):

- Dùng fixed UUID v7 values (hardcoded) để seed idempotent với `INSERT ... ON CONFLICT DO NOTHING`
- 3–4 categories (Cà phê, Trà, Đồ ăn vặt, Nước trái cây)
- 8–10 products với giá VND thực tế
- Ít nhất 2 products có options (size S/M/L với extra_price)
- Ít nhất 1 product `is_available = false`
- Ít nhất 1 order demo có `payment_method = 'bank_transfer'` (để test success screen bank block)

**AC:**

- Seed chạy lại không lỗi (idempotent via ON CONFLICT DO NOTHING)
- Menu page hiển thị đủ products sau seed
- Options và option_values đúng FK

---

### #23 · TypeScript types + shared infrastructure

**Labels:** `setup`, `backend`
**Blocked by:** #18, #19

**Scope:**

- `types/product.ts` — `Category`, `Product`, `ProductOption`, `ProductOptionValue`
- `types/order.ts` — `Order`, `OrderItem`, `OrderStatus` (`new`|`making`|`done`|`cancelled`), `PaymentMethod` (`cash`|`bank_transfer`), `SelectedOption`
- `types/customer.ts` — `CartItem`, `CartItemOption`
- `lib/constants.ts` — `ORDER_STATUS`, `PAYMENT_METHOD`, error code strings, `WAIT_ESTIMATE_PER_ORDER_MINUTES = 3`
- `lib/validators.ts` — Zod schemas:
  - `submitOrderSchema`: items (array, min 1), pickup_name (string, max 50, optional), **order note** (string, max **500**, optional), payment_method (enum cash|bank_transfer, default cash)
  - `orderItemSchema`: item note (string, max **200**, optional) — phân biệt với order-level note
  - `updateStatusSchema`: status (enum making|done|cancelled)
  - `cancelOrderSchema`: order_code (string, required) — validate URL path param format, không phải body (#42 cancel không cần body)
  - `selectedOptionSchema`: option_id, value_ids (array — validate select=1 value, multi≥0)

**AC:**

- Không có `any` trong toàn bộ types
- Zod schemas reject invalid payment_method
- Zod schemas reject select option với > 1 value được chọn
- `npm run typecheck` pass

---

### #24 · Owner auth + middleware

**Labels:** `backend`, `frontend`, `security`
**Blocked by:** #17

**Scope:**

- `app/login/page.tsx` — form email + password, submit → Supabase Auth
- `middleware.ts` — protect `/dashboard` và `/admin`: redirect về `/login` nếu chưa auth
- Logout button (component dùng lại ở dashboard và admin)
- Owner account được tạo thủ công trên Supabase Dashboard (không có signup flow)

**AC:**

- Đăng nhập đúng → redirect `/dashboard`
- Đăng nhập sai → error message "Email hoặc mật khẩu không đúng"
- Truy cập `/dashboard` không auth → redirect `/login`
- Session persist qua page refresh
- API routes `/api/orders` PATCH (owner) không auth → 401 (kiểm tra session trong route handler, không chỉ middleware)

---

### #25 · Service role client + API auth helper

**Labels:** `setup`, `backend`, `security`
**Blocked by:** #17

**Scope:**

- `lib/supabase/admin.ts` — server-only client dùng `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)
- `lib/auth/requireOwner.ts` — helper: check session từ request, throw `UNAUTHORIZED` nếu không có
- Dùng trong mọi protected API route thay vì check session inline

**AC:**

- `admin.ts` không export được ở client-side (kiểm tra bằng `typeof window`)
- `requireOwner()` gọi trong PATCH /api/orders → 401 nếu không có session
- Không có route nào dùng service_role client mà bỏ qua `requireOwner()`

---

### #26 · Realtime publication migration

**Labels:** `database`
**Blocked by:** #19

**Scope:**

- Migration SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE orders;`
- Verify trong Supabase Dashboard: Table `orders` xuất hiện trong Realtime publication

**AC:**

- Insert vào `orders` → Realtime event trigger trong < 2 giây
- Update `status` trên `orders` → Realtime event trigger
- Dashboard subscribe nhận event mà không cần polling

---

## Milestone 2 — Core Order Loop

### #36 · Product & Category repository + service

**Labels:** `backend`
**Blocked by:** #17, #18, #23, #25

**Scope:**

- `lib/repositories/product.repository.ts`:
  - `findAllAvailable()` — filter `is_available = true AND deleted_at IS NULL`, kèm options
  - `findAllForAdmin()` — **không** filter is_available, chỉ filter `deleted_at IS NULL`
  - `findByIdWithOptions(id)` — kèm option values, filter `deleted_at IS NULL`
- `lib/repositories/category.repository.ts` — `findAll()` filter `deleted_at IS NULL`
- `lib/services/product.service.ts`:
  - `getMenuWithCategories()` — gọi `findAllAvailable()`, group theo category
  - `getProductWithOptions(id)` — dùng cho validate khi submit order

**AC:**

- `is_available = false` bị filter đúng ở `getMenuWithCategories()`, không bị filter ở `getProductWithOptions()`
- Soft deleted records không xuất hiện trong mọi method
- Không có Supabase call trực tiếp trong service layer

---

### #37 · GET /api/menu

**Labels:** `backend`
**Blocked by:** #36

**Scope:**

- `app/api/menu/route.ts` — public, không cần auth
- Trả: `{ categories: [{ id, name, sort_order, products: [{ id, name, description, price, image_url, options: [...] }] }] }`
- Chỉ trả products `is_available = true` → không cần expose field `is_available` trong response
- Dùng admin client (service_role) hoặc anon client với RLS cho phép

**AC:**

- Product `is_available = false` không có trong response
- Soft deleted products/categories không có
- Response time < 500ms với seed data
- Structure khớp `docs/API_CONTRACT.md`

---

### #38 · Order repository

**Labels:** `backend`
**Blocked by:** #17, #19, #23, #25

**Scope:**

- `lib/repositories/order.repository.ts`:
  - `create(data)` — insert `orders` + `order_items` trong 1 transaction, gọi `generate_order_code()` via DB function (RPC hoặc raw SQL trong transaction)
  - `findByCode(order_code)` — kèm order_items
  - `findById(id)` — kèm order_items
  - `updateStatus(id, status)` — chỉ update cột status
  - `listByStatus(status?)` — cho owner dashboard, sort created_at DESC, **chỉ trả orders hôm nay** (`(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`)
  - `countPending()` — đếm orders status `new` + `making` (dùng tính wait_estimate)
  - **Không có `softDelete()` method** — orders không soft delete

**AC:**

- `create()` gọi `generate_order_code()` qua DB, không sinh code trong application code
- Transaction rollback nếu insert order_items thất bại
- `listByStatus()` không trả orders của ngày hôm qua
- Không có filter `deleted_at IS NULL` (orders table không có cột này)

---

### #39 · Order service

**Labels:** `backend`
**Blocked by:** #36, #38

**Scope:**

- `lib/services/order.service.ts`:
  - `submitOrder(items, pickup_name?, note?, payment_method)`:
    - Validate từng `product_id` còn tồn tại và `is_available` từ DB (không trust client)
    - Validate từng `selected_option_value_id`: option thuộc đúng product, type `select` chỉ 1 value, type `multi` ≥ 0
    - Tính `unit_price = product.price + sum(option_value.extra_price)` từ DB — không nhận price từ client
    - Snapshot `product_name`, `unit_price`, `selected_options` vào order_items
    - Tính `wait_estimate`: `countPending() × 3` phút, trả `{ min, max }` (± 2 phút)
      - MVP đơn giản: đếm tất cả orders `new` + `making` tại thời điểm submit — dùng `countPending()` từ #38 (không trừ vị trí trong queue)
    - Validate `payment_method` ∈ `[cash, bank_transfer]`
  - `cancelOrder(order_code)` — chỉ khi `status = 'new'`, set `status = 'cancelled'`
  - `updateStatus(id, newStatus)` — validate transition hợp lệ

**Transition hợp lệ:**

```
new     → making    (owner)
making  → done      (owner)
new     → cancelled (owner hoặc customer)
```

> `making → cancelled` **KHÔNG hợp lệ** — owner phải done order đang làm

**AC:**

- Submit với product `deleted_at IS NOT NULL` → `PRODUCT_NOT_FOUND`
- Submit với product `is_available = false` → `PRODUCT_UNAVAILABLE`
- Submit với `price` trong body → bị ignore hoàn toàn, server tính lại
- Submit với `select` option có 2 values → `VALIDATION_ERROR`
- Cancel order `status = making` → `INVALID_STATUS_TRANSITION`
- `wait_estimate` tính đúng: pending = `new` + `making` (không chỉ `new`)
- `payment_method = 'momo'` → `VALIDATION_ERROR`

---

### #40 · POST /api/orders

**Labels:** `backend`, `security`
**Blocked by:** #39, #115

**Scope:**

- `app/api/orders/route.ts` — public endpoint
- Validate input bằng `submitOrderSchema` (Zod từ `lib/validators.ts`)
- Upstash Redis rate limit: 10 req/phút/IP
- Sanitize `pickup_name` và `note` qua `sanitizeText()` trước khi pass vào service
- Response 201:
  ```json
  {
    "order_code": "A001",
    "total_amount": 75000,
    "payment_method": "cash",
    "wait_estimate": "5–10 phút",
    "pickup_name": "Mon",
    "items": [...],
    "bank_transfer_info": null
  }
  ```

  - Nếu `payment_method = bank_transfer`: `bank_transfer_info = { bank_name, account_number, account_name, qr_image_url }` (đọc từ server env)
  - `wait_estimate` là **string** đã format ("5–10 phút"), không phải số thô

**AC:**

- Request thứ 11 trong 1 phút → 429 + `Retry-After` header + body `{ "code": "RATE_LIMITED", "message": "..." }`
- `pickup_name = "<script>alert(1)</script>"` → lưu plain text
- Missing required field → 400 `VALIDATION_ERROR` với field name
- `payment_method = 'momo'` → 400 `VALIDATION_ERROR`
- `payment_method = bank_transfer` → `bank_transfer_info` có đủ 4 fields
- `payment_method = cash` → `bank_transfer_info = null`
- Thành công → 201 với đủ fields, `wait_estimate` là string

---

### #41 · PATCH /api/orders/[id]/status

**Labels:** `backend`, `security`
**Blocked by:** #39, #25

**Scope:**

- `app/api/orders/[id]/status/route.ts` — owner only
- Dùng `requireOwner()` helper
- Body: `{ status: "making" | "done" | "cancelled" }`
- Validate transition qua `OrderService.updateStatus()`

**AC:**

- Unauthenticated → 401 `UNAUTHORIZED`
- `making → cancelled` → 422 `INVALID_STATUS_TRANSITION`
- `new → done` (skip making) → 422 `INVALID_STATUS_TRANSITION`
- Valid transition → 200 với order đã update

---

### #42 · POST /api/orders/[code]/cancel

**Labels:** `backend`
**Blocked by:** #39

**Scope:**

- `app/api/orders/[code]/cancel/route.ts` — **POST**, public (không cần auth)
- Path param: `order_code` (không phải UUID)
- Không cần body — code đã có trong URL
- Gọi `OrderService.cancelOrder(order_code)`
- Set `status = 'cancelled'` — **không** set `deleted_at`

**AC:**

- Cancel đúng order_code + status `new` → 200 `{ order_code, status: "cancelled" }`
- Cancel sai order_code → 404 `ORDER_NOT_FOUND`
- Cancel order status `making` → 422 `INVALID_STATUS_TRANSITION`
- Sau cancel, order vẫn query được bằng code (tracking page hiển thị "Đã hủy")
- **Phase 1 risk accepted:** `order_code` ~25k combinations/ngày — brute-force có thể cancel order người khác; `cancel_token` riêng sẽ giải quyết ở Phase 2

---

### #43 · GET /api/orders/[code]

**Labels:** `backend`
**Blocked by:** #38

**Scope:**

- `app/api/orders/[code]/route.ts` — public
- Lookup bằng `order_code` (không phải UUID)
- Trả: `{ order_code, status, total_amount, payment_method, pickup_name, items, created_at }`
- Không trả: `id` (UUID), `customer_ref`, `updated_at`, `wait_estimate` (chỉ có lúc submit)

**AC:**

- Code không tồn tại → 404 `ORDER_NOT_FOUND`
- Trả đủ fields để tracking page render (kể cả status cancelled)
- `id` UUID không có trong response body
- `wait_estimate` không có trong response (tracking page không cần)

---

### #44 · GET /api/orders

**Labels:** `backend`, `security`
**Blocked by:** #38, #25

**Scope:**

- `app/api/orders/route.ts` GET handler — owner only, dùng `requireOwner()`
- Query params: `?status=new|making|done|cancelled` (optional), `?cursor=<order_id_uuid_v7>`, `?limit=30`
- **Không có `?status`** (tab "Tất cả"): trả tất cả orders hôm nay, cursor paginate, limit 30
- **`?status=new` hoặc `?status=making`**: trả toàn bộ active orders hôm nay (không paginate — dashboard cần xem hết)
- **`?status=done` hoặc `?status=cancelled`**: cursor paginate, limit 30
- Sort: `created_at DESC`

**AC:**

- Unauthenticated → 401
- Không có `?status` → trả tất cả orders hôm nay, cursor pagination
- `?status=new` → toàn bộ orders new hôm nay (không paginate)
- `?status=done&limit=30&cursor=<uuid>` → trả tối đa 30 orders, kèm `next_cursor` nếu còn
- Không filter `deleted_at` (orders không có cột này)
- Response format khớp `docs/API_CONTRACT.md`

---

### #45 · Custom hooks

**Labels:** `frontend`
**Blocked by:** #17, #23

**Scope:**

- `hooks/useCart.ts` — add, remove, update qty, clear, persist localStorage, tính total
- `hooks/useOrderQueue.ts` (align với REALTIME.md) — subscribe Supabase Realtime `orders` table, expose `{ orders, connectionStatus }` (`connected` | `connecting` | `disconnected`), tự reconnect với exponential backoff
- `hooks/useOrderTracking.ts` — subscribe single order bằng `order_code`, expose `{ order, connectionStatus }`

**AC:**

- Cart persist qua page refresh
- Cart clear sau submit thành công
- `useOrderQueue` và `useOrderTracking` expose `connectionStatus` (không chỉ data)
- Reconnect tự động khi mất mạng, không cần refresh page
- Unsubscribe cleanup khi component unmount (tránh memory leak)

---

### #54 · Jest setup + unit tests

**Labels:** `backend`
**Blocked by:** #23, #39

**Scope** (theo `docs/TESTING.md`):

- Setup Jest + ts-jest cho Next.js App Router
- Unit tests cho `OrderService`:
  - `submitOrder`: product unavailable, price tampering, option validation (select=1), wait_estimate calc
  - `cancelOrder`: valid cancel, cancel when making
  - `updateStatus`: valid transitions, invalid transitions
- Unit tests cho `ProductService`:
  - `getMenuWithCategories`: filter unavailable, filter deleted
- Mock `OrderRepository` và `ProductRepository` (không hit DB)

**AC:**

- `npm test` chạy được
- Coverage `OrderService`: tất cả transitions và validation paths
- Tests không có `any`, không hardcode UUID

---

### #46 · Menu page

**Labels:** `frontend`
**Blocked by:** #37, #45

**Scope:**

- `app/menu/page.tsx` + `components/menu/`
- `CategoryTabs` — sticky top, scroll to section khi tap
- `MenuCard` — ảnh (fallback placeholder), tên, giá, nút thêm
- `ProductModal` — mô tả, options (select/multi), tính extra_price realtime, thêm vào giỏ

**AC:**

- Option type `select`: radio, chỉ chọn 1
- Option type `multi`: checkbox, chọn nhiều
- Giá modal = base price + sum(selected extra_price), cập nhật realtime
- Mobile: tap target ≥ 44px, modal scroll được trên màn nhỏ
- Product không có ảnh → fallback placeholder (không broken image)
- Category rỗng (tất cả products unavailable) → không hiển thị tab
- Tất cả products unavailable → empty state "Hôm nay quán tạm đóng cửa" (optional, nice-to-have)
- API lỗi → error state với nút retry

---

### #47 · Cart page

**Labels:** `frontend`
**Blocked by:** #40, #45

**Scope:**

- `app/cart/page.tsx` + `components/cart/`
- `CartItem` — tên, options đã chọn, qty (+/-), giá, nút xóa
- `CartSummary` — tổng tiền, form:
  - `pickup_name` (optional, max 50 ký tự)
  - `note` (optional, max **500** ký tự — order-level note, khác với item note max 200)
  - `payment_method` radio: Tiền mặt / Chuyển khoản
  - Nút "Đặt hàng"
- Khi submit: gọi `POST /api/orders`, re-validate availability

**AC:**

- Cart trống → empty state + nút "Xem menu"
- `pickup_name` > 50 ký tự → disable submit + inline warning
- Product vừa unavailable khi submit → warning "Sản phẩm X đã hết, đã xóa khỏi giỏ"
- Rate limit 429 → toast "Vui lòng chờ 1 phút rồi thử lại"
- Submit thành công → clear cart, redirect `/order-success`

---

### #48 · Order success screen

**Labels:** `frontend`
**Blocked by:** #47

**Scope:**

- `app/order-success/page.tsx`
- Nhận data từ submit response (lưu sessionStorage, không qua URL param)
- Hiển thị: order_code (lớn, dễ đọc), pickup_name, items snapshot, wait_estimate
- Nếu `payment_method = bank_transfer`: hiển thị block thông tin tài khoản ngân hàng từ `bank_transfer_info` trong submit response (không đọc env client-side — xem #115)
- Link đến `/order/[code]` để tracking
- Nút "Đặt thêm" → về `/menu`

**AC:**

- `wait_estimate` hiển thị dạng "5–10 phút" (string từ API, không format lại)
- `payment_method = cash` → không hiện bank block
- `payment_method = bank_transfer` → hiện đầy đủ tên ngân hàng, số tài khoản, tên chủ
- Reload trang → vẫn có data (dùng sessionStorage)
- sessionStorage corrupt/missing → redirect về `/menu`

---

### #49 · Order tracking page

**Labels:** `frontend`
**Blocked by:** #43, #45

**Scope:**

- `app/order/[code]/page.tsx`
- Realtime status updates qua `useOrderTracking`
- Progress indicator: Mới → Đang làm → Xong / Đã hủy
- Cancel button (chỉ hiện khi status = `new`) → confirm dialog → gọi `POST /api/orders/[code]/cancel`
- Connection status indicator ("Đang kết nối...", "Mất kết nối")

**AC:**

- Code không tồn tại → render 404 page (không crash)
- Status update realtime (không cần refresh)
- Status `cancelled` → hiển thị "Đã hủy", không hiện cancel button
- "Đang kết nối..." khi `connectionStatus = disconnected`
- Cancel confirm dialog trước khi gửi request (tránh miss-tap)
- Cancel gọi đúng `POST /api/orders/[code]/cancel` (không phải DELETE)

---

### #50 · Dashboard — Realtime spike (làm trước, đầu M2)

**Labels:** `backend`, `frontend`
**Blocked by:** #26, #45

**Note:** Spike nhỏ validate Realtime hoạt động trước khi build full UI. Nếu Realtime có vấn đề → phát hiện sớm.

**Scope:**

- Trang dashboard tối giản: list orders từ `GET /api/orders`
- Subscribe `useOrderQueue`, log ra console khi có event
- Verify event trigger khi insert/update order thủ công trên Supabase Dashboard

**AC:**

- Insert order qua Supabase Dashboard → console log event trong < 2 giây
- Update status → console log event
- Reconnect sau khi ngắt mạng → event tiếp tục nhận

---

### #51 · Dashboard — order list + status actions

**Labels:** `frontend`, `backend`
**Blocked by:** #50, #41, #44

**Scope:**

- `app/dashboard/page.tsx` + `components/dashboard/`
- `OrderCard` — order_code, pickup_name, items, thời gian đặt, status badge, action buttons
- `StatusBadge` — color-coded: mới (xanh), đang làm (vàng), xong (xám)
- Action buttons: "Bắt đầu làm" (new→making), "Hoàn thành" (making→done), "Hủy" (new→cancelled, owner)
- Realtime tích hợp từ `useOrderQueue`

**AC:**

- Order mới tự xuất hiện không cần refresh
- Status update → OrderCard cập nhật ngay, không flash
- Connection status indicator ở header ("Live" / "Đang kết nối lại...")
- Owner cancel (new→cancelled) → card biến mất khỏi active tabs

---

### #52 · Dashboard — sound + filter tabs

**Labels:** `frontend`, `ux`
**Blocked by:** #51

**Scope:**

- Sound notification khi có order mới (Web Audio API oscillator, không cần file âm thanh)
- Banner "Nhấn để bật thông báo âm thanh" hiển thị lần đầu (trước khi có user interaction)
- `document.title` badge: `(n) Vibe Cafe` khi có n orders mới chưa xem
- Highlight card order mới (animation brief khi xuất hiện)
- Filter tabs: **Tất cả** (GET không status, cursor paginate) / **Mới** (?status=new) / **Đang làm** (?status=making) / **Xong** (= `done` + `cancelled`)
  - Tab "Xong": khi implement chọn 1 pattern — **2 API calls song song** hoặc **1 call không status rồi filter client**; ghi vào API_CONTRACT trước khi code
- Tab count badge (số order trong mỗi tab)
- Unlock audio context sau first user interaction (click bất kỳ trên trang)

**AC:**

- Sound chỉ trigger khi tab active (`document.visibilityState = 'visible'`)
- Sound KHÔNG trigger nếu chưa có user interaction (tránh autoplay block)
- Banner biến mất sau khi user click lần đầu
- `document.title` cập nhật khi có order mới, reset khi tab "Mới" được xem
- Tab "Xong" hiển thị cả orders `done` lẫn `cancelled`
- Filter state persist khi Realtime update list (không reset về "Tất cả")
- Badge count cập nhật realtime

---

### #53 · Loading & empty states

**Labels:** `frontend`, `ux`
**Blocked by:** #46, #47, #49, #51

**Scope:**

- Skeleton loader cho: menu page (cards), dashboard (order cards), tracking page
- Empty state cho: cart trống, dashboard không có order trong tab hiện tại
- Error state cho: API lỗi, network timeout (nút retry)

**AC:**

- Skeleton xuất hiện ngay khi navigate (< 100ms)
- Không có layout shift khi data load xong
- Empty state có CTA hữu ích (không chỉ text "Chưa có gì")

---

## Milestone 3 — Admin + Ship

### #76 · Admin — product list + availability toggle

**Labels:** `frontend`, `backend`
**Blocked by:** #36, #25

**Scope:**

- `app/admin/page.tsx` — owner only (redirect nếu không auth)
- List products group theo category, kể cả `is_available = false`
- `AvailabilityToggle` — switch is_available, optimistic update
- `GET /api/products` — list tất cả products (kể cả unavailable) cho admin list, group theo category
- API: `PATCH /api/products/[id]/availability` body `{ is_available: boolean }` (khớp API_CONTRACT)

**AC:**

- Toggle: UI cập nhật ngay (optimistic), rollback + toast error nếu API lỗi
- Sau toggle `is_available = false` → product ẩn khỏi menu (verify bằng refresh menu page)
- Unauthenticated gọi PATCH → 401

---

### #111 · Admin — add/edit product (fields only)

**Labels:** `frontend`, `backend`
**Blocked by:** #36, #76

**Scope:**

- `ProductForm` — name, description, price (VND integer), category (dropdown từ API), is_available
- `POST /api/products` (tạo mới) + `PATCH /api/products/[id]` (edit) — khớp `API_CONTRACT.md`
- Validation inline (không chỉ submit)
- Soft delete: nút "Xóa" → `DELETE /api/products/:id` (khớp API_CONTRACT) — server set `deleted_at = now()`, không hard delete

**AC:**

- Price = 0 hoặc âm → inline validation error, không submit
- Category required
- Edit load đúng data hiện tại vào form
- DELETE → 200, product biến mất khỏi list admin, không xuất hiện trên menu
- DELETE product đã có orders → vẫn soft delete được (orders giữ snapshot)

---

### #113 · Admin — product options management

**Labels:** `frontend`, `backend`
**Blocked by:** #111

**Scope:** (tách từ #111 — đủ phức tạp để là issue riêng)

> ⚠️ **Prerequisite:** `POST/PATCH/DELETE /api/products/[id]/options` **chưa có trong `docs/API_CONTRACT.md`** — cần bổ sung contract trước khi implement. Implement theo contract đã thống nhất, không tự định nghĩa API path.

- Thêm/sửa/xóa option groups (name, type: select|multi) cho product
- Thêm/sửa/xóa option values (name, extra_price) trong mỗi group
- UI: accordion hoặc inline editor trong ProductForm

**AC:**

- Xóa option group → xóa luôn tất cả values của group đó
- extra_price âm → validation error
- type `select` + `multi` toggle được, warning nếu đã có orders dùng option này
- Soft delete option: `deleted_at = now()`, không hard delete

---

### #114 · Admin — image upload

**Labels:** `frontend`, `backend`
**Blocked by:** #21, #111

**Scope:**

- Upload flow: chọn file → preview → `POST /api/upload/product-image` (khớp API_CONTRACT) → lấy public URL → lưu vào `product.image_url`
- API: validate file type (MIME) + size (≤ 2MB) → upload Supabase Storage → trả `{ url }`
- Tích hợp vào `ProductForm` (replace hoặc thêm ảnh)

**AC:**

- File > 2MB → reject với message rõ ràng **trước** khi gửi request (client-side check)
- File không phải JPG/PNG/WebP → reject
- Preview hiển thị trước khi save form
- Upload fail (network) → toast error, không save URL rác vào DB
- Old image không bị xóa tự động khi upload ảnh mới (Phase 2 cleanup)

---

### #81 · Admin — category management

**Labels:** `frontend`, `backend`
**Blocked by:** #36, #25

**Scope:**

- UI: list categories với sort_order, thêm/sửa/xóa
- API: `GET /api/categories`, `POST /api/categories`, `PATCH /api/categories/[id]`, `DELETE /api/categories/[id]` (soft delete) — khớp API_CONTRACT
- `CategoryRepository` — CRUD với `deleted_at IS NULL` filter

**AC:**

- Xóa category còn **bất kỳ product nào chưa soft-delete** (`deleted_at IS NULL`, kể cả `is_available = false`) → 422 `CATEGORY_HAS_PRODUCTS`
- Xóa category không còn product nào (`deleted_at IS NULL`) → soft delete thành công
- Thêm category → xuất hiện trên menu nếu sau đó có products is_available
- sort_order drag-or-input để sắp xếp

---

### #115 · Bank transfer env vars + config

**Labels:** `setup`, `backend`
**Blocked by:** #16
**Note:** Prerequisite của #40 (POST /api/orders trả bank_transfer_info) và #48 (success screen bank block)

**Scope:**

- Thêm vào `.env.example`:
  - `BANK_NAME` (server-only — hiển thị trong API response)
  - `BANK_ACCOUNT_NUMBER` (server-only)
  - `BANK_ACCOUNT_NAME` (server-only)
  - `NEXT_PUBLIC_BANK_QR_IMAGE_URL` (public — server đọc và đưa vào `bank_transfer_info.qr_image_url` trong API response; client chỉ render URL nhận được)
- `lib/config/bank.ts` — đọc env, export `getBankTransferInfo()` (server-side only)
- Set đủ trên Vercel Dashboard (thêm vào #118)

**AC:**

- `getBankTransferInfo()` không thể import ở client-side
- Thiếu `BANK_NAME` hoặc `BANK_ACCOUNT_NUMBER` → server log warning, `bank_transfer_info = null`
- `.env.example` có đủ 4 biến với comment giải thích

---

### #116 · PWA manifest + meta tags

**Labels:** `ux`, `deploy`
**Blocked by:** #16

**Scope:**

- `public/manifest.json` — name, short_name, start_url (`/menu`), display (`standalone`), theme_color
- Icons: 192×192, 512×512 PNG
- `apple-touch-icon`
- Open Graph tags trong `app/layout.tsx` (title, description, og:image)
- `NEXT_PUBLIC_APP_URL` dùng cho canonical URL và QR link

**AC:**

- Lighthouse PWA score ≥ 80 (manifest + HTTPS + icons)
- "Add to Home Screen" prompt trên Android Chrome
- Share link trên Zalo/Facebook hiển thị đúng title + image
- Service worker **không** bắt buộc ở Phase 1 (có thể bổ sung Phase 2)

---

### #79 · Error pages

**Labels:** `frontend`, `ux`
**Blocked by:** #16

**Scope:**

- `app/not-found.tsx` — 404: "Trang không tồn tại", link về `/menu`
- `app/error.tsx` — runtime error: "Có lỗi xảy ra", nút "Thử lại"
- `app/global-error.tsx` — critical error boundary (toàn app)

**AC:**

- `/order/code-sai` → 404 page (không crash, không stack trace)
- Error boundary bắt được lỗi JS runtime trong Client Component
- Trang thân thiện, không expose stack trace lên production

---

### #78 · Redirect / → /menu

**Labels:** `setup`
**Blocked by:** #16

**Scope:**

- `next.config.js` — permanent redirect `/` → `/menu`

**AC:**

- Scan QR link `/` → land on `/menu`
- HTTP 308 redirect (permanent, không 302)

---

### #117 · Smoke test checklist

**Labels:** `deploy`
**Blocked by:** tất cả feature issues

**Scope:** Manual test checklist trước deploy production:

**Happy path — Customer:**

- [ ] QR scan `/` → redirect `/menu` → hiển thị đủ products và categories
- [ ] Thêm sản phẩm có options (select + multi) vào cart, giá đúng
- [ ] Submit order cash → nhận order_code, wait_estimate string, redirect success screen
- [ ] Submit order bank_transfer → success screen hiển thị bank info block
- [ ] Tracking page `/order/[code]` load đúng, status realtime update trong < 2 giây
- [ ] Cancel order (status new) từ tracking page → confirm dialog → "Đã hủy"

**Happy path — Owner:**

- [ ] Owner đăng nhập `/login` → redirect `/dashboard`
- [ ] Order mới xuất hiện realtime trên dashboard (không refresh)
- [ ] "Bắt đầu làm" → status → making; "Hoàn thành" → done
- [ ] Filter tab "Mới" chỉ hiện orders new; badge count đúng
- [ ] Sound notification khi order mới (sau khi click vào trang)
- [ ] Admin: toggle availability → menu khách ẩn/hiện product
- [ ] Admin: thêm product mới → xuất hiện trên menu

**Edge cases:**

- [ ] Submit order khi product vừa `is_available = false` → warning đúng, product bị xóa khỏi giỏ
- [ ] Cancel order `status = making` → error toast "Không thể hủy đơn đang làm"
- [ ] Gửi 11 requests `/api/orders` trong 1 phút → request thứ 11 → 429 + toast retry
- [ ] `pickup_name = "<script>alert(1)</script>"` → success screen render plain text
- [ ] Upload ảnh 3MB → reject trước khi upload, message rõ
- [ ] `/order/code-khong-ton-tai` → 404 page thân thiện
- [ ] Tắt mạng → dashboard hiển thị "Đang kết nối lại...", reconnect khi có mạng
- [ ] Unauthenticated gọi `PATCH /api/orders/[id]/status` → 401

**Security:**

- [ ] POST `/api/orders` với `price` trong body → response price đúng (server-calculated, không phải client)
- [ ] POST `/api/orders` với `payment_method = momo` → 400 `VALIDATION_ERROR`
- [ ] POST `/api/orders/wrong-code/cancel` → 404 ORDER_NOT_FOUND
- [ ] DELETE category còn active products → 422 CATEGORY_HAS_PRODUCTS
- [ ] GET `/order/[code]` response không có field `wait_estimate`

**Build:**

- [ ] `npm run build` → 0 errors, 0 type errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm test` → tất cả unit tests pass (sau #54)

---

### #118 · Deploy to Vercel

**Labels:** `deploy`
**Blocked by:** #117

**Scope:**

- Connect GitHub repo → Vercel
- Set đủ **10 env vars** trên Vercel Dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `NEXT_PUBLIC_APP_URL`
  - `BANK_NAME`
  - `BANK_ACCOUNT_NUMBER`
  - `BANK_ACCOUNT_NAME`
  - `NEXT_PUBLIC_BANK_QR_IMAGE_URL`
- Production build verify
- Preview deploy tự động cho mỗi PR

**AC:**

- `npm run build` clean (0 errors)
- `npm test -- --ci` pass (sau khi #54 hoàn thành — thêm job `test` vào `.github/workflows/ci.yml`)
- App live, Realtime hoạt động trên production
- Vercel preview deploy tự động khi push branch mới

---

## Dependency Graph

```
#16  → #17, #23, #116, #79, #78, #115
#17  → #24, #36, #38, #45, #25
#18  → #20, #22, #36
#19  → #20, #22, #38, #26
#25 → #36, #38, #41, #44, #76, #81
#26 → #45, #50
#23  → #39, #54
#36 → #37, #39, #76, #111, #81
#38 → #39, #43, #44
#39 → #40, #41, #42, #54
#40 → #47
#41 → #51, #76
#42 → #49
#43 → #49
#44 → #51
#45 → #46, #47, #49, #50
#50 → #51
#51 → #52
#37 → #46
#46 → #53
#47 → #48, #53
#49 → #53
#51 → #53
#21  → #114
#111 → #114, #113
#115 → #40, #48, #118
#46, #47, #48, #49, #51, #52, #53 → #117
#76, #111, #114, #116, #79, #78, #113, #81, #115 → #117
#117 → #118
```

---

## Changelog

| Version | Thay đổi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1      | 35 issues ban đầu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| v2      | +5 issues mới (#25–#81); sửa #18 (extension), #19 (xóa deleted_at orders, thêm payment_method, TZ), #20 (RLS scope + service_role note), #22 (idempotent seed), #23 (payment_method types/validators), #24 (API 401 AC), #36 (listAllForAdmin), #38 (xóa softDelete, fix cancel model), #39 (xóa making→cancelled, option validation), #40 (wait_estimate string, payment_method), #41 (thêm requireOwner), #42 (POST cancel, không DELETE), #43 (không expose UUID), #44 (filter hôm nay, pagination note), #45 (align REALTIME.md, reconnect), #47 (payment_method radio, max length), #48 (bank block, đặt thêm), #49 (cancel API đúng path), #24 (tách spike #50 + #51), #52 (Web Audio unlock), #76 (fix API path), #111 (scope chỉ fields), #114 (fix API path), #78 (blocked by #16), #117 (thêm payment/security/build checks), #118 (6 env vars); cập nhật dependency graph |
| v3      | +1 issue mới (#115 bank env vars); sửa #18 (deleted_at cho product_options/values), #20 (SELECT policy orders anon rõ ràng), #23 (order note max 500 vs item note max 200), #37 (bỏ is_available khỏi response), #39 (countPending(), clarify formula), #40 (bank_transfer_info trong response, RATE_LIMITED body), #43 (bỏ wait_estimate khỏi GET by code), #44 (cursor pagination, default behavior), #52 (banner sound + title badge + tab Xong = done+cancelled), #111 (soft delete = DELETE /api/products/:id), #118 (10 env vars), #113 (prerequisite API_CONTRACT update), #81 (AC: 422 CATEGORY_HAS_PRODUCTS); cập nhật dependency graph                                                                                                                                                                                                                                   |
| v3.1    | sửa #117 (tách bullet payment_method=momo vs rate-limit), #47 (order note max 500 không phải 200), #44 (cursor dùng uuid_v7 khớp API_CONTRACT)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| v4      | Tạo 6 issues còn thiếu trên GitHub (#113 product options, #114 image upload, #115 bank transfer config, #116 PWA manifest, #117 smoke test, #118 deploy); cập nhật toàn bộ số issue trong doc sang số GitHub thực tế                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
