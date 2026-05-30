# Architecture Design

## Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Realtime**: Supabase Realtime subscriptions
- **Auth**: Supabase Auth

---

## Layer Overview

```
Client (Browser)
  ↓
Next.js Page / Component
  ↓
Next.js API Route  ← Controller layer
  ↓
Service            ← Business logic
  ↓
lib/supabase.ts    ← Repository / DB access
  ↓
Supabase (PostgreSQL)
```

---

## Layers

### Controller — `app/api/**`
- Nhận HTTP request
- Validate input cơ bản (shape, required fields)
- Gọi Service
- Map và return response
- **Không chứa business logic**

### Service — `lib/services/**`
- Xử lý nghiệp vụ
- Điều phối flow (e.g. submit order → create order → create items → publish event)
- Quản lý error handling
- **Không gọi Supabase trực tiếp**

### Repository — `lib/repositories/**`
- CRUD và query database qua Supabase client
- Không chứa logic nghiệp vụ
- Return typed data hoặc throw lỗi cụ thể

### Types — `types/**`
- Shared TypeScript types/interfaces
- `product.ts`, `order.ts`, `customer.ts`
- Không phụ thuộc framework

---

## Data Flow — Submit Order

```
POST /api/orders
  → validate request body
  → OrderService.submitOrder()
    → ProductRepository.checkAvailability()
    → OrderRepository.create()
    → OrderRepository.createItems()
  → return { order_code }
```

---

## Realtime (Dashboard)

```
Owner Dashboard Page
  → useEffect: subscribe Supabase Realtime channel 'orders'
  → on INSERT/UPDATE: update local state
  → render order queue
```

---

## Auth Boundary

- Public routes: `/menu`, `/cart`, `/order-success` — không cần auth
- Protected routes: `/dashboard`, `/admin` — yêu cầu Supabase session
- Middleware: `middleware.ts` ở root, dùng `@supabase/ssr`

---

## Transaction Strategy

- Transaction (nếu cần) mở ở Service layer
- Mỗi submit order = 1 atomic operation
- Không nested transaction

---

## Security Rules

- API routes protected route phải check session server-side
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server-side, không expose client
- RLS (Row Level Security) bật trên tất cả Supabase tables
- Input sanitize ở Controller trước khi truyền xuống Service
