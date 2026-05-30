# Environment Variables

## Required

| Variable | Where | Note |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Client + Server | Domain của app — dùng để generate QR code |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **KHÔNG expose client-side** |
| `UPSTASH_REDIS_REST_URL` | Server only | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Server only | Rate limiting |

## Optional

| Variable | Default | Note |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | — | Analytics |
| `LOG_LEVEL` | `info` | `info` \| `debug` \| `error` |

---

## Rules

- Không commit file `.env` hoặc `.env.local`
- Không hardcode giá trị trong code
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng trong API Routes hoặc Server Components
- Biến `NEXT_PUBLIC_*` expose ra client bundle — không đặt secret vào đây
- Staging dùng Supabase project + Upstash instance riêng

---

## Setup

```bash
cp .env.example .env.local
# Điền giá trị từ:
# - Supabase Dashboard → Project Settings → API
# - Upstash Console → Redis → REST API
```

## Staging vs Production

| Env | Supabase Project | Upstash | Vercel |
|---|---|---|---|
| Local | `supabase local` hoặc staging project | staging instance | `npm run dev` |
| Staging | Staging project (riêng) | Staging instance | Vercel Preview |
| Production | Production project | Production instance | Vercel Production |
