"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useOrderQueue } from "@/hooks/useOrderQueue";
import { useDashboardAudio } from "@/hooks/useDashboardAudio";
import { ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import type { Order, OrderItemSummary } from "@/types/order";
import { OrderCard } from "./OrderCard";
import type { DashboardOrder } from "./OrderCard";
import type { OrderRow } from "@/hooks/useOrderQueue";

type TabId = "all" | "new" | "making" | "done";

const TABS: { id: TabId; label: string; statuses: OrderStatus[] }[] = [
  {
    id: "all",
    label: "Tất cả",
    statuses: ["new", "making", "done", "cancelled"],
  },
  { id: "new", label: "Mới", statuses: ["new"] },
  { id: "making", label: "Đang làm", statuses: ["making"] },
  { id: "done", label: "Xong", statuses: ["done", "cancelled"] },
];

function toItemSummary(item: Order["items"][number]): OrderItemSummary {
  return {
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    selected_options: item.selected_options,
    note: item.note,
  };
}

function toOrderRow(o: Order): OrderRow {
  return {
    id: o.id,
    order_code: o.order_code,
    status: o.status,
    payment_method: o.payment_method,
    total_amount: o.total_amount,
    pickup_name: o.pickup_name,
    note: o.note,
    customer_ref: o.customer_ref,
    cancelled_by: o.cancelled_by,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
}

interface Props {
  initialOrders: Order[];
}

export function DashboardView({ initialOrders }: Props) {
  // Lazy initialisers run once on mount — avoids reading ref.current during render
  const [initialRowsOnce] = useState<OrderRow[]>(() =>
    initialOrders.map(toOrderRow)
  );
  const [itemsMap, setItemsMap] = useState<Map<string, OrderItemSummary[]>>(
    () => new Map(initialOrders.map((o) => [o.id, o.items.map(toItemSummary)]))
  );
  // Ref (not state) so the items-fetch effect only re-runs when `rows` changes,
  // not when itemsMap changes — prevents duplicate fetches on each state update.
  const fetchedIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  );
  // Tracks orders that have been announced (sound + animation) so a retry
  // after a failed items fetch doesn't re-play the notification chime.
  const announcedIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  );

  const [activeTab, setActiveTab] = useState<TabId>("new");
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [newArrivals, setNewArrivals] = useState<Set<string>>(new Set());
  // Track seen order IDs (not count) so cancellations don't skew the unread badge.
  // Starts empty so initial new orders show as unread on fresh load.
  const [seenNewIds, setSeenNewIds] = useState<Set<string>>(new Set());

  const { orders: rows, connectionStatus, updateRow } = useOrderQueue(initialRowsOnce);
  const { unlocked, unlock, playNotification } = useDashboardAudio();

  // Stable ref so async .then() callbacks always use the latest playNotification
  const playRef = useRef(playNotification);
  useEffect(() => {
    playRef.current = playNotification;
  }, [playNotification]);

  // Stable ref so async .then() callbacks can check the active tab without
  // capturing a stale closure value.
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Derive display orders: rows (live status) merged with items (stable after creation)
  const orders = useMemo<DashboardOrder[]>(
    () => rows.map((row) => ({ ...row, items: itemsMap.get(row.id) ?? [] })),
    [rows, itemsMap]
  );

  // Detect INSERT events → fetch items asynchronously, then update map
  useEffect(() => {
    // Capture the ref value so the cleanup closure uses the same Set instance
    // even if fetchedIdsRef.current is reassigned between effect and cleanup.
    const fetchedIds = fetchedIdsRef.current;
    const newRows = rows.filter((row) => !fetchedIds.has(row.id));
    if (newRows.length === 0) return;

    // Mark as in-flight immediately so a re-run of this effect (from rows
    // changing again) doesn't kick off duplicate fetches for the same IDs.
    newRows.forEach((row) => fetchedIds.add(row.id));

    // Only announce (sound + animation) orders seen for the first time.
    // Retried fetches (already in announcedIdsRef) are skipped so the
    // notification chime does not replay for orders whose items fetch failed.
    const announced = announcedIdsRef.current;
    const freshArrivalIds = newRows
      .filter((r) => !announced.has(r.id))
      .map((r) => r.id);
    freshArrivalIds.forEach((id) => announced.add(id));
    const freshArrivalSet = new Set(freshArrivalIds);

    let mounted = true;
    let fetched = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    Promise.all(
      newRows.map(
        async (row): Promise<{ id: string; items: OrderItemSummary[] | null }> => {
          try {
            const res = await fetch(`/api/dashboard/orders/${row.id}/items`);
            if (!res.ok) return { id: row.id, items: null };
            const data = (await res.json()) as { items?: OrderItemSummary[] };
            return { id: row.id, items: data.items ?? [] };
          } catch {
            return { id: row.id, items: null };
          }
        }
      )
    ).then((results) => {
      if (!mounted) return;
      fetched = true;
      // Single pass: roll back failed IDs and populate itemsMap for successes.
      results.forEach((r) => {
        if (r.items === null) fetchedIds.delete(r.id); // allow retry on next rows update
      });
      setItemsMap((prev) => {
        const next = new Map(prev);
        results.forEach((r) => {
          if (r.items !== null) next.set(r.id, r.items);
        });
        return next;
      });
      if (freshArrivalSet.size === 0) return; // all retries — skip sound/animation
      setNewArrivals((prev) => {
        const next = new Set(prev);
        freshArrivalSet.forEach((id) => next.add(id));
        return next;
      });
      // If the owner is already on the "Mới" tab, mark arrivals as seen
      // immediately so the unread badge doesn't flash while they're watching.
      if (activeTabRef.current === "new") {
        setSeenNewIds((prev) => {
          const next = new Set(prev);
          freshArrivalSet.forEach((id) => next.add(id));
          return next;
        });
      }
      playRef.current();
      timeoutId = setTimeout(() => {
        if (!mounted) return;
        setNewArrivals((prev) => {
          const next = new Set(prev);
          freshArrivalSet.forEach((id) => next.delete(id));
          return next;
        });
      }, 3000);
    });

    return () => {
      mounted = false;
      // If the fetch never completed, roll back the IDs so the next effect
      // run can retry them (avoids permanent items:[] for aborted fetches).
      if (!fetched) {
        newRows.forEach((row) => fetchedIds.delete(row.id));
      }
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [rows]);

  // document.title unread badge
  const newOrders = useMemo(
    () => orders.filter((o) => o.status === ORDER_STATUS.NEW),
    [orders]
  );
  const unreadCount = newOrders.filter((o) => !seenNewIds.has(o.id)).length;

  useEffect(() => {
    document.title =
      unreadCount > 0 ? `(${unreadCount}) Vibe Cafe` : "Vibe Cafe — Dashboard";
    return () => {
      document.title = "Vibe Cafe";
    };
  }, [unreadCount]);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    if (tab === "new") {
      setSeenNewIds((prev) => {
        const next = new Set(prev);
        newOrders.forEach((o) => next.add(o.id));
        return next;
      });
    }
  }

  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      setPendingActions((prev) => new Set(prev).add(orderId));
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          toast.error(body.message ?? "Cập nhật trạng thái thất bại.");
        } else {
          // Optimistic update: apply locally so the card moves immediately even
          // if the Realtime event is delayed or dropped.
          updateRow(orderId, { status: newStatus });
        }
      } catch {
        toast.error("Mất kết nối. Vui lòng thử lại.");
      } finally {
        setPendingActions((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [updateRow]
  );

  const activeStatuses = TABS.find((t) => t.id === activeTab)?.statuses ?? [];
  const visibleOrders = orders.filter((o) => activeStatuses.includes(o.status));

  const tabCounts: Record<TabId, number> = {
    all: orders.length,
    new: newOrders.length,
    making: orders.filter((o) => o.status === ORDER_STATUS.MAKING).length,
    done: orders.filter(
      (o) =>
        o.status === ORDER_STATUS.DONE || o.status === ORDER_STATUS.CANCELLED
    ).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top block: header + optional audio banner + tabs all stick together
          so the tab bar never overlaps the banner during scroll. */}
      <div className="sticky top-0 z-10 bg-background">
        <header className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Dashboard</h1>
            <ConnectionStatus status={connectionStatus} />
          </div>
        </header>

        {/* Audio unlock banner — shown until first user interaction */}
        {!unlocked && (
          <button
            onClick={unlock}
            className="w-full border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800"
          >
            Nhấn để bật thông báo âm thanh khi có đơn mới 🔔
          </button>
        )}

        {/* Filter tabs */}
        <div className="border-b">
          <div className="flex px-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tabCounts[tab.id]}
                  </span>
                )}
                {/* Red dot for unread new orders */}
                {tab.id === "new" && unreadCount > 0 && activeTab !== "new" && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order list */}
      <main className="space-y-3 p-4">
        {visibleOrders.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <p>Không có đơn nào</p>
          </div>
        ) : (
          visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={newArrivals.has(order.id)}
              isPending={pendingActions.has(order.id)}
              onStatusUpdate={handleStatusUpdate}
            />
          ))
        )}
      </main>
    </div>
  );
}

type ConnectionStatusProps = {
  status: "connected" | "connecting" | "disconnected";
};

function ConnectionStatus({ status }: ConnectionStatusProps) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-600">
        <Wifi size={14} />
        Live
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-yellow-600">
        <Loader2 size={14} className="animate-spin" />
        Đang kết nối...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-destructive">
      <WifiOff size={14} />
      Mất kết nối
    </span>
  );
}
