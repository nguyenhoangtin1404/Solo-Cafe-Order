Tạo một React component mới cho Solo Cafe Order project.

**Arguments**: $ARGUMENTS (ví dụ: "menu/ProductCard" hoặc "dashboard/OrderCard")

## Làm theo các bước sau:

1. **Xác định vị trí**
   - Path: `components/$ARGUMENTS.tsx`
   - Nhóm theo feature: `menu/`, `cart/`, `dashboard/`, `admin/`, `ui/`

2. **Xác định loại component**
   - Pure presentational → không cần `"use client"`
   - Cần state/event handlers → thêm `"use client"` ở đầu file
   - Cần Supabase Realtime → `"use client"` + useEffect

3. **Props interface**
   - Định nghĩa props rõ ràng, đầy đủ type
   - Không dùng `any`
   - Export interface nếu cần tái sử dụng

4. **Template cơ bản**

```tsx
// components/<group>/<ComponentName>.tsx
interface <ComponentName>Props {
  // define props
}

export function <ComponentName>({ ... }: <ComponentName>Props) {
  return (
    <div>
      {/* content */}
    </div>
  )
}
```

5. **Styling rules**
   - Dùng TailwindCSS classes
   - Mobile-first (không dùng desktop breakpoints nếu không cần)
   - Tap targets ≥ 44px (h-11 minimum cho buttons)
   - Dùng shadcn/ui components từ `components/ui/` thay vì tự build nếu có

6. **Sau khi tạo**
   - Export từ file index nếu group đó có index
   - Liệt kê props cần thiết để dùng component này
