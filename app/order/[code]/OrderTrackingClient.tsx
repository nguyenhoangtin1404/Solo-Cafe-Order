"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

interface LayoutProps {
  orderCode: string;
  current: OrderRow;
  items: OrderItem[];
  status: OrderStatus;
  stepIndex: number;
  orderTime: string;
  connectionStatus: "connected" | "connecting" | "disconnected";
  showConfirm: boolean;
  cancelling: boolean;
  onShow: () => void;
  onDismiss: () => void;
  onConfirm: () => void;
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

const VALID_STATUSES: string[] = Object.values(ORDER_STATUS);
function isValidStatus(s: string): s is OrderStatus {
  return VALID_STATUSES.includes(s);
}

function formatOrderTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function useCancelOrder(orderCode: string, orderId: string) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [localCancelled, setLocalCancelled] = useState(false);
  const inFlightRef = useRef(false);

  const handleCancel = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setCancelling(true);
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/orders/${orderCode}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (!res.ok) {
        let errMsg = "Không thể hủy đơn.";
        try {
          const body = (await res.json()) as { message?: string };
          if (body.message) errMsg = body.message;
        } catch {}
        toast.error(errMsg);
        return;
      }
      toast.success("Đơn hàng đã được hủy.");
      setLocalCancelled(true);
    } catch {
      toast.error("Mất kết nối. Vui lòng thử lại.");
    } finally {
      inFlightRef.current = false;
      setCancelling(false);
    }
  }, [orderCode, orderId]);

  return {
    showConfirm,
    setShowConfirm,
    cancelling,
    localCancelled,
    setLocalCancelled,
    handleCancel,
  };
}

export function OrderTrackingClient({ orderCode, initialOrder, items }: Props) {
  const { order, connectionStatus } = useOrderTracking(orderCode, initialOrder);
  const {
    showConfirm,
    setShowConfirm,
    cancelling,
    localCancelled,
    setLocalCancelled,
    handleCancel,
  } = useCancelOrder(orderCode, (order ?? initialOrder).id);

  const current = order ?? initialOrder;
  const rawStatus = current.status;
  const status: OrderStatus = localCancelled
    ? ORDER_STATUS.CANCELLED
    : isValidStatus(rawStatus)
      ? rawStatus
      : ORDER_STATUS.NEW;
  const stepIndex = (STEP_STATUSES as ReadonlyArray<OrderStatus>).indexOf(
    status
  );
  const orderTime = useMemo(
    () => formatOrderTime(current.created_at),
    [current.created_at]
  );
  const handleShow = useCallback(() => setShowConfirm(true), [setShowConfirm]);
  const handleDismiss = useCallback(
    () => setShowConfirm(false),
    [setShowConfirm]
  );
  const prevStatusRef = useRef<OrderStatus>(status);

  // Clear optimistic flag once realtime confirms the cancel
  useEffect(() => {
    if (localCancelled && current.status === ORDER_STATUS.CANCELLED)
      setLocalCancelled(false);
  }, [current.status, localCancelled, setLocalCancelled]);

  // Dismiss confirm dialog if owner moves order past "new" while dialog is open
  useEffect(() => {
    if (
      prevStatusRef.current === ORDER_STATUS.NEW &&
      status !== ORDER_STATUS.NEW &&
      showConfirm
    ) {
      setShowConfirm(false);
      toast.info("Đơn hàng đã được xử lý — không thể hủy nữa.");
    }
    prevStatusRef.current = status;
  }, [status, showConfirm, setShowConfirm]);

  return (
    <OrderTrackingLayout
      orderCode={orderCode}
      current={current}
      items={items}
      status={status}
      stepIndex={stepIndex}
      orderTime={orderTime}
      connectionStatus={connectionStatus}
      showConfirm={showConfirm}
      cancelling={cancelling}
      onShow={handleShow}
      onDismiss={handleDismiss}
      onConfirm={handleCancel}
    />
  );
}

function OrderTrackingLayout({
  orderCode,
  current,
  items,
  status,
  stepIndex,
  orderTime,
  connectionStatus,
  showConfirm,
  cancelling,
  onShow,
  onDismiss,
  onConfirm,
}: LayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-bold text-primary">Vibe Cafe</span>
        <ConnectionStatus status={connectionStatus} />
      </header>

      <main className="flex flex-1 flex-col">
        {connectionStatus === "disconnected" && (
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <span>Mất kết nối. Trạng thái có thể chưa cập nhật.</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-4 underline"
            >
              Tải lại
            </button>
          </div>
        )}

        <div className="px-4 pt-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Đơn hàng</p>
              <h1 className="text-2xl font-bold tracking-tight">
                #{orderCode}
              </h1>
            </div>
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`mt-1 rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE_CLASS[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>

          {current.pickup_name && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <User size={14} aria-hidden="true" />
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
            orderTime={orderTime}
            pickupName={current.pickup_name}
          />

          <OrderItemList items={items} total={current.total_amount} />

          <CancelSection
            status={status}
            showConfirm={showConfirm}
            cancelling={cancelling}
            onShow={onShow}
            onDismiss={onDismiss}
            onConfirm={onConfirm}
          />

          <SupportButton phone={SUPPORT_PHONE} />

          {(status === ORDER_STATUS.DONE ||
            status === ORDER_STATUS.CANCELLED) && (
            <Link
              href="/menu"
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary font-medium text-primary-foreground"
            >
              Đặt thêm ☕
            </Link>
          )}
        </div>
      </main>
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
      <h2 className="mb-4 text-center text-base font-semibold">
        {status === ORDER_STATUS.DONE && pickupName
          ? `Lấy tại quầy nhé ${pickupName} ☕`
          : STATUS_SUBTITLE[status]}
      </h2>
      {status !== ORDER_STATUS.CANCELLED && (
        <ProgressSteps
          currentStep={stepIndex}
          done={status === ORDER_STATUS.DONE}
        />
      )}
    </div>
  );
}

const OrderItemList = memo(function OrderItemList({
  items,
  total,
}: {
  items: OrderItem[];
  total: number;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <h2 className="mb-3 text-base font-semibold">Chi tiết món</h2>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Không có thông tin món.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2"
            >
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
          ))
        )}
      </div>
      <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
        <span>Tổng cộng</span>
        <span>{total.toLocaleString("vi-VN")}đ</span>
      </div>
    </div>
  );
});

const CancelSection = memo(function CancelSection({
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevShowConfirmRef = useRef(false);

  useEffect(() => {
    if (showConfirm) {
      dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    } else if (prevShowConfirmRef.current) {
      triggerRef.current?.focus();
    }
    prevShowConfirmRef.current = showConfirm;
  }, [showConfirm]);

  if (status !== ORDER_STATUS.NEW) return null;

  if (showConfirm) {
    return (
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      >
        <p id="cancel-dialog-title" className="font-medium text-destructive">
          Xác nhận hủy đơn?
        </p>
        <p className="text-sm text-muted-foreground">
          Đơn đang chờ xử lý. Bạn có chắc muốn hủy không?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[44px] flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground"
          >
            Không hủy
          </button>
          <button
            type="button"
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
        ref={triggerRef}
        type="button"
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
});

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
  const colorClass =
    status === "connected"
      ? "text-status-done"
      : status === "connecting"
        ? "text-status-new"
        : "text-destructive";
  const label =
    status === "connected"
      ? "Live"
      : status === "connecting"
        ? "Đang kết nối..."
        : "Mất kết nối";
  return (
    <span role="status" className={`text-xs ${colorClass}`}>
      <span aria-hidden="true">● </span>
      {label}
    </span>
  );
}

function ProgressSteps({
  currentStep,
  done,
}: {
  currentStep: number;
  done: boolean;
}) {
  return (
    <div role="list" className="flex items-center justify-center">
      {STEPS.map((label, i) => {
        const completed = done || i < currentStep;
        const active = !done && i === currentStep;
        return (
          <div key={label} role="listitem" className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                aria-hidden="true"
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
                aria-current={active ? "step" : undefined}
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
                aria-hidden="true"
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
