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
| Deploy | Vercel |

## Repository Structure

```
app/
  menu/page.tsx          # Public: QR menu khách xem
  cart/page.tsx          # Public: giỏ hàng
  order-success/page.tsx # Public: màn hình sau gửi order
  dashboard/page.tsx     # Owner: realtime queue
  admin/page.tsx         # Owner: quản lý menu
  api/                   # API routes
layout.tsx

components/
  menu/                  # MenuCard, CategoryTabs, ProductModal
  cart/                  # CartItem, CartSummary
  dashboard/             # OrderCard, StatusBadge
  admin/                 # ProductForm, AvailabilityToggle
  ui/                    # shadcn/ui components

lib/
  supabase.ts            # Supabase client (browser + server)
  constants.ts
  utils.ts
  validators.ts

hooks/                   # Custom React hooks

types/
  product.ts
  order.ts
  customer.ts

supabase/
  schema.sql
  seed.sql
  policies.sql
```

## Domain Rules — PHẢI BIẾT

### Order
- Status flow: `new` → `making` → `done` | `cancelled`
- Chỉ được cancel khi status = `new`
- Không sửa giá sau khi order đã submitted
- `order_code` sinh tự động (short, human-readable, e.g. `#A001`)

### Product
- `is_available = false` → ẩn khỏi menu khách
- Giá luôn là VND (integer, không dùng float)
- Có thể có options (size, topping) với `extra_price`

### Auth
- Khách **không cần login**
- Chỉ owner cần auth để vào `/dashboard` và `/admin`
- Route guard qua Supabase Auth middleware

## Database Schema (đầy đủ)

```sql
-- categories
id uuid PK
name varchar
sort_order int
created_at timestamp

-- products
id uuid PK
category_id uuid FK → categories.id
name varchar
description text
price int  -- VND
image_url varchar
is_available boolean DEFAULT true
created_at timestamp

-- product_options (ví dụ: "Size", "Topping")
id uuid PK
product_id uuid FK → products.id
name varchar
type varchar  -- 'select' | 'multi'

-- product_option_values (ví dụ: "M", "L", "XL")
id uuid PK
option_id uuid FK → product_options.id
name varchar
extra_price int DEFAULT 0

-- orders
id uuid PK
order_code varchar UNIQUE
status varchar  -- new | making | done | cancelled
total_amount int
note text
created_at timestamp

-- order_items
id uuid PK
order_id uuid FK → orders.id
product_id uuid FK → products.id
product_name varchar  -- snapshot tại lúc order
quantity int
unit_price int        -- snapshot tại lúc order
note text
```

## Architecture

```
Client → Next.js API Route (Controller)
       → Service (business logic)
       → Supabase client (Repository)
       → PostgreSQL
```

- Controller (API Route): validate input, gọi service, map response — không chứa logic
- Service: xử lý nghiệp vụ, orchestrate calls
- Không bypass layer (API Route không gọi Supabase trực tiếp)
- Transaction mở ở Service layer

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Xem `.env.example`. Không hardcode. Không commit `.env`.

## Coding Rules — BẮT BUỘC

- Không dùng `any` trong TypeScript
- Function ≤ 50 dòng, Class ≤ 300 dòng
- Không business logic trong API Route — luôn qua Service
- Service không gọi Supabase trực tiếp — qua Repository/lib
- Validate tất cả input ở boundary (API routes)
- Error response format: `{ "code": "ERROR_CODE", "message": "..." }`
- Không hardcode config, không biến global
- Mobile-first UI (target: tap trên mobile, không cần hover)
- Không hỏi AI tự quyết kiến trúc/nghiệp vụ — phải có spec trước

## Error Codes

`VALIDATION_ERROR` | `ORDER_NOT_FOUND` | `PRODUCT_NOT_FOUND` | `PRODUCT_UNAVAILABLE` | `INVALID_STATUS_TRANSITION` | `UNAUTHORIZED` | `FORBIDDEN` | `INTERNAL_ERROR`

## Development Commands

```bash
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

## MVP Scope (Phase 1)

- [ ] Setup Next.js + Supabase
- [ ] DB schema + seed
- [ ] Menu page (public)
- [ ] Product detail modal
- [ ] Cart logic
- [ ] Submit order API
- [ ] Realtime dashboard (owner)
- [ ] Order status update
- [ ] Deploy to Vercel

## Phases

1. **QR Menu MVP** — khách scan QR, gửi order được
2. **Operations** — order status, admin panel, revenue summary
3. **Loyalty** — points, voucher, buy-X-get-Y
4. **Gamification** — lucky wheel, secret menu, mini game

## Skill Commands

- `/new-page` — tạo Next.js page mới theo chuẩn project
- `/new-component` — tạo React component mới
- `/new-api` — tạo API route mới
- `/add-migration` — tạo Supabase migration mới
