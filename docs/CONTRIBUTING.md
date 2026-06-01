# Contributing Guide

## Yêu cầu

- Node.js 20+
- npm 10+
- Git

## Setup local

```bash
git clone https://github.com/nguyenhoangtin1404/vibe-cafe-order.git
cd vibe-cafe-order
npm install
cp .env.example .env.local
# Điền env vars — xem docs/ENV.md
npm run dev
```

---

## Workflow

### Tạo branch

```
feat/ten-tinh-nang      # tính năng mới
fix/ten-bug             # sửa bug
docs/ten-tai-lieu       # cập nhật tài liệu
refactor/ten-phan       # refactor
```

Ví dụ: `feat/order-tracking`, `fix/cart-validation`

### Commit message

Theo **Conventional Commits**. Format:

```
<type>(<scope>): <mô tả ngắn>
```

Types hợp lệ: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Ví dụ:
```
feat(order): thêm màn hình tracking realtime
fix(cart): validate is_available khi submit
docs(api): cập nhật contract endpoint cancel
```

- Mô tả viết tiếng Việt hoặc tiếng Anh đều được
- Subject tối đa 100 ký tự
- Không dùng dấu chấm cuối subject

### Pull Request

1. Tạo PR vào `main`
2. Title theo format commit message
3. Mô tả ngắn what + why trong PR body
4. Tự review diff trước khi request review

---

## Code Standards

### TypeScript

- `strict: true` — không dùng `any`
- Định nghĩa type rõ ràng, không dùng `object` chung chung
- Function ≤ 50 dòng

### Architecture

```
API Route → Service → Repository
```

- API Route: validate input shape, gọi service, return response
- Service: business logic, không gọi Supabase trực tiếp
- Repository: Supabase queries, không chứa logic

### Coding style

- Không comment giải thích "cái gì" — đặt tên tốt là đủ
- Comment chỉ khi lý do không rõ ràng (workaround, invariant ẩn)
- Mobile-first: tap targets ≥ 44px
- Không hardcode config, không biến global

### Database

- Tất cả PK dùng `uuid_generate_v7()` — không dùng `gen_random_uuid()`
- Không bao giờ hard delete — luôn soft delete (`deleted_at = now()`)
- Query luôn filter `WHERE deleted_at IS NULL`
- Migration mới: tạo file trong `supabase/migrations/` với timestamp prefix

---

## Linting & Type check

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # Jest unit tests
```

CI sẽ chạy cả 3 trên mỗi PR. PR không được merge nếu CI fail.

---

## Skill commands

Dùng slash commands để tạo file đúng chuẩn project:

```
/new-page          # tạo Next.js page mới
/new-component     # tạo React component mới
/new-api           # tạo API route mới
/add-migration     # tạo Supabase migration mới
```
