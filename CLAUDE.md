# Solo Cafe Order — Claude Context

## Project Purpose

PWA ordering system cho quán cafe take-away solo operator. Khách scan QR → xem menu → gửi order → chủ quán nhận realtime → hoàn thành.

Triết lý: **Tiny but delightful** — không build POS enterprise, chỉ cần nhanh, đơn giản, dễ dùng.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL via Supabase |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| Auth | Supabase Auth |
| Rate Limiting | Upstash Redis + @upstash/ratelimit |
| Deploy | Vercel |

## Repository Structure

```
app/
  menu/page.tsx          # Public: QR menu khách xem
  cart/page.tsx          # Public: giỏ hàng
  order-success/page.tsx # Public: màn hình sau gửi order
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
- **Chỉ được cancel khi status = `new`**
- Không sửa giá sau khi order đã submitted
- `order_code` sinh bởi **DB function** (không sinh trong app code — tránh race condition)
- Format order_code: `A001`...`A999` → `B001`..., reset hàng ngày
- `pickup_name` (nullable): tên khách để owner gọi khi xong đồ
- `customer_ref` (nullable): dành cho Phase 3 loyalty — đã có sẵn trong schema

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
- Server validate lại `unit_price` với DB — không trust client price (`PRICE_MISMATCH`)
- Sanitize `pickup_name` và `note` — không cho XSS

## Database Schema (đầy đủ)

```sql
-- categories
id uuid PK, name varchar, sort_order int, created_at timestamp

-- products
id uuid PK, category_id uuid FK, name varchar, description text,
price int (VND > 0), image_url varchar, is_available boolean DEFAULT true,
created_at timestamp

-- product_options
id uuid PK, product_id uuid FK, name varchar, type varchar ('select'|'multi')

-- product_option_values
id uuid PK, option_id uuid FK, name varchar, extra_price int DEFAULT 0

-- orders
id uuid PK
order_code varchar UNIQUE       -- sinh bởi DB function
status varchar                  -- new | making | done | cancelled
total_amount int                -- snapshot VND
pickup_name varchar             -- nullable, tên khách lấy đồ
note text                       -- ghi chú toàn đơn
customer_ref varchar            -- nullable, dành cho Phase 3
created_at timestamp

-- order_items
id uuid PK, order_id uuid FK, product_id uuid FK (soft ref),
product_name varchar (snapshot), quantity int > 0,
unit_price int (snapshot VND), note text
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

## Error Codes

`VALIDATION_ERROR` | `ORDER_NOT_FOUND` | `PRODUCT_NOT_FOUND` | `CATEGORY_NOT_FOUND` | `PRODUCT_UNAVAILABLE` | `INVALID_STATUS_TRANSITION` | `PRICE_MISMATCH` | `UNAUTHORIZED` | `FORBIDDEN` | `RATE_LIMITED` | `INTERNAL_ERROR`

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
- [ ] Submit order API (với rate limit + price validation)
- [ ] Order success screen (order_code, pickup_name, items)
- [ ] Realtime dashboard (owner, reconnect khi mất mạng)
- [ ] Order status update
- [ ] Basic admin panel (list, toggle, add/edit product)
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
