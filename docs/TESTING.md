# Testing Strategy

## Triết lý

Test những gì dễ sai, bỏ qua những gì hiển nhiên. Ưu tiên: **Service unit tests > API integration tests > E2E**.

---

## Stack

| Layer | Tool |
|---|---|
| Unit (Service, Utils) | Jest + ts-jest |
| Integration (API Routes) | Jest + `next/test` hoặc `supertest` |
| E2E | Playwright (Phase 2+) |

```bash
npm install --save-dev jest ts-jest @types/jest
```

---

## Cấu trúc thư mục

```
__tests__/
  services/
    order.service.test.ts
    product.service.test.ts
  repositories/           # mock Supabase client
  api/
    orders.test.ts
    menu.test.ts
  utils/
    validators.test.ts
    sanitize.test.ts
```

---

## Unit Tests — Services

Services chứa toàn bộ business logic → đây là layer quan trọng nhất cần test.

Mock repository layer, không mock service.

```typescript
// __tests__/services/order.service.test.ts
import { OrderService } from '@/lib/services/order.service'
import { OrderRepository } from '@/lib/repositories/order.repository'
import { ProductRepository } from '@/lib/repositories/product.repository'

jest.mock('@/lib/repositories/order.repository')
jest.mock('@/lib/repositories/product.repository')

describe('OrderService.submitOrder', () => {
  it('throws PRODUCT_UNAVAILABLE nếu product bị tắt', async () => {
    ;(ProductRepository.prototype.checkAvailability as jest.Mock)
      .mockResolvedValue([{ id: 'p1', is_available: false }])

    await expect(
      new OrderService().submitOrder({ items: [{ product_id: 'p1', quantity: 1 }] })
    ).rejects.toMatchObject({ code: 'PRODUCT_UNAVAILABLE' })
  })

  it('tính đúng total_amount từ product price + option extra_price', async () => {
    // setup mocks...
    // assert total_amount = sum(unit_price × quantity)
  })

  it('không cho phép price từ client — server tự tính unit_price', async () => {
    // client gửi price → service bỏ qua, dùng DB price
  })
})
```

### Cases cần test cho OrderService

- [ ] Submit thành công → trả về `order_code`
- [ ] Product `is_available = false` → throw `PRODUCT_UNAVAILABLE`
- [ ] `unit_price` tính đúng (price + option extra_price)
- [ ] `total_amount` tính đúng (sum unit_price × quantity)
- [ ] Cancel khi `status = new` → thành công
- [ ] Cancel khi `status = making` → throw `INVALID_STATUS_TRANSITION`
- [ ] Status transition hợp lệ: `new→making`, `making→done`, `new→cancelled`
- [ ] Status transition không hợp lệ: `done→making`, `cancelled→new`
- [ ] `wait_estimate` tính đúng: pending_orders_ahead × 3 phút

### Cases cần test cho ProductService

- [ ] Soft delete — set `deleted_at`, không DELETE SQL
- [ ] Toggle `is_available`
- [ ] Validate price > 0 (integer)
- [ ] Image URL hợp lệ sau upload

---

## Integration Tests — API Routes

Test HTTP contract: status code, response shape, error codes.

```typescript
// __tests__/api/orders.test.ts
import { POST } from '@/app/api/orders/route'
import { NextRequest } from 'next/server'

describe('POST /api/orders', () => {
  it('400 nếu items rỗng', async () => {
    const req = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('201 với payload hợp lệ', async () => {
    // mock service layer
  })
})
```

### Cases cần test cho API

- [ ] `POST /api/orders` — validation, rate limit, success
- [ ] `GET /api/menu` — chỉ trả về `is_available = true`
- [ ] `PATCH /api/orders/[id]/status` — auth required, transition rules
- [ ] `POST /api/orders/[code]/cancel` — cancel by customer

---

## Validators & Utils

```typescript
// __tests__/utils/validators.test.ts
describe('validateOrderInput', () => {
  it('reject items rỗng', ...)
  it('reject quantity <= 0', ...)
  it('reject pickup_name quá dài (> 50 ký tự)', ...)
  it('reject note quá dài (> 500 ký tự)', ...)
})

describe('sanitizeText', () => {
  it('strip HTML tags', ...)
  it('trim whitespace', ...)
  it('không alter text bình thường', ...)
})
```

---

## Chạy tests

```bash
npm test                  # watch mode
npm test -- --coverage    # với coverage report
npm test -- --ci          # CI mode (no watch)
```

---

## CI Integration

Tests chạy tự động trên mỗi PR qua GitHub Actions (xem `.github/workflows/ci.yml`).

Pipeline:
1. `npm run lint`
2. `npm run typecheck`
3. `npm test -- --ci`
4. `npm run build`

---

## Không cần test

- Next.js page components — UI logic quá ít, test bằng mắt / E2E
- Repository layer — chỉ là Supabase wrapper, test thật sẽ cần DB
- Supabase client setup
