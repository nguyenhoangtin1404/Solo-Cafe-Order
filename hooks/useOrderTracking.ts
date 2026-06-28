"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { ORDER_CODE_RE } from "@/lib/constants";
import {
  makeSubscribeHandler,
  type ConnectionStatus,
  type OrderRow,
} from "./realtimeShared";

export type { ConnectionStatus, OrderRow };

// Realtime delivers only the `orders` row — items are NOT included.
// Pass initialOrder from a server-side fetch (GET /api/orders/[code]) so the tracking
// page renders immediately; Realtime then delivers subsequent status UPDATE events.
// Remount with key={orderCode} (or refetch token) if initialOrder changes after fetch.

export function useOrderTracking(
  orderCode: string,
  initialOrder: OrderRow | null = null
) {
  const [order, setOrder] = useState<OrderRow | null>(initialOrder);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  // Prefer filtering by stable UUID to avoid cross-day order_code collisions
  // (order_code resets daily; two orders can share the same code on different days).
  const orderId = initialOrder?.id ?? null;

  useEffect(() => {
    // Guard: only subscribe if format matches A001–Z999 to prevent filter injection
    if (!orderCode || !ORDER_CODE_RE.test(orderCode)) return;
    // orderId is always available from the SSR-fetched initialOrder
    // (page.tsx redirects to 404 if order not found, so initialOrder is never null here).
    if (!orderId) return;

    const supabase = createClient();
    const filter = `id=eq.${orderId}`;

    const channel = supabase
      .channel(`order:${orderCode}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter },
        (payload) => {
          // Spread-merge: Realtime only sends the restricted publication columns —
          // preserve existing fields (total_amount, payment_method, pickup_name, note)
          // that are absent from the restricted payload.
          setOrder((prev) =>
            prev
              ? { ...prev, ...(payload.new as Partial<OrderRow>) }
              : (payload.new as OrderRow)
          );
        }
      )
      .subscribe(makeSubscribeHandler(setConnectionStatus));

    return () => {
      supabase.removeChannel(channel).catch(() => null);
    };
  }, [orderCode, orderId]);

  return { order, connectionStatus };
}
