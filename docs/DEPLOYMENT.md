# Deployment Guide

## Stack triển khai

| Service | Platform |
|---|---|
| Frontend + API Routes | Vercel |
| Database + Auth + Storage + Realtime | Supabase |
| Rate Limiting | Upstash Redis |

---

## Lần đầu deploy

### 1. Supabase — Tạo project

1. Vào [supabase.com](https://supabase.com) → New project
2. Chọn region gần nhất (Asia Southeast — Singapore)
3. Lưu **Database Password** an toàn

### 2. Supabase — Chạy migrations

```bash
# Cài Supabase CLI
npm install -g supabase

# Login
supabase login

# Link tới project
supabase link --project-ref <your-project-ref>

# Push tất cả migrations
supabase db push
```

Migrations nằm trong `supabase/migrations/` — chạy theo thứ tự `timestamp_*.sql`.

### 3. Supabase — Seed dữ liệu

```bash
# Chạy seed (categories + products mẫu)
supabase db reset --linked   # staging only — xóa data trước khi seed
# hoặc chạy thủ công:
psql "$DATABASE_URL" < supabase/seed.sql
```

### 4. Supabase — Tạo owner account

Vào Supabase Dashboard → Authentication → Users → "Add user":
- Email: email của owner
- Password: mật khẩu mạnh
- **Không có trang signup** — chỉ tạo 1 lần ở đây

### 5. Supabase — Bật Realtime

Dashboard → Database → Replication → bật `INSERT` + `UPDATE` cho bảng `orders`.

### 6. Supabase — Storage bucket

Dashboard → Storage → New bucket:
- Name: `product-images`
- Public: **Yes** (ảnh menu cần public URL)

Thêm policy:

```sql
-- Cho phép public đọc ảnh
CREATE POLICY "public_read_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Chỉ owner (authenticated) mới upload
CREATE POLICY "owner_upload_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Chỉ owner mới xóa
CREATE POLICY "owner_delete_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

### 7. Upstash — Tạo Redis

1. Vào [console.upstash.com](https://console.upstash.com) → Create Database
2. Region: `ap-southeast-1` (Singapore)
3. Lưu `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`

### 8. Vercel — Deploy

```bash
# Cài Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Hoặc connect GitHub repo trên Vercel Dashboard → tự động deploy khi push.

### 9. Vercel — Thiết lập Environment Variables

Vào Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Env |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `UPSTASH_REDIS_REST_URL` | Production, Preview |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview |

> `NEXT_PUBLIC_APP_URL` = URL production, ví dụ `https://your-cafe.vercel.app`

---

## Reset `order_code` hàng ngày

`order_code` format `A001–Z999` reset mỗi ngày. Cần DB function + trigger tự động reset counter lúc 00:00 (hoặc tính từ `created_at` ngay trong function).

**Cách đơn giản**: DB function đã tự check `DATE(created_at) = CURRENT_DATE` khi sinh code — không cần cron job.

Xem chi tiết trong migration: `supabase/migrations/*_order_code_function.sql`

---

## Vercel Preview Deployments

- Mỗi PR tự động tạo Preview URL
- Preview dùng **Staging Supabase project** (riêng biệt với production)
- Staging env vars đặt ở Vercel → Environment: `Preview`

---

## Custom Domain

Vercel Dashboard → Project → Settings → Domains → Add domain.

Sau khi thêm domain, cập nhật `NEXT_PUBLIC_APP_URL` và QR code trỏ đến domain mới.

---

## Sau mỗi migration mới

```bash
# Push migration lên production Supabase
supabase db push

# Vercel tự redeploy nếu code đã push lên GitHub
# Hoặc trigger thủ công:
vercel --prod
```

---

## Rollback

### Rollback code
Vercel Dashboard → Deployments → chọn deployment cũ → "Promote to Production"

### Rollback database
Viết migration `down` thủ công — Supabase không có built-in rollback.

> Luôn test migration trên staging trước khi apply production.

---

## Health Check

Sau khi deploy, kiểm tra:

- [ ] `GET /api/menu` trả về data, chỉ có sản phẩm `is_available = true`
- [ ] `/login` đăng nhập được bằng owner account
- [ ] `/dashboard` hiển thị realtime dot xanh
- [ ] Thêm order test → dashboard nhận được + âm thanh + badge trên tab title
- [ ] Đổi status order → khách tracking thấy cập nhật realtime
- [ ] Upload ảnh sản phẩm trong `/admin`
- [ ] `POST /api/orders` 11 lần từ cùng IP → lần 11 nhận 429 `RATE_LIMITED`
- [ ] Soft delete product → vẫn hiển thị đúng trong order history cũ
- [ ] Order code format đúng `A001`–`Z999`, không có `#`
