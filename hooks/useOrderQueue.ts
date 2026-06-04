"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Order } from "@/types/order";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

// Realtime delivers only the `orders` row — items are NOT included (order_items is a separate table).
// Callers should pass initialOrders fetched from GET /api/orders on mount so the list
// is populated immediately; Realtime then delivers deltas (INSERT / UPDATE events).
// If the parent refetches orders, remount this hook (e.g. key={refetchToken}) — useState(initial)
// only applies on first mount (eslint disallows syncing props via setState-in-effect).
export type OrderRow = Omit<Order, "items">;

export function useOrderQueue(initialOrders: OrderRow[] = []) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("orders-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const incoming = payload.new as OrderRow;
          setOrders((prev) => {
            if (prev.some((o) => o.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const incoming = payload.new as OrderRow;
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === incoming.id);
            // Order absent from list (e.g. missed INSERT during reconnect) — prepend it
            if (idx === -1) return [incoming, ...prev];
            return prev.map((o, i) => (i === idx ? incoming : o));
          });
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
  }, []);

  return { orders, connectionStatus };
}
