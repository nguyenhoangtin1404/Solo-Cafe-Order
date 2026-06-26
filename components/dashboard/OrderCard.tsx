"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import type { OrderRow } from "@/hooks/useOrderQueue";
import type { OrderItemSummary } from "@/types/order";
import { StatusBadge } from "./StatusBadge";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { formatCurrency } from "@/lib/utils/format";

export type DashboardOrder = OrderRow & { items: OrderItemSummary[] };

interface Props {
  order: DashboardOrder;
  isNew: boolean;
  isPending: boolean;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

const TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatTime(iso: string): string {
  return TIME_FORMAT.format(new Date(iso));
}

export function OrderCard({ order, isNew, isPending, onStatusUpdate }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setDrawerOpen(true)}
        className={`cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-all duration-700 ${
          isNew ? "bg-primary/5 ring-2 ring-primary ring-offset-1" : ""
        }`}
      >
        {/* Header: code + status + time */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-wide">
              {order.order_code}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTime(order.created_at)}
          </span>
        </div>

        {/* Pickup name */}
        <p className="mb-2 text-sm font-medium">
          {order.pickup_name ?? (
            <span className="italic text-muted-foreground">Không đặt tên</span>
          )}
        </p>

        {/* Items */}
        <ul className="mb-3 space-y-1">
          {order.items.map((item, i) => (
            // Items within an order are immutable — index key is safe here.
            <li key={i} className="text-sm">
              <span className="font-medium">{item.quantity}×</span>{" "}
              {item.product_name}
              {item.selected_options.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({item.selected_options.map((o) => o.value_name).join(", ")})
                </span>
              )}
              {item.note && (
                <span className="block pl-4 text-xs italic text-muted-foreground">
                  {item.note}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Order note */}
        {order.note && (
          <p className="mb-3 border-l-2 pl-2 text-xs italic text-muted-foreground">
            Ghi chú: {order.note}
          </p>
        )}

        {/* Footer: total + payment + actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {formatCurrency(order.total_amount)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                order.payment_method === PAYMENT_METHOD.BANK_TRANSFER
                  ? "bg-secondary/15 text-secondary"
                  : "bg-status-done/15 text-status-done"
              }`}
            >
              {order.payment_method === PAYMENT_METHOD.BANK_TRANSFER
                ? "Chuyển khoản"
                : "Tiền mặt"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPending ? (
              <Loader2
                size={18}
                className="animate-spin text-muted-foreground"
              />
            ) : (
              <>
                {order.status === ORDER_STATUS.NEW && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate(order.id, ORDER_STATUS.MAKING);
                      }}
                      className="min-h-[44px] rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform active:scale-95"
                    >
                      Bắt đầu pha
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate(order.id, ORDER_STATUS.CANCELLED);
                      }}
                      className="min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-medium text-destructive transition-transform active:scale-95"
                    >
                      Hủy
                    </button>
                  </>
                )}
                {order.status === ORDER_STATUS.MAKING && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(order.id, ORDER_STATUS.DONE);
                    }}
                    className="min-h-[44px] rounded-lg bg-status-done px-3 py-1.5 text-xs font-medium text-white transition-transform active:scale-95"
                  >
                    Hoàn thành
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <OrderDetailDrawer
          order={order}
          onClose={() => setDrawerOpen(false)}
          isPending={isPending}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </>
  );
}
