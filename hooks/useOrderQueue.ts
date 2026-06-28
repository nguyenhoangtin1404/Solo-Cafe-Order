"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Order } from "@/types/order";
import {
  makeSubscribeHandler,
  type ConnectionStatus,
  type OrderRow,
} from "./realtimeShared";

export type { ConnectionStatus, OrderRow };

// Callers should pass initialOrders fetched from GET /api/orders on mount so the list
// is populated immediately; Realtime then delivers deltas (INSERT / UPDATE events).
// If the parent refetches orders, remount this hook (e.g. key={refetchToken}).

// Columns sent by the Realtime publication (restricted to non-PII, no order_code).
// Full order data is fetched via the auth-gated dashboard API on INSERT events.
type RealtimeOrderPayload = Pick<
  OrderRow,
  "id" | "status" | "cancelled_by" | "updated_at" | "created_at"
>;

async function fetchOrderById(
  id: string
): Promise<OrderRow & { items: Order["items"] }> {
  const res = await fetch(`/api/dashboard/orders/${id}`);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
}

function handleInsert(
  incoming: RealtimeOrderPayload,
  setOrders: React.Dispatch<React.SetStateAction<OrderRow[]>>
): void {
  fetchOrderById(incoming.id)
    .then((full) =>
      setOrders((prev) =>
        prev.some((o) => o.id === full.id) ? prev : [full, ...prev]
      )
    )
    .catch((err) =>
      console.error("[dashboard] Failed to load new order:", err)
    );
}

async function handleUpdate(
  incoming: RealtimeOrderPayload,
  ordersRef: React.MutableRefObject<OrderRow[]>,
  setOrders: React.Dispatch<React.SetStateAction<OrderRow[]>>
): Promise<void> {
  // Read current state via ref (avoids side-effect inside setState callback).
  const isKnown = ordersRef.current.some((o) => o.id === incoming.id);
  if (!isKnown) {
    // Order absent from list (e.g. missed INSERT during reconnect) — fetch full order.
    try {
      const full = await fetchOrderById(incoming.id);
      setOrders((cur) =>
        cur.some((o) => o.id === full.id) ? cur : [full, ...cur]
      );
    } catch (err) {
      console.error("[dashboard] Failed to load missing order:", err);
    }
    return;
  }
  setOrders((prev) => {
    const i = prev.findIndex((o) => o.id === incoming.id);
    if (i === -1) return prev;
    // Discard stale replayed events (reconnect buffer).
    if (
      incoming.updated_at &&
      prev[i].updated_at &&
      new Date(incoming.updated_at) < new Date(prev[i].updated_at)
    )
      return prev;
    // Spread-merge: preserve fields not in the restricted payload (pickup_name, note, etc.)
    return prev.map((o, j) => (j === i ? { ...o, ...incoming } : o));
  });
}

export function useOrderQueue(initialOrders: OrderRow[] = []) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const ordersRef = useRef(initialOrders);

  const updateRow = useCallback(
    (id: string, patch: Partial<Omit<OrderRow, "id">>) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    []
  );

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) =>
          handleInsert(payload.new as RealtimeOrderPayload, setOrders)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) =>
          handleUpdate(
            payload.new as RealtimeOrderPayload,
            ordersRef,
            setOrders
          )
      )
      .subscribe(makeSubscribeHandler(setConnectionStatus));
    return () => {
      supabase.removeChannel(channel).catch(() => null);
    };
  }, []);

  return { orders, connectionStatus, updateRow };
}
