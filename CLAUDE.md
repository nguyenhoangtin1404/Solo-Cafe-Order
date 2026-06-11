# Vibe Cafe Order — Claude Context

## Project Purpose

PWA ordering system cho quán cafe take-away solo operator. Khách scan QR → xem menu → gửi order → chủ quán nhận realtime → hoàn thành.

Triết lý: **Tiny but delightful** — không build POS enterprise, chỉ cần nhanh, đơn giản, dễ dùng.

## Tech Stack

| Layer         | Tech                                                        |
| ------------- | ----------------------------------------------------------- |
| Frontend      | Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui |
| Backend       | Next.js API Routes                                          |
| Database      | PostgreSQL via Supabase                                     |
| Realtime      | Supabase Realtime                                           |
| Storage       | Supabase Storage                                            |
| Auth          | Supabase Auth                                               |
| Rate Limiting | Upstash Redis + @upstash/ratelimit                          |
| Deploy        | Vercel                                                      |

## Repository Structure

```
app/
  menu/page.tsx          # Public: QR menu khách xem
  cart/page.tsx          # Public: giỏ hàng
  order-success/page.tsx # Public: màn hình sau gửi order
  order/[code]/page.tsx  # Public: tracking page — xem status realtime + cancel
  login/page.tsx         # Owner: đăng nhập
  dashboard/page.tsx     # Owner: realtime queue
  admin/page.tsx         # Owner: quản lý menu
  api/                   # API routes
middleware.ts            # Bảo vệ /dashboard và /admin
layout.tsx

components/
  menu/                  # MenuCard, CategoryTabs, ProductModal
  cart/                  # CartItem, CartSummary
  dashboard/             # OrderCard, StatusBadge
  admin/                 # ProductForm, AvailabilityToggle
  ui/                    # shadcn/ui components

lib/
  supabase.ts            # Supabase client (browser + server)
  services/              # Business logic layer
  repositories/          # DB access layer
  constants.ts
  utils.ts
  validators.ts

hooks/                   # Custom React hooks

types/
  product.ts
  order.ts
  customer.ts

supabase/
  migrations/            # SQL migration files
  seed.sql
  policies.sql
```

## Domain Rules — PHẢI BIẾT

### Order

- Status flow: `new` → `making` → `done` | `cancelled`
- **Cancel khi status = `new`** — cả owner lẫn khách đều cancel được (khách dùng order_code)
- Không sửa giá sau khi order đã submitted
- `order_code` sinh bởi **DB function** (không sinh trong app code — tránh race condition)
- Format hiển thị: `A001`...`A999` → `B001`..., reset hàng ngày (không có `#`)
- `pickup_name` (nullable): tên khách để owner gọi khi xong đồ
- `customer_ref` (nullable): dành cho Phase 3 loyalty — đã có sẵn trong schema
- `wait_estimate`: tính khi submit — số pending orders × 3 phút, hiển thị dạng range

### Product

- `is_available = false` → ẩn khỏi menu khách
- Giá luôn là VND (integer > 0, không dùng float)
- Có thể có options (size, topping) với `extra_price`
- Image: JPG/PNG/WebP, max 2MB

### Cart

- Chỉ tồn tại client-side (localStorage)
- **Validate lại `is_available` khi submit** — không trust cart state
- Clear cart sau khi submit thành công

### Auth

- Khách **không cần login**
- Chỉ owner cần auth để vào `/dashboard` và `/admin`
- Route guard qua `middleware.ts` + `@supabase/ssr`

### Security

- `POST /api/orders` có rate limit: 10 req/phút/IP (Upstash)
- **Client không gửi price** — server tự tính `unit_price` từ DB (`product.price + sum(option extra_price)`)
- Sanitize `pickup_name` và `note` — không cho XSS

### Owner Account

- **1 account cố định** — tạo sẵn trên Supabase Dashboard, không có trang signup
- Owner chỉ dùng `/login` (email + password)

## Database Schema (đầy đủ)

```sql
-- categories  (soft delete)
id uuid PK, name varchar, sort_order int NOT NULL, created_at timestamptz,
deleted_at timestamptz           -- NULL = active; soft delete only

-- products  (soft delete)
id uuid PK, category_id uuid FK, name varchar, description text,
price int (VND > 0), image_url varchar, is_available boolean NOT NULL DEFAULT true,
created_at timestamptz,
deleted_at timestamptz           -- NULL = active; soft delete only

-- product_options  (soft delete)
id uuid PK, product_id uuid FK, name varchar, type varchar ('select'|'multi'),
deleted_at timestamptz           -- NULL = active; soft delete only

-- product_option_values  (soft delete)
id uuid PK, option_id uuid FK, name varchar, extra_price int NOT NULL DEFAULT 0,
deleted_at timestamptz           -- NULL = active; soft delete only

-- orders  (KHÔNG có deleted_at — cancel = status 'cancelled')
id uuid PK
order_code varchar               -- sinh bởi DB function; UNIQUE mỗi ngày (composite index với date HCM)
status varchar DEFAULT 'new'     -- new | making | done | cancelled
total_amount int                 -- snapshot VND
payment_method varchar NOT NULL DEFAULT 'cash'  -- cash | bank_transfer
pickup_name varchar              -- nullable, tên khách lấy đồ
note text                        -- ghi chú toàn đơn
customer_ref varchar             -- nullable, dành cho Phase 3
cancelled_by varchar             -- nullable: customer | owner (audit trail)
created_at timestamptz
updated_at timestamptz           -- auto-update via trigger

-- order_items  (KHÔNG có deleted_at — item gắn liền với order)
id uuid PK, order_id uuid FK, product_id uuid (soft ref, no FK),
product_name varchar (snapshot), quantity int > 0,
unit_price int (snapshot VND),
selected_options jsonb NOT NULL DEFAULT '[]' (snapshot: [{option_name, value_name, extra_price}]),
note text
```

## Architecture

```
Client → Next.js API Route (Controller)
       → Service (business logic)        lib/services/
       → Repository (DB access)          lib/repositories/
       → Supabase (PostgreSQL)
```

- Controller (API Route): validate input shape, gọi service, map response — **không chứa logic**
- Service: enforce business rules, orchestrate calls — **không gọi Supabase trực tiếp**
- Repository: CRUD qua Supabase client — **không chứa logic nghiệp vụ**
- Không bypass layer (API Route không gọi Supabase trực tiếp)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side only
UPSTASH_REDIS_REST_URL=          # rate limiting
UPSTASH_REDIS_REST_TOKEN=        # rate limiting
```

Xem `.env.example`. Không hardcode. Không commit `.env.local`.

## Coding Rules — BẮT BUỘC

- Không dùng `any` trong TypeScript
- Function ≤ 50 dòng, Class ≤ 300 dòng
- Không business logic trong API Route — luôn qua Service
- Service không gọi Supabase trực tiếp — qua Repository
- Validate tất cả input ở boundary (API routes)
- Server validate lại price — không trust client
- Error response format: `{ "code": "ERROR_CODE", "message": "..." }`
- Không hardcode config, không biến global
- Mobile-first UI (tap targets ≥ 44px)
- Sanitize user input (`pickup_name`, `note`) trước khi lưu
- **Không bao giờ hard delete** — luôn soft delete (`deleted_at = now()`)
- **Tất cả PK dùng UUID v7** (`uuid_generate_v7()`) — không dùng `gen_random_uuid()`
- Queries luôn filter `WHERE deleted_at IS NULL` trừ khi cần lấy deleted records

## Error Codes

`VALIDATION_ERROR` | `ORDER_NOT_FOUND` | `PRODUCT_NOT_FOUND` | `CATEGORY_NOT_FOUND` | `PRODUCT_UNAVAILABLE` | `INVALID_STATUS_TRANSITION` | `CAFE_CLOSED` | `UNAUTHORIZED` | `FORBIDDEN` | `RATE_LIMITED` | `INTERNAL_ERROR`

## Development Commands

```bash
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

## MVP Scope (Phase 1 — ~3 tuần)

- [ ] Setup Next.js + Supabase + rate limiting
- [ ] DB schema + migrations + seed
- [ ] Owner auth + middleware bảo vệ route
- [ ] Menu page + product modal (public)
- [ ] Cart logic + validate availability khi submit
- [ ] Submit order API (với rate limit + wait_estimate)
- [ ] Order success screen (order_code, pickup_name, items, wait_estimate)
- [ ] Order tracking page /order/[code] (realtime + cancel by customer)
- [ ] Realtime dashboard (owner, âm thanh khi order mới, filter tabs)
- [ ] Order status update
- [ ] Basic admin panel (list, toggle, add/edit product, upload ảnh)
- [ ] Deploy to Vercel

## Phases

1. **QR Menu MVP** — khách scan QR, gửi order, owner nhận realtime + quản lý menu
2. **Operations** — doanh thu, QR code print, mobile optimization
3. **Loyalty** — points, voucher (customer_ref đã sẵn sàng từ Phase 1)
4. **Gamification** — lucky wheel, secret menu, mini game

## Skill Commands

- `/new-page` — tạo Next.js page mới theo chuẩn project
- `/new-component` — tạo React component mới
- `/new-api` — tạo API route mới
- `/add-migration` — tạo Supabase migration mới

---

## Communication Rules

- **Luôn trả lời bằng tiếng Việt**
- **Gọi người dùng bằng tên "Mon"**

---

## AI Behavior Guidelines (Karpathy-Inspired)

Behavioral guidelines to reduce common LLM coding mistakes. **Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
