# Realtime — Supabase Realtime Setup

## Overview

Supabase Realtime dùng PostgreSQL `LISTEN/NOTIFY` qua WebSocket. Project này dùng cho 2 use case:

| Channel | Người dùng | Mục đích |
|---|---|---|
| `orders` | Owner (Dashboard) | Nhận order mới, cập nhật trạng thái |
| `order:[order_code]` | Khách (Order Tracking) | Theo dõi trạng thái đơn của mình |

---

## Cấu hình Supabase

### Bật Realtime cho bảng `orders`

Trong Supabase Dashboard → Database → Replication → chọn bảng `orders` → bật `INSERT`, `UPDATE`.

Hoặc trong migration:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

> `order_items` không cần Realtime — chỉ đọc 1 lần khi xem chi tiết order.

---

## RLS Policy cho Realtime

Supabase Realtime tôn trọng RLS. Cần có policy cho phép client subscribe:

```sql
-- Khách xem order tracking: đọc order theo order_code
CREATE POLICY "customer_read_own_order"
ON orders FOR SELECT
USING (true);  -- Public read — order_code đã đủ unguessable trong ngày
               -- Phase 2+: thêm cancel_token UUID nếu cần bảo mật cao hơn

-- Owner xem dashboard: đọc tất cả orders (cần auth)
CREATE POLICY "owner_read_all_orders"
ON orders FOR SELECT
TO authenticated
USING (true);
```

---

## Dashboard — Owner

### Channel setup

```typescript
// hooks/useOrderQueue.ts
import { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { Order } from '@/types/order'

export function useOrderQueue(onNewOrder: (order: Order) => void, onUpdate: (order: Order) => void) {
  useEffect(() => {
    const supabase = createBrowserClient()

    const channel = supabase
      .channel('orders-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => onNewOrder(payload.new as Order)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => onUpdate(payload.new as Order)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [onNewOrder, onUpdate])
}
```

### Xử lý event trên Dashboard

| Event | Action |
|---|---|
| `INSERT` (status=new) | Thêm card vào đầu tab "Đang chờ" + phát âm thanh beep |
| `UPDATE` (new→making) | Chuyển card từ "Đang chờ" → "Đang làm" |
| `UPDATE` (making→done) | Xóa card khỏi "Đang làm" (không real-time sync sang tab "Xong") |
| `UPDATE` (any→cancelled) | Xóa card khỏi tab hiện tại |

---

## Order Tracking — Khách

### Channel setup

```typescript
// hooks/useOrderTracking.ts
import { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { Order } from '@/types/order'

export function useOrderTracking(orderCode: string, onUpdate: (order: Order) => void) {
  useEffect(() => {
    const supabase = createBrowserClient()

    const channel = supabase
      .channel(`order:${orderCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_code=eq.${orderCode}`,
        },
        (payload) => onUpdate(payload.new as Order)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderCode, onUpdate])
}
```

### UI theo status

| Status | Hiển thị |
|---|---|
| `new` | "Đang chờ xác nhận ⏳" + nút Cancel |
| `making` | "Đang pha chế ☕" (nút Cancel ẩn) |
| `done` | "Đồ của bạn xong rồi! Lấy tại quầy 🎉" |
| `cancelled` | "Đơn hàng đã bị huỷ" |

---

## Âm thanh thông báo (Dashboard)

**Browser policy**: âm thanh chỉ phát sau user interaction đầu tiên.

```typescript
// hooks/useNotificationSound.ts
export function useNotificationSound() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(false)

  const enable = () => {
    audioCtxRef.current = new AudioContext()
    enabledRef.current = true
  }

  const beep = () => {
    if (!enabledRef.current || !audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  }

  return { enable, beep }
}
```

**UX bắt buộc**: khi owner mở dashboard lần đầu → hiện banner "Nhấn để bật thông báo âm thanh 🔔". Sau khi click mới gọi `enable()`.

**Visual fallback** luôn bật dù âm thanh chưa enable:
- Badge số trên tab title: `(2) Vibe Cafe — Dashboard`
- Card order mới highlight (border, animation) trong 5 giây

---

## Connection State

Supabase Realtime tự reconnect khi mất mạng. Nên show UI indicator:

```typescript
channel.on('system', { event: 'connected' }, () => setConnected(true))
channel.on('system', { event: 'disconnected' }, () => setConnected(false))
```

Hiển thị dot xanh/đỏ nhỏ ở góc dashboard để owner biết realtime đang hoạt động.

---

## Không dùng Realtime cho

- Menu (`/menu`) — data tĩnh, cache bình thường, owner thay đổi ít
- Admin panel — không cần realtime
- Tab "Xong" / "Tất cả" — dùng infinite scroll, pull khi cần
