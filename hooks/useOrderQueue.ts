"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Order } from "@/types/order";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

// Realtime delivers only the `orders` row — items are NOT included (order_items is a separate table).
// Callers should pass initialOrders fetched from GET /api/orders on mount so the list
// is populated immediately; Realtime then delivers deltas (INSERT / UPDATE events).
// If the parent refetches orders, remount this hook (e.g. key={refetchToken}) — useState(initial)
// only applies on first mount (eslint disallows syncing props via setState-in-effect).
export type OrderRow = Omit<Order, "items">;

// Columns sent by the Realtime publication (restricted to non-PII).
// Full order data is fetched from the API on INSERT events.
type RealtimeOrderPayload = Pick<
  OrderRow,
  "id" | "order_code" | "status" | "cancelled_by" | "updated_at" | "created_at"
>;

async function fetchOrderByCode(
  code: string
): Promise<OrderRow & { items: Order["items"] }> {
  const res = await fetch(`/api/orders/${code}`);
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

export function useOrderQueue(initialOrders: OrderRow[] = []) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  const updateRow = useCallback(
    (id: string, patch: Partial<Omit<OrderRow, "id">>) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("orders-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const incoming = payload.new as RealtimeOrderPayload;
          // Publication is column-restricted — fetch full order (with items) from API.
          fetchOrderByCode(incoming.order_code)
            .then((full) => {
              setOrders((prev) => {
                if (prev.some((o) => o.id === full.id)) return prev;
                return [full, ...prev];
              });
            })
            .catch(() => null);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const incoming = payload.new as RealtimeOrderPayload;
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === incoming.id);
            if (idx === -1) {
              // Order absent from list (e.g. missed INSERT during reconnect) — fetch full order.
              fetchOrderByCode(incoming.order_code)
                .then((full) => {
                  setOrders((cur) => {
                    if (cur.some((o) => o.id === full.id)) return cur;
                    return [full, ...cur];
                  });
                })
                .catch(() => null);
              return prev;
            }
            // Discard stale replayed events (reconnect buffer).
            if (
              incoming.updated_at &&
              prev[idx].updated_at &&
              new Date(incoming.updated_at) < new Date(prev[idx].updated_at)
            )
              return prev;
            // Spread-merge: preserve fields not in the restricted payload (pickup_name, note, etc.)
            return prev.map((o, i) => (i === idx ? { ...o, ...incoming } : o));
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
      supabase.removeChannel(channel).catch(() => null);
    };
  }, []);

  return { orders, connectionStatus, updateRow };
}
