# Infrastructure Setup (Fresh Start)

Làm theo thứ tự — mỗi bước phụ thuộc bước trước.

---

## Bước 1 — Supabase

1. Tạo account tại [supabase.com](https://supabase.com)
2. New Project → đặt tên `solo-cafe-order` → chọn region Singapore (gần VN nhất)
3. Lấy keys từ **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Tạo **owner account** (1 account cố định, không có trang signup):
   - Supabase Dashboard → Authentication → Users → Invite user
   - Nhập email owner → gửi invite
   - Owner nhận email, set password → đây là account duy nhất để login `/dashboard` và `/admin`

---

## Bước 2 — Upstash Redis (Rate Limiting)

1. Tạo account tại [upstash.com](https://upstash.com)
2. Create Database → type: Redis → region: Singapore
3. Lấy keys từ **REST API** tab:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## Bước 3 — Setup Local

```bash
# Clone repo
git clone https://github.com/nguyenhoangtin1404/Solo-Cafe-Order.git
cd Solo-Cafe-Order

# Install dependencies
npm install

# Setup env
cp .env.example .env.local
# Điền 5 values từ bước 1 + 2 vào .env.local

# Chạy dev server
npm run dev
```

---

## Bước 4 — Vercel Deployment

1. Tạo account tại [vercel.com](https://vercel.com)
2. New Project → Import từ GitHub repo `Solo-Cafe-Order`
3. Environment Variables → thêm tất cả 5 biến từ `.env.local`
4. Deploy

### Staging vs Production

| | Supabase Project | Upstash | Vercel |
|---|---|---|---|
| **Staging** | Tạo project riêng tên `solo-cafe-staging` | Instance riêng | Preview Deployment (auto theo PR) |
| **Production** | Project chính | Instance chính | Production Deployment (từ `main`) |

> Vercel tự tạo Preview URL cho mỗi PR — dùng làm staging, không cần setup thêm.

---

## Bước 5 — Supabase Storage

1. Supabase Dashboard → Storage → New Bucket
2. Tên: `product-images`
3. Public: **bật** (ảnh menu public, khách xem được)
4. Allowed MIME types: `image/jpeg, image/png, image/webp`
5. File size limit: `2097152` (2MB)

---

## Checklist trước khi chạy

- [ ] Supabase project created
- [ ] Owner account created (Supabase Auth → Users)
- [ ] Upstash Redis created
- [ ] `.env.local` điền đủ 5 biến
- [ ] `npm run dev` chạy không lỗi
- [ ] Supabase Storage bucket `product-images` tạo xong
- [ ] DB schema chạy migration xong (`supabase db push` hoặc paste SQL vào Editor)
