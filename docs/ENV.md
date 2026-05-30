# Environment Variables

## Required

| Variable | Where | Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **Không expose client-side** |

## Optional (future)

| Variable | Note |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics |
| `LOG_LEVEL` | `info` \| `debug` \| `error` |

---

## Rules

- Không commit file `.env` hoặc `.env.local`
- Không hardcode giá trị trong code
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng trong API Routes hoặc Server Components
- Biến `NEXT_PUBLIC_*` sẽ expose ra client bundle — không đặt secret vào đây

---

## Setup

```bash
cp .env.example .env.local
# điền giá trị từ Supabase project settings
```

Lấy keys từ: Supabase Dashboard → Project Settings → API
