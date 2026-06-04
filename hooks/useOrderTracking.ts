"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
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

  useEffect(() => {
    // Guard: only subscribe if format matches A001–Z999 to prevent filter injection
    if (!orderCode || !/^[A-Z]\d{3}$/.test(orderCode)) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`order:${orderCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_code=eq.${orderCode}`,
        },
        (payload) => {
          setOrder(payload.new as OrderRow);
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
      supabase.removeChannel(channel);
    };
  }, [orderCode]);

  return { order, connectionStatus };
}
