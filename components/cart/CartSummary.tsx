"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { CartItem, OrderSuccessData } from "@/types/order";
import {
  MAX_ORDER_NOTE_LENGTH,
  MAX_PICKUP_NAME_LENGTH,
  ORDER_CODE_RE,
  ORDER_SUCCESS_SESSION_KEY,
  PAYMENT_METHOD,
} from "@/lib/constants";
import { saveLastOrderCode } from "@/lib/lastOrderStorage";
import type { PaymentMethod } from "@/lib/constants";
import {
  getSavedPickupName,
  savePickupName,
  deleteSavedPickupName,
} from "@/lib/customerStorage";

interface Props {
  items: CartItem[];
  total: number;
  onClearCart: () => void;
}

const PAYMENT_OPTIONS = [
  { value: PAYMENT_METHOD.CASH, label: "Tiền mặt" },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: "Chuyển khoản" },
] as const;

function applyOrderSuccess(
  data: OrderSuccessData,
  onClearCart: () => void,
  router: AppRouterInstance
): void {
  const codeValid = ORDER_CODE_RE.test(data.order_code);
  if (codeValid) saveLastOrderCode(data.order_code);
  try {
    sessionStorage.setItem(ORDER_SUCCESS_SESSION_KEY, JSON.stringify(data));
    onClearCart();
    router.push("/order-success");
  } catch {
    onClearCart();
    toast.success(
      `Đặt hàng thành công! Mã đơn: ${data.order_code}. Lưu lại nhé!`
    );
    if (codeValid) router.push(`/order/${data.order_code}`);
  }
}

export function CartSummary({ items, total, onClearCart }: Props) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [pickupName, setPickupName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PAYMENT_METHOD.CASH
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getSavedPickupName();
    if (saved) {
      const timer = setTimeout(() => {
        setPickupName(saved);
        setRememberMe(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const pickupNameTooLong = pickupName.length > MAX_PICKUP_NAME_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current || items.length === 0 || pickupNameTooLong)
      return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_name: pickupName.trim() || null,
          note: orderNote.trim() || null,
          payment_method: paymentMethod,
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            selected_option_value_ids: item.selectedOptions.map(
              (o) => o.valueId
            ),
            note: item.note,
          })),
        }),
      });
      if (res.status === 429) {
        toast.error("Vui lòng chờ 1 phút rồi thử lại.");
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        toast.error(err?.message ?? "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }

      // Save or delete pickup name based on checkbox status
      const trimmedName = pickupName.trim();
      if (rememberMe && trimmedName) {
        savePickupName(trimmedName);
      } else {
        deleteSavedPickupName();
      }

      let data: OrderSuccessData;
      try {
        data = (await res.json()) as OrderSuccessData;
      } catch {
        toast.error("Lỗi đọc phản hồi từ máy chủ.");
        return;
      }
      applyOrderSuccess(data, onClearCart, router);
    } catch {
      toast.error("Mất kết nối. Vui lòng thử lại.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t px-4 py-4">
      <div>
        <label
          htmlFor="pickup-name"
          className="mb-1.5 block text-sm font-medium"
        >
          Tên lấy đồ (tùy chọn)
        </label>
        <input
          id="pickup-name"
          type="text"
          value={pickupName}
          onChange={(e) => setPickupName(e.target.value)}
          placeholder="Nhập tên để nhân viên gọi khi xong"
          maxLength={MAX_PICKUP_NAME_LENGTH}
          className="w-full rounded-lg border border-input px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {pickupNameTooLong && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            Tên quá dài ({pickupName.length}/{MAX_PICKUP_NAME_LENGTH} ký tự)
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary accent-primary focus:ring-primary cursor-pointer"
          />
          <label
            htmlFor="remember-me"
            className="select-none text-xs text-muted-foreground cursor-pointer"
          >
            Lưu tên lấy đồ cho lần đặt sau
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="order-note"
          className="mb-1.5 block text-sm font-medium"
        >
          Ghi chú đơn (tùy chọn)
        </label>
        <textarea
          id="order-note"
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Ghi chú cho toàn bộ đơn hàng..."
          maxLength={MAX_ORDER_NOTE_LENGTH}
          rows={2}
          className="w-full resize-none rounded-lg border border-input px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <fieldset>
        <legend id="payment-legend" className="mb-2 text-sm font-medium">
          Phương thức thanh toán
        </legend>
        <div
          role="radiogroup"
          aria-labelledby="payment-legend"
          className="space-y-2"
          onKeyDown={(e) => {
            const values = PAYMENT_OPTIONS.map((o) => o.value);
            const idx = values.indexOf(paymentMethod);
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
              e.preventDefault();
              setPaymentMethod(values[(idx + 1) % values.length]);
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
              e.preventDefault();
              setPaymentMethod(
                values[(idx - 1 + values.length) % values.length]
              );
            }
          }}
        >
          {PAYMENT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={paymentMethod === value}
              tabIndex={paymentMethod === value ? 0 : -1}
              onClick={() => setPaymentMethod(value)}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border p-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                paymentMethod === value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  paymentMethod === value
                    ? "border-primary"
                    : "border-muted-foreground"
                }`}
              >
                {paymentMethod === value && (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </span>
              <span className={paymentMethod === value ? "font-medium" : ""}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading || pickupNameTooLong || items.length === 0}
        className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading
          ? "Đang đặt hàng..."
          : `Đặt hàng — ${total.toLocaleString("vi-VN")}đ`}
      </button>
    </form>
  );
}
