Tạo một Next.js API Route mới cho Solo Cafe Order project.

**Arguments**: $ARGUMENTS (ví dụ: "orders" hoặc "products/[id]/availability")

## Làm theo các bước sau:

1. **Xác định endpoint**
   - File: `app/api/$ARGUMENTS/route.ts`
   - HTTP method: GET / POST / PATCH / DELETE?
   - Public hay protected (cần owner auth)?

2. **Xác định contract** (theo `docs/API_CONTRACT.md`)
   - Request body schema
   - Response schema
   - Error codes cần handle

3. **Template cơ bản**

```typescript
// app/api/<path>/route.ts
import { NextRequest, NextResponse } from 'next/server'
// import service

export async function <METHOD>(
  request: NextRequest,
  { params }: { params: { id: string } }  // nếu có dynamic segment
) {
  try {
    // 1. Auth check (nếu protected)
    // const session = await getServerSession(request)
    // if (!session) return NextResponse.json({ code: 'UNAUTHORIZED', message: '...' }, { status: 401 })

    // 2. Parse + validate input
    const body = await request.json()
    // validate...

    // 3. Gọi Service (không gọi Supabase trực tiếp)
    // const result = await SomeService.doSomething(...)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // handle known errors
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Server error' }, { status: 500 })
  }
}
```

4. **Rules bắt buộc**
   - Không chứa business logic — tất cả qua Service
   - Validate input shape trước khi truyền xuống
   - Return đúng HTTP status (201 cho create, 200 cho update/get)
   - Error response luôn có format `{ code, message }`

5. **Tạo Service nếu chưa có**
   - File: `lib/services/<entity>Service.ts`
   - Service không gọi Supabase trực tiếp

6. **Sau khi tạo, cập nhật `docs/API_CONTRACT.md`** với spec đầy đủ của endpoint mới.
