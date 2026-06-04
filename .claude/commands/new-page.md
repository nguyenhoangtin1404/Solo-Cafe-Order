Tạo một Next.js App Router page mới cho Solo Cafe Order project.

**Arguments**: $ARGUMENTS (ví dụ: "menu" hoặc "dashboard/orders")

## Làm theo các bước sau:

1. **Xác định route và người dùng**
   - Route path: `app/$ARGUMENTS/page.tsx`
   - Là public page (khách) hay protected page (owner)?
   - Nếu protected → cần check Supabase Auth session

2. **Tạo file page**
   - Dùng Server Component làm mặc định
   - Chỉ thêm `"use client"` nếu cần hooks/interactivity
   - Fetch data trong Server Component nếu có thể
   - Format:

```tsx
// app/<route>/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '<Page Title> — Solo Cafe',
}

export default async function <PageName>Page() {
  return (
    <main className="min-h-screen">
      {/* content */}
    </main>
  )
}
```

3. **UI Principles** (từ `docs/DOMAIN.md`)
   - Mobile-first layout (max-w-md mx-auto nếu single column)
   - Tap targets ≥ 44px
   - Không popup spam, không complex navigation
   - Loading state với skeleton nếu fetch async

4. **Nếu cần components mới** → chạy `/new-component` riêng

5. **Nếu cần API** → chạy `/new-api` riêng

Sau khi tạo xong, liệt kê:

- File vừa tạo
- Components cần tạo thêm (nếu có)
- API endpoints cần (nếu có)
