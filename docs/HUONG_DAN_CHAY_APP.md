# Hướng dẫn chạy app — Vibe Cafe Order

Tài liệu này hướng dẫn **chạy app từ đầu trên máy local** (Windows / macOS / Linux). Làm theo thứ tự — mỗi bước phụ thuộc bước trước.

> **Tài liệu liên quan**
>
> | File | Nội dung |
> | ---- | -------- |
> | [`ENV.md`](./ENV.md) | Chi tiết biến môi trường |
> | [`SETUP.md`](./SETUP.md) | Setup hạ tầng (Supabase, Upstash, Vercel) |
> | [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deploy production |
> | [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md) | Hướng dẫn vận hành cho chủ quán |

---

## Tổng quan

**Vibe Cafe Order** là web app Next.js — khách đặt đồ qua QR, chủ quán quản lý order realtime trên dashboard.

```
Khách:  /menu  →  /cart  →  gửi order  →  /order/[code] (theo dõi)
Owner:  /login  →  /dashboard  |  /admin  |  /reports
```

**Stack cần chuẩn bị:**

| Thành phần | Dịch vụ | Miễn phí? |
| ---------- | ------- | --------- |
| Database, Auth, Storage, Realtime | [Supabase](https://supabase.com) | Có (free tier) |
| Rate limiting | [Upstash Redis](https://upstash.com) | Có (free tier) |
| Chạy app | Node.js local | — |

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
| ------- | ------------------- |
| [Node.js](https://nodejs.org) | **20+** (khuyến nghị LTS) |
| npm | 10+ (đi kèm Node) |
| Git | Bất kỳ |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | Mới nhất (để chạy migrations) |

Kiểm tra nhanh:

```bash
node -v    # v20.x.x trở lên
npm -v
git --version
```

---

## Bước 1 — Clone repo & cài dependencies

```bash
git clone https://github.com/nguyenhoangtin1404/Solo-Cafe-Order.git
cd Solo-Cafe-Order

npm install
```

> Script `ensure:deps` tự chạy `npm install` khi thiếu `node_modules` (khi gọi `lint`, `typecheck`, `test`).

---

## Bước 2 — Tạo Supabase project

1. Đăng ký / đăng nhập tại [supabase.com](https://supabase.com)
2. **New Project** → đặt tên ví dụ `vibe-cafe-order`
3. Chọn region **Singapore** (gần VN nhất)
4. Lưu **Database Password** an toàn
5. Vào **Project Settings → API**, copy 3 giá trị:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**bí mật — không commit, không share**)

Ghi chú **Project ref** (chuỗi ngắn trong URL, ví dụ `abcdefghijklmnop`) — cần cho Supabase CLI ở bước sau.

---

## Bước 3 — Chạy database migrations

Migrations nằm trong `supabase/migrations/`. Chúng tạo bảng, RLS policies, storage bucket, RPC functions, realtime publication.

### Cài Supabase CLI

```bash
npm install -g supabase
```

Hoặc trên Windows (PowerShell, không cần global):

```powershell
npx supabase --version
```

### Login & link project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

Nhập database password khi được hỏi.

### Push migrations lên Supabase

```bash
supabase db push
```

Nếu thành công, toàn bộ schema đã sẵn sàng (bao gồm bucket `product-images` qua migration).

### Chạy seed data (menu mẫu)

Seed file: `supabase/seed.sql` — thêm 4 danh mục, ~11 sản phẩm, options mẫu.

**Cách A — SQL Editor (đơn giản nhất):**

1. Supabase Dashboard → **SQL Editor**
2. Mở file `supabase/seed.sql` trong repo, copy toàn bộ nội dung
3. Paste → **Run**

**Cách B — psql (nếu đã cài PostgreSQL client):**

```bash
# Lấy connection string từ: Project Settings → Database → Connection string (URI)
psql "postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -f supabase/seed.sql
```

**Cách C — Supabase CLI (chỉ staging / project test):**

```bash
supabase db reset --linked   # ⚠️ XÓA toàn bộ data rồi replay migrations + seed
```

> Không dùng `db reset` trên production.

---

## Bước 4 — Tạo tài khoản Owner

App **không có trang đăng ký**. Chỉ có **1 tài khoản owner** để vào `/dashboard`, `/admin`, `/reports`.

### 4.1 Tạo user

Supabase Dashboard → **Authentication → Users → Add user** (hoặc Invite user):

- Email: email của bạn
- Password: mật khẩu mạnh
- Bật **Auto Confirm User** (nếu có)

### 4.2 Gán quyền admin (bắt buộc)

Supabase Dashboard → **Authentication → Users** → chọn user → **Edit user**:

Trong **App Metadata**, thêm:

```json
{
  "role": "admin"
}
```

Lưu lại. Không có bước này, login sẽ bị từ chối truy cập dashboard/admin.

---

## Bước 5 — Tạo Upstash Redis (rate limiting)

1. Đăng ký tại [upstash.com](https://upstash.com)
2. **Create Database** → type: **Redis** → region: **Singapore**
3. Tab **REST API** → copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

Rate limit bảo vệ API `POST /api/orders` khỏi spam.

---

## Bước 6 — Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền:

```env
# Local dev
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Bước 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash (Bước 5)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Tuỳ chọn — chuyển khoản & hỗ trợ khách
BANK_NAME=Vietcombank
BANK_ACCOUNT_NUMBER=1234567890
BANK_ACCOUNT_NAME=NGUYEN VAN A
NEXT_PUBLIC_BANK_QR_IMAGE_URL=https://...
NEXT_PUBLIC_SUPPORT_PHONE=0901234567
```

| Biến | Bắt buộc local? | Ghi chú |
| ---- | ----------------- | ------- |
| `NEXT_PUBLIC_APP_URL` | Có | Dùng `http://localhost:3000` khi dev |
| `NEXT_PUBLIC_SUPABASE_*` | Có | |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Chỉ server-side |
| `UPSTASH_REDIS_*` | Có | Thiếu sẽ lỗi khi submit order |
| `BANK_*`, `NEXT_PUBLIC_BANK_QR_*` | Không | Chỉ khi test thanh toán chuyển khoản |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Không | Nút "Cần hỗ trợ?" trên trang tracking |

> **Không commit** `.env.local`. File này đã nằm trong `.gitignore`.

---

## Bước 7 — Chạy dev server

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

Dev server dùng Next.js hot reload — sửa code sẽ tự cập nhật.

---

## Kiểm tra app hoạt động

### Checklist nhanh

- [ ] `http://localhost:3000/menu` — hiển thị menu (sau seed)
- [ ] `http://localhost:3000/api/menu` — trả JSON sản phẩm `is_available = true`
- [ ] `http://localhost:3000/login` — đăng nhập owner account
- [ ] `http://localhost:3000/dashboard` — kanban 3 cột (Đang chờ / Đang làm / Xong)
- [ ] `http://localhost:3000/admin` — quản lý sản phẩm
- [ ] Submit 1 order test từ `/menu` → xuất hiện trên dashboard (realtime)
- [ ] Trang tracking `/order/[code]` cập nhật khi đổi status trên dashboard

### Luồng test end-to-end

```
1. Mở /menu (tab 1)          → chọn món → thêm giỏ → điền tên → Gửi order
2. Mở /login (tab 2)         → đăng nhập owner
3. Mở /dashboard (tab 2)     → bấm "Bật thông báo âm thanh 🔔" (bắt buộc 1 lần)
4. Quay tab 1                → sau khi gửi, tab dashboard có beep + card mới
5. Dashboard → "Bắt đầu pha" → "Đã xong"
6. Tab tracking khách        → trạng thái đổi realtime
```

### Các route chính

| URL | Ai dùng | Mô tả |
| --- | ------- | ----- |
| `/menu` | Khách | Xem menu, đặt hàng |
| `/cart` | Khách | Giỏ hàng |
| `/order-success` | Khách | Sau khi gửi order |
| `/order/[code]` | Khách | Theo dõi trạng thái realtime |
| `/login` | Owner | Đăng nhập |
| `/dashboard` | Owner | Nhận & xử lý order |
| `/admin` | Owner | Quản lý menu |
| `/reports` | Owner | Báo cáo doanh thu |

---

## Chạy production build (local)

Kiểm tra app build được trước khi deploy:

```bash
npm run typecheck   # Kiểm tra TypeScript
npm run lint        # ESLint
npm run build       # Build production
npm run start       # Chạy bản build tại http://localhost:3000
```

---

## Chạy tests

```bash
npm test            # Jest unit tests
npm run format:check  # Kiểm tra Prettier
```

Chi tiết chiến lược test: [`TESTING.md`](./TESTING.md).

---

## Scripts npm có sẵn

| Lệnh | Mô tả |
| ---- | ----- |
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Build production |
| `npm run start` | Chạy sau `build` |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest |
| `npm run format` | Format code Prettier |
| `npm run format:check` | Kiểm tra format |

---

## Xử lý lỗi thường gặp

### `npm run dev` lỗi thiếu biến môi trường

- Kiểm tra file `.env.local` tồn tại ở **thư mục gốc** repo
- Restart dev server sau khi sửa `.env.local`

### `/menu` trống, không có sản phẩm

- Chưa chạy seed → làm lại **Bước 3** (seed)
- Kiểm tra Supabase **Table Editor → products** có data không
- Sản phẩm `is_available = false` sẽ **không** hiện trên menu khách

### Login được nhưng bị redirect / từ chối dashboard

- User chưa có `app_metadata.role = "admin"` → làm lại **Bước 4.2**
- Đăng xuất và login lại sau khi sửa metadata

### Submit order bị lỗi 500 / rate limit

- Kiểm tra `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`
- Kiểm tra `SUPABASE_SERVICE_ROLE_KEY` đúng project

### Dashboard không nhận order realtime

- Migrations chưa chạy đủ → `supabase db push` lại
- Kiểm tra Supabase **Database → Replication** — bảng `orders` đã bật realtime (migration `20260604000002` tự làm)
- Refresh trang dashboard, kiểm tra dot realtime (xanh = connected)

### Không nghe tiếng beep

- Trình duyệt chặn autoplay — bấm **"Bật thông báo âm thanh 🔔"** trên dashboard trước
- Chrome/Safari mobile: cần ít nhất 1 lần tap trên trang

### Upload ảnh sản phẩm lỗi trên `/admin`

- Owner phải có `role: admin` trong app_metadata
- Bucket `product-images` được tạo qua migration — chạy lại `supabase db push` nếu thiếu
- File tối đa 2MB, định dạng JPEG/PNG/WebP

### Supabase project bị pause (free tier)

- Free tier tự pause sau ~7 ngày không hoạt động
- Vào Dashboard → **Restore project**
- Trước khi launch thật: upgrade Pro và tắt auto-pause (xem [`SETUP.md`](./SETUP.md))

### Port 3000 đã bị chiếm

```bash
# Chạy trên port khác
npx next dev -p 3001
```

Nhớ cập nhật `NEXT_PUBLIC_APP_URL=http://localhost:3001`.

---

## Deploy lên internet

Khi local chạy ổn, xem:

- [`SETUP.md`](./SETUP.md) — Bước 4 Vercel
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Chi tiết deploy, health check, rollback

Tóm tắt:

1. Push code lên GitHub
2. Import repo vào Vercel
3. Thêm env vars (giống `.env.local`, đổi `NEXT_PUBLIC_APP_URL` thành domain thật)
4. Deploy

---

## Checklist hoàn chỉnh trước khi dev

- [ ] Node.js 20+ đã cài
- [ ] `npm install` thành công
- [ ] Supabase project tạo xong
- [ ] `supabase db push` chạy xong
- [ ] `supabase/seed.sql` đã chạy
- [ ] Owner account + `app_metadata.role = "admin"`
- [ ] Upstash Redis tạo xong
- [ ] `.env.local` điền đủ biến bắt buộc
- [ ] `npm run dev` chạy không lỗi
- [ ] Test order end-to-end pass

---

## Cần thêm trợ giúp?

- Vận hành hàng ngày: [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md)
- API endpoints: [`API_CONTRACT.md`](./API_CONTRACT.md)
- Database schema: [`DB_SCHEMA.md`](./DB_SCHEMA.md)
- Báo lỗi / đóng góp: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
