"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { CartItem, OrderSuccessData } from "@/types/order";
import {
  MAX_ORDER_NOTE_LENGTH,
  MAX_PICKUP_NAME_LENGTH,
  ORDER_SUCCESS_SESSION_KEY,
  PAYMENT_METHOD,
} from "@/lib/constants";
import type { PaymentMethod } from "@/lib/constants";

interface Props {
  items: CartItem[];
  total: number;
  onClearCart: () => void;
}

export function CartSummary({ items, total, onClearCart }: Props) {
  const router = useRouter();
  const [pickupName, setPickupName] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PAYMENT_METHOD.CASH
  );
  const [loading, setLoading] = useState(false);

  const pickupNameTooLong = pickupName.length > MAX_PICKUP_NAME_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || items.length === 0 || pickupNameTooLong) return;
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
      const data = (await res.json()) as OrderSuccessData;
      try {
        sessionStorage.setItem(ORDER_SUCCESS_SESSION_KEY, JSON.stringify(data));
      } catch {
        onClearCart();
        toast.success(
          `Đặt hàng thành công! Mã đơn: ${data.order_code ?? ""}. Lưu lại nhé!`
        );
        if (data.order_code) router.push(`/order/${data.order_code}`);
        return;
      }
      onClearCart();
      router.push("/order-success");
    } catch {
      toast.error("Mất kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t px-4 py-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Tên lấy đồ (tùy chọn)
        </label>
        <input
          type="text"
          value={pickupName}
          onChange={(e) => setPickupName(e.target.value)}
          placeholder="Nhập tên để nhân viên gọi khi xong"
          maxLength={MAX_PICKUP_NAME_LENGTH}
          className="w-full rounded-lg border border-input px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {pickupNameTooLong && (
          <p className="mt-1 text-xs text-destructive">
            Tên quá dài ({pickupName.length}/{MAX_PICKUP_NAME_LENGTH} ký tự)
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Ghi chú đơn (tùy chọn)
        </label>
        <textarea
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Ghi chú cho toàn bộ đơn hàng..."
          maxLength={MAX_ORDER_NOTE_LENGTH}
          rows={2}
          className="w-full resize-none rounded-lg border border-input px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Phương thức thanh toán
        </legend>
        <div role="radiogroup" className="space-y-2">
          {(
            [
              { value: PAYMENT_METHOD.CASH, label: "Tiền mặt" },
              { value: PAYMENT_METHOD.BANK_TRANSFER, label: "Chuyển khoản" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={paymentMethod === value}
              onClick={() => setPaymentMethod(value)}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
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
        disabled={loading || pickupNameTooLong}
        className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading
          ? "Đang đặt hàng..."
          : `Đặt hàng — ${total.toLocaleString("vi-VN")}đ`}
      </button>
    </form>
  );
}
