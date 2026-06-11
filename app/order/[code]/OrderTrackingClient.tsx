"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import type { OrderRow } from "@/hooks/useOrderTracking";
import type { OrderItem } from "@/types/order";
import { ORDER_STATUS } from "@/lib/constants";

interface Props {
  orderCode: string;
  initialOrder: OrderRow;
  items: OrderItem[];
}

const STEPS = ["Đã nhận", "Đang pha", "Sẵn sàng"] as const;
const STEP_STATUSES = [
  ORDER_STATUS.NEW,
  ORDER_STATUS.MAKING,
  ORDER_STATUS.DONE,
] as const;

export function OrderTrackingClient({ orderCode, initialOrder, items }: Props) {
  const { order, connectionStatus } = useOrderTracking(orderCode, initialOrder);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const current = order ?? initialOrder;
  const status = current.status;
  const stepIndex = STEP_STATUSES.indexOf(
    status as (typeof STEP_STATUSES)[number]
  );

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderCode}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        toast.error(err.message ?? "Không thể hủy đơn.");
        setShowConfirm(false);
        return;
      }
      toast.success("Đơn hàng đã được hủy.");
      setShowConfirm(false);
    } catch {
      toast.error("Mất kết nối. Vui lòng thử lại.");
      setShowConfirm(false);
    } finally {
      setCancelling(false);
    }
  }, [orderCode]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href="/menu"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-semibold">Đơn {orderCode}</h1>
          <ConnectionStatus status={connectionStatus} />
        </div>
      </header>

      <div className="flex-1 space-y-4 px-4 py-6">
        <div className="rounded-2xl bg-card p-5 text-center shadow-sm">
          {status === ORDER_STATUS.CANCELLED ? (
            <>
              <XCircle size={48} className="mx-auto text-red-500" />
              <p className="mt-2 text-lg font-semibold">Đã hủy</p>
            </>
          ) : status === ORDER_STATUS.DONE ? (
            <>
              <CheckCircle size={48} className="mx-auto text-green-500" />
              <p className="mt-2 text-lg font-semibold">Sẵn sàng lấy đồ! 🎉</p>
              {current.pickup_name && (
                <p className="text-muted-foreground">
                  {current.pickup_name}, đồ của bạn đây!
                </p>
              )}
            </>
          ) : (
            <>
              <ProgressSteps currentStep={stepIndex} />
              {current.pickup_name && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Tên lấy:{" "}
                  <span className="font-medium text-foreground">
                    {current.pickup_name}
                  </span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-2 rounded-2xl border p-4">
          <p className="mb-1 font-semibold">Chi tiết đơn hàng</p>
          {items.map((item) => (
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
              </div>
              <p className="shrink-0 text-sm">
                {(item.unit_price * item.quantity).toLocaleString("vi-VN")}đ
              </p>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Tổng</span>
            <span>{current.total_amount.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        {status === ORDER_STATUS.NEW && !showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            className="min-h-[44px] w-full rounded-xl border border-destructive py-3 font-medium text-destructive"
          >
            Hủy đơn
          </button>
        )}

        {showConfirm && status === ORDER_STATUS.NEW && (
          <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">Xác nhận hủy đơn?</p>
            <p className="text-sm text-muted-foreground">
              Đơn đang chờ xử lý. Bạn có chắc muốn hủy không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="min-h-[44px] flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium"
              >
                Không hủy
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="min-h-[44px] flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectionStatus({
  status,
}: {
  status: "connected" | "connecting" | "disconnected";
}) {
  if (status === "connected")
    return <p className="text-xs text-green-600">● Live</p>;
  if (status === "connecting")
    return <p className="text-xs text-amber-500">● Đang kết nối...</p>;
  return <p className="text-xs text-red-500">● Mất kết nối</p>;
}

function ProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                i < currentStep
                  ? "bg-green-500 text-white"
                  : i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <p
              className={`mt-1 max-w-[60px] text-center text-xs ${
                i === currentStep ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mb-5 h-0.5 w-10 ${
                i < currentStep ? "bg-green-500" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
