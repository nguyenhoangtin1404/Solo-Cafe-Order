"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useOrderQueue } from "@/hooks/useOrderQueue";
import { useDashboardAudio } from "@/hooks/useDashboardAudio";
import { ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import type { Order, OrderItemSummary } from "@/types/order";
import { toItemDto } from "@/lib/dto/order";
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
  { id: "new", label: "Đang chờ", statuses: ["new"] },
  { id: "making", label: "Đang làm", statuses: ["making"] },
  { id: "done", label: "Xong", statuses: ["done", "cancelled"] },
];

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
    () =>
      new Map(
        initialOrders.map((o) => [o.id, o.items.map((item) => toItemDto(item))])
      )
  );
  // Ref (not state) so the items-fetch effect only re-runs when `rows` changes,
  // not when itemsMap changes — prevents duplicate fetches on each state update.
  // Not pre-populated: initial orders need a fetch to get image_url from products.
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  // Tracks orders that have been announced (sound + animation) so a retry
  // after a failed items fetch doesn't re-play the notification chime.
  const announcedIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  );

  const [activeTab, setActiveTab] = useState<TabId>("new");
  const tabButtonRefs = useRef<Map<TabId, HTMLButtonElement | null>>(new Map());
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [newArrivals, setNewArrivals] = useState<Set<string>>(new Set());
  // Track seen order IDs (not count) so cancellations don't skew the unread badge.
  // Starts empty so initial new orders show as unread on fresh load.
  const [seenNewIds, setSeenNewIds] = useState<Set<string>>(new Set());

  const {
    orders: rows,
    connectionStatus,
    updateRow,
  } = useOrderQueue(initialRowsOnce);
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
        async (
          row
        ): Promise<{ id: string; items: OrderItemSummary[] | null }> => {
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
    )
      .then((results) => {
        // Set fetched=true BEFORE the !mounted guard so cleanup knows the fetch
        // completed and won't roll back successfully-fetched IDs unnecessarily.
        fetched = true;
        if (!mounted) return;
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
        // If the owner is already on the "Đang chờ" tab, mark arrivals as seen
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
      })
      .catch((err) => {
        console.error("[dashboard] items fetch error", err);
      });

    return () => {
      mounted = false;
      if (!fetched) {
        // Roll back both refs so the next effect run can retry the fetch and
        // re-announce the order (covers StrictMode double-invoke in dev too).
        newRows.forEach((row) => {
          fetchedIds.delete(row.id);
          announced.delete(row.id);
        });
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        // .then() already ran (fetched=true) and added freshArrivalSet to
        // newArrivals. Without the timeout's removal those IDs stay in the
        // set forever when a second batch arrives within the 3 s window.
        setNewArrivals((prev) => {
          const next = new Set(prev);
          freshArrivalSet.forEach((id) => next.delete(id));
          return next;
        });
      }
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
          // Include server-confirmed updated_at so the staleness guard in
          // useOrderQueue correctly discards any Realtime replay for this update
          // if the owner triggers a second status change before it arrives.
          const body = (await res.json().catch(() => ({}))) as {
            updated_at?: string;
          };
          const patch: Partial<Omit<OrderRow, "id">> = { status: newStatus };
          if (body.updated_at) patch.updated_at = body.updated_at;
          updateRow(orderId, patch);
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
    // Any pointer interaction triggers audio unlock so the owner doesn't have
    // to find and tap the banner specifically as their first gesture.
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
      onPointerDown={unlock}
    >
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
            type="button"
            onClick={unlock}
            className="flex min-h-[44px] w-full items-center justify-center border-b border-status-new/30 bg-status-new/10 px-4 py-2 text-center text-sm text-status-new"
          >
            Nhấn để bật thông báo âm thanh khi có đơn mới{" "}
            <span aria-hidden="true">🔔</span>
          </button>
        )}

        {/* Filter tabs */}
        <div className="border-b">
          <div
            role="tablist"
            aria-label="Lọc đơn hàng"
            className="flex px-1"
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              const ids = TABS.map((t) => t.id);
              const currentIdx = ids.indexOf(activeTab);
              const nextIdx =
                e.key === "ArrowRight"
                  ? (currentIdx + 1) % ids.length
                  : (currentIdx - 1 + ids.length) % ids.length;
              const nextId = ids[nextIdx];
              flushSync(() => handleTabChange(nextId));
              tabButtonRefs.current.get(nextId)?.focus();
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  tabButtonRefs.current.set(tab.id, el);
                }}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span
                    aria-hidden="true"
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
                  <span
                    aria-label={`${unreadCount} đơn chưa đọc`}
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order list */}
      <main className="space-y-3 p-4">
        {visibleOrders.length === 0 ? (
          <EmptyTab tab={activeTab} />
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

const EMPTY_TAB_CONTENT: Record<
  TabId,
  { emoji: string; title: string; subtitle: string }
> = {
  all: {
    emoji: "📋",
    title: "Chưa có đơn nào",
    subtitle: "Đơn mới sẽ xuất hiện tại đây.",
  },
  new: {
    emoji: "🎉",
    title: "Không có đơn mới",
    subtitle: "Đang chờ khách đặt hàng...",
  },
  making: {
    emoji: "☕",
    title: "Không có đơn đang làm",
    subtitle: "Chưa có đơn nào đang pha chế.",
  },
  done: {
    emoji: "✅",
    title: "Chưa có đơn hoàn thành",
    subtitle: "Đơn xong và đã hủy sẽ xuất hiện ở đây.",
  },
};

function EmptyTab({ tab }: { tab: TabId }) {
  const { emoji, title, subtitle } = EMPTY_TAB_CONTENT[tab];
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

type ConnectionStatusProps = {
  status: "connected" | "connecting" | "disconnected";
};

function ConnectionStatus({ status }: ConnectionStatusProps) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-status-done">
        <Wifi size={14} />
        Live
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-status-new">
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
