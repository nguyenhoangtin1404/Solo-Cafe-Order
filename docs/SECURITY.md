# Security

## Threat Model

Đây là app quán cafe nhỏ. Attack surface chính:

| Threat | Risk | Mitigation |
|---|---|---|
| Spam orders | Cao | Rate limiting (Upstash) |
| XSS qua `pickup_name`/`note` | Trung | Sanitize input |
| Giá bị tamper từ client | Cao | Server tự tính price |
| Truy cập dashboard trái phép | Cao | Auth middleware |
| Enumeration `order_code` | Thấp | Code reset hàng ngày, ~25k combinations |
| SQL Injection | Thấp | Supabase parameterized queries |
| Ảnh độc hại upload | Trung | MIME check + max size |

---

## Rate Limiting

`POST /api/orders` bị giới hạn **10 request / phút / IP** bằng Upstash Redis.

```typescript
// app/api/orders/route.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return Response.json({ code: 'RATE_LIMITED', message: 'Quá nhiều yêu cầu' }, { status: 429 })
  }
  // ...
}
```

Chỉ `POST /api/orders` cần rate limit — các endpoint khác read-only hoặc đã có auth.

---

## Input Sanitization

Sanitize `pickup_name` và `note` trước khi lưu DB. Không dùng `innerHTML` để render.

```typescript
// lib/utils/sanitize.ts
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '')      // strip HTML tags
    .slice(0, 500)                // max length
}
```

Giới hạn độ dài:
- `pickup_name`: tối đa 50 ký tự
- `note` (order item): tối đa 200 ký tự
- `note` (order): tối đa 500 ký tự

---

## Server-side Price Calculation

**Client không bao giờ gửi price.** Client chỉ gửi:

```json
{
  "product_id": "uuid",
  "quantity": 2,
  "selected_option_value_ids": ["uuid-size-L", "uuid-topping-sugar"]
}
```

Server tra DB lấy `product.price` + `sum(option_value.extra_price)` → tính `unit_price`.

Nếu client gửi `price` field → server bỏ qua hoàn toàn.

---

## Authentication

### Owner routes

Middleware `middleware.ts` chặn `/dashboard` và `/admin` nếu không có Supabase session:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}
```

### API routes cho owner

Mỗi protected API route phải verify session server-side:

```typescript
const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return Response.json({ code: 'UNAUTHORIZED' }, { status: 401 })
}
```

Không tin vào middleware một mình — API routes phải tự check.

---

## Supabase Keys

| Key | Dùng ở đâu | Rule |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Safe to expose; bị giới hạn bởi RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (API Routes) | **KHÔNG expose client-side** — bypass RLS hoàn toàn |

API Routes dùng `service_role_key` để tránh phụ thuộc vào RLS config phức tạp. Auth check thực hiện trong code.

---

## Row Level Security (RLS)

RLS bật trên tất cả tables nhưng API Routes bypass qua `service_role_key`. RLS vẫn cần thiết để:
- Bảo vệ truy cập trực tiếp từ client nếu dùng Supabase client-side queries
- Bảo vệ Realtime subscriptions (xem `REALTIME.md`)

```sql
-- Bật RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- etc.
```

---

## Image Upload

Validate trước khi upload lên Supabase Storage:

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024  // 2MB

function validateImage(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Chỉ chấp nhận JPG, PNG, WebP')
  if (file.size > MAX_SIZE) throw new Error('Ảnh tối đa 2MB')
}
```

---

## Security Headers

Thêm vào `next.config.js`:

```js
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```

CSP chưa bật ở Phase 1 vì Supabase Realtime WebSocket cần cấu hình phức tạp — để Phase 2.

---

## Không cần lo (Phase 1)

- CSRF: Next.js App Router API Routes dùng `fetch` không tự động gửi cookies cross-origin
- DDoS: Vercel + Upstash tự xử lý ở tầng infrastructure
- Brute force login: Supabase Auth tự rate limit
