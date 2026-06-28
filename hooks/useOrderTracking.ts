"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { ORDER_CODE_RE } from "@/lib/constants";
import type { Order } from "@/types/order";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

// Realtime delivers only the `orders` row — items are NOT included.
// Pass initialOrder from a server-side fetch (GET /api/orders/[code]) so the tracking
// page renders immediately; Realtime then delivers subsequent status UPDATE events.
// Remount with key={orderCode} (or refetch token) if initialOrder changes after fetch.
export type OrderRow = Omit<Order, "items">;

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

    const supabase = createClient();
    const filter = orderId ? `id=eq.${orderId}` : `order_code=eq.${orderCode}`;

    const channel = supabase
      .channel(`order:${orderCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter,
        },
        (payload) => {
          // Spread-merge: Realtime only sends the 6 restricted publication columns —
          // preserve existing fields (total_amount, payment_method, pickup_name, note)
          // that are absent from the restricted payload.
          setOrder((prev) =>
            prev
              ? { ...prev, ...(payload.new as Partial<OrderRow>) }
              : (payload.new as OrderRow)
          );
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnectionStatus("connected");
        else if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        )
          setConnectionStatus("disconnected");
        else setConnectionStatus("connecting");
      });

    return () => {
      supabase.removeChannel(channel).catch(() => null);
    };
  }, [orderCode, orderId]);

  return { order, connectionStatus };
}
