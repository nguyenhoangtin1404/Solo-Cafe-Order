"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Phone, User } from "lucide-react";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import type { OrderRow } from "@/hooks/useOrderTracking";
import type { OrderItem } from "@/types/order";
import { ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";

interface Props {
  orderCode: string;
  initialOrder: OrderRow;
  items: OrderItem[];
}

const STEPS = ["Đang chờ", "Đang pha chế", "Hoàn thành"] as const;
const STEP_STATUSES = [
  ORDER_STATUS.NEW,
  ORDER_STATUS.MAKING,
  ORDER_STATUS.DONE,
] as const;

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Mới",
  making: "Đang pha chế",
  done: "Hoàn thành",
  cancelled: "Đã hủy",
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-700",
  making: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-destructive/10 text-destructive",
};

const STATUS_SUBTITLE: Record<OrderStatus, string> = {
  new: "Quán đang chuẩn bị nhận đơn của bạn...",
  making: "Barista đang pha chế cho bạn ☕",
  done: "Đồ uống của bạn đã sẵn sàng! 🎉",
  cancelled: "Đơn hàng đã được hủy.",
};

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? null;

function formatOrderTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function OrderTrackingClient({ orderCode, initialOrder, items }: Props) {
  const { order, connectionStatus } = useOrderTracking(orderCode, initialOrder);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [localCancelled, setLocalCancelled] = useState(false);

  const current = order ?? initialOrder;
  const status: OrderStatus = localCancelled
    ? ORDER_STATUS.CANCELLED
    : (current.status as OrderStatus);
  const stepIndex = STEP_STATUSES.indexOf(
    status as (typeof STEP_STATUSES)[number]
  );

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderCode}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: current.id }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        toast.error(err.message ?? "Không thể hủy đơn.");
        setShowConfirm(false);
        return;
      }
      toast.success("Đơn hàng đã được hủy.");
      setLocalCancelled(true);
      setShowConfirm(false);
    } catch {
      toast.error("Mất kết nối. Vui lòng thử lại.");
      setShowConfirm(false);
    } finally {
      setCancelling(false);
    }
  }, [orderCode, current.id]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-bold text-primary">☕ Vibe Cafe</span>
        <ConnectionStatus status={connectionStatus} />
      </header>

      <div className="px-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Đơn hàng</p>
            <h1 className="text-2xl font-bold tracking-tight">#{orderCode}</h1>
          </div>
          <span
            className={`mt-1 rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE_CLASS[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>

        {current.pickup_name && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <User size={14} />
            <span>
              Gọi tên:{" "}
              <span className="font-medium text-foreground">
                {current.pickup_name}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 px-4 py-4">
        <StatusCard
          status={status}
          stepIndex={stepIndex}
          orderTime={formatOrderTime(current.created_at)}
          pickupName={current.pickup_name}
        />

        <OrderItemList items={items} total={current.total_amount} />

        <CancelSection
          status={status}
          showConfirm={showConfirm}
          cancelling={cancelling}
          onShow={() => setShowConfirm(true)}
          onDismiss={() => setShowConfirm(false)}
          onConfirm={handleCancel}
        />

        <SupportButton phone={SUPPORT_PHONE} />
      </div>
    </div>
  );
}

function StatusCard({
  status,
  stepIndex,
  orderTime,
  pickupName,
}: {
  status: OrderStatus;
  stepIndex: number;
  orderTime: string;
  pickupName: string | null;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <p className="mb-1 text-center text-sm text-muted-foreground">
        Đặt lúc {orderTime}
      </p>
      <p className="mb-4 text-center font-semibold">
        {status === ORDER_STATUS.DONE && pickupName
          ? `Lấy tại quầy nhé ${pickupName} ☕`
          : STATUS_SUBTITLE[status]}
      </p>
      {status !== ORDER_STATUS.CANCELLED && (
        <ProgressSteps
          currentStep={stepIndex}
          done={status === ORDER_STATUS.DONE}
        />
      )}
    </div>
  );
}

function OrderItemList({
  items,
  total,
}: {
  items: OrderItem[];
  total: number;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="mb-3 font-semibold">Chi tiết món</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium">
                {item.quantity}× {item.product_name}
              </p>
              {item.selected_options.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {item.selected_options.map((o) => o.value_name).join(", ")}
                </p>
              )}
              {item.note && (
                <p className="text-xs italic text-muted-foreground">
                  &ldquo;{item.note}&rdquo;
                </p>
              )}
            </div>
            <p className="shrink-0 font-medium">
              {(item.unit_price * item.quantity).toLocaleString("vi-VN")}đ
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
        <span>Tổng cộng</span>
        <span>{total.toLocaleString("vi-VN")}đ</span>
      </div>
    </div>
  );
}

function CancelSection({
  status,
  showConfirm,
  cancelling,
  onShow,
  onDismiss,
  onConfirm,
}: {
  status: OrderStatus;
  showConfirm: boolean;
  cancelling: boolean;
  onShow: () => void;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  if (status !== ORDER_STATUS.NEW) return null;

  if (showConfirm) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="font-medium text-destructive">Xác nhận hủy đơn?</p>
        <p className="text-sm text-muted-foreground">
          Đơn đang chờ xử lý. Bạn có chắc muốn hủy không?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="min-h-[44px] flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground"
          >
            Không hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="min-h-[44px] flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground disabled:opacity-50"
          >
            {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={onShow}
        className="min-h-[44px] w-full rounded-xl border border-destructive py-3 font-medium text-destructive"
      >
        Huỷ đơn hàng
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Bạn chỉ có thể hủy khi đơn đang ở trạng thái &ldquo;Đang chờ&rdquo;
      </p>
    </div>
  );
}

function SupportButton({ phone }: { phone: string | null }) {
  const content = (
    <>
      <Phone size={16} />
      <span>Cần hỗ trợ?</span>
    </>
  );

  if (phone) {
    return (
      <a
        href={`tel:${phone}`}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border py-3 font-medium text-foreground"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toast("Liên hệ quán để được hỗ trợ nhé!")}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border py-3 font-medium text-foreground"
    >
      {content}
    </button>
  );
}

function ConnectionStatus({
  status,
}: {
  status: "connected" | "connecting" | "disconnected";
}) {
  if (status === "connected")
    return <p className="text-xs text-status-done">● Live</p>;
  if (status === "connecting")
    return <p className="text-xs text-status-new">● Đang kết nối...</p>;
  return <p className="text-xs text-destructive">● Mất kết nối</p>;
}

function ProgressSteps({
  currentStep,
  done,
}: {
  currentStep: number;
  done: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((label, i) => {
        const completed = done || i < currentStep;
        const active = !done && i === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  completed
                    ? "bg-status-done text-white"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {completed ? "✓" : i + 1}
              </div>
              <p
                className={`mt-1.5 max-w-[64px] text-center text-xs leading-tight ${
                  active
                    ? "font-semibold text-foreground"
                    : completed
                      ? "text-status-done"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-6 h-0.5 w-10 transition-colors ${
                  done || i < currentStep ? "bg-status-done" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
