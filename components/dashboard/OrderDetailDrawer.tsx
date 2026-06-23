"use client";

import { X, ClipboardList, PlayCircle, Loader2 } from "lucide-react";
import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import type { DashboardOrder } from "./OrderCard";
import { StatusBadge } from "./StatusBadge";

interface Props {
  order: DashboardOrder;
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

const TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

export function OrderDetailDrawer({
  order,
  open,
  onClose,
  isPending,
  onStatusUpdate,
}: Props) {
  if (!open) return null;

  function handleAction(newStatus: OrderStatus) {
    onStatusUpdate(order.id, newStatus);
    onClose();
  }

  const isActionable =
    order.status === ORDER_STATUS.NEW || order.status === ORDER_STATUS.MAKING;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl bg-background shadow-xl">
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-bold">Chi tiết đơn</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Order meta */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-bold tracking-wide">
                Đơn {order.order_code} ·{" "}
                {TIME_FORMAT.format(new Date(order.created_at))}
              </span>
              <StatusBadge status={order.status} />
            </div>
            {order.pickup_name && (
              <p className="mt-1 text-sm font-medium text-primary">
                Gọi tên: {order.pickup_name}
              </p>
            )}
          </div>

          {/* Items */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sản phẩm
            </p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 rounded-xl border bg-card p-3">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        ☕
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {item.quantity}× {item.product_name}
                      </p>
                      <p className="flex-shrink-0 text-sm font-semibold">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </p>
                    </div>
                    {item.selected_options.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.selected_options.map((o) => o.value_name).join(", ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="mt-1 text-xs italic text-primary">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order note */}
          {order.note && (
            <div className="flex gap-3 rounded-xl border bg-card p-3">
              <ClipboardList
                size={16}
                className="mt-0.5 flex-shrink-0 text-muted-foreground"
              />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ghi chú đơn
                </p>
                <p className="text-sm">{order.note}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Tổng cộng ·{" "}
              {order.payment_method === PAYMENT_METHOD.BANK_TRANSFER
                ? "Chuyển khoản"
                : "Tiền mặt"}
            </span>
            <span className="text-lg font-bold">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {isActionable && (
          <div className="border-t px-4 py-4">
            {isPending ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex gap-3">
                {order.status === ORDER_STATUS.NEW && (
                  <>
                    <button
                      onClick={() => handleAction(ORDER_STATUS.CANCELLED)}
                      className="min-h-[44px] flex-1 rounded-full border border-destructive px-4 text-sm font-medium text-destructive transition-transform active:scale-95"
                    >
                      Huỷ đơn
                    </button>
                    <button
                      onClick={() => handleAction(ORDER_STATUS.MAKING)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-transform active:scale-95"
                    >
                      <PlayCircle size={16} />
                      Bắt đầu pha
                    </button>
                  </>
                )}
                {order.status === ORDER_STATUS.MAKING && (
                  <button
                    onClick={() => handleAction(ORDER_STATUS.DONE)}
                    className="min-h-[44px] flex-1 rounded-full bg-status-done px-4 text-sm font-medium text-white transition-transform active:scale-95"
                  >
                    Hoàn thành
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
