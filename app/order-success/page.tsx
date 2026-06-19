"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock } from "lucide-react";
import { ORDER_SUCCESS_SESSION_KEY } from "@/lib/constants";
import type { OrderSuccessData } from "@/types/order";

function readOrderSuccess(): OrderSuccessData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ORDER_SUCCESS_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderSuccessData;
    if (!parsed.order_code) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function OrderSuccessPage() {
  const router = useRouter();
  // Cache the first read so re-renders after removeItem don't return null.
  const snapshotRef = useRef<OrderSuccessData | null | undefined>(undefined);
  // useSyncExternalStore: server snapshot = null (matches SSR output),
  // client snapshot reads sessionStorage once, preventing hydration mismatch.
  const data = useSyncExternalStore(
    () => () => {},
    () => {
      if (snapshotRef.current === undefined) {
        snapshotRef.current = readOrderSuccess();
      }
      return snapshotRef.current;
    },
    () => null
  );

  useEffect(() => {
    if (!data) {
      router.replace("/menu");
    } else {
      sessionStorage.removeItem(ORDER_SUCCESS_SESSION_KEY);
    }
  }, [data, router]);

  if (!data) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center px-4 py-8">
        <CheckCircle size={56} className="text-status-done" />
        <h1 className="mt-3 text-2xl font-bold">Đặt hàng thành công!</h1>

        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">Mã đơn hàng của bạn</p>
          <p className="mt-1 text-5xl font-bold tracking-widest">
            {data.order_code}
          </p>
        </div>

        {data.pickup_name && (
          <p className="mt-2 text-muted-foreground">
            Lấy đơn:{" "}
            <span className="font-medium text-foreground">
              {data.pickup_name}
            </span>
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 rounded-full bg-status-new/10 px-4 py-2 text-status-new">
          <Clock size={16} />
          <span className="text-sm font-medium">
            Khoảng {data.wait_estimate}
          </span>
        </div>

        <div className="mt-6 w-full max-w-sm space-y-3">
          <div className="space-y-2 rounded-2xl border p-4">
            {data.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {item.quantity}× {item.product_name}
                  </p>
                  {item.selected_options.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {item.selected_options
                        .map((o) => o.value_name)
                        .join(", ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-xs italic text-muted-foreground">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-medium">
                  {(item.unit_price * item.quantity).toLocaleString("vi-VN")}đ
                </p>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Tổng</span>
              <span>{data.total_amount.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {data.bank_transfer_info && (
            <div className="space-y-2 rounded-2xl border border-secondary/30 bg-card p-4">
              <p className="font-semibold text-secondary">
                Thông tin chuyển khoản
              </p>
              <div className="space-y-1 text-sm text-foreground">
                <p>
                  Ngân hàng:{" "}
                  <span className="font-medium">
                    {data.bank_transfer_info.bank_name}
                  </span>
                </p>
                <p>
                  Số tài khoản:{" "}
                  <span className="font-mono text-base font-bold">
                    {data.bank_transfer_info.account_number}
                  </span>
                </p>
                <p>
                  Chủ tài khoản:{" "}
                  <span className="font-medium">
                    {data.bank_transfer_info.account_name}
                  </span>
                </p>
                <p>
                  Số tiền:{" "}
                  <span className="font-bold">
                    {data.total_amount.toLocaleString("vi-VN")}đ
                  </span>
                </p>
                <p>
                  Nội dung CK:{" "}
                  <span className="font-mono font-bold">{data.order_code}</span>
                </p>
              </div>
              {data.bank_transfer_info.qr_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.bank_transfer_info.qr_image_url}
                  alt="QR chuyển khoản"
                  className="mx-auto mt-2 h-48 w-48 rounded-lg"
                />
              )}
            </div>
          )}

          <Link
            href={`/order/${data.order_code}`}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary font-medium text-primary-foreground"
          >
            Theo dõi đơn hàng
          </Link>
          <Link
            href="/menu"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-secondary font-medium text-secondary-foreground"
          >
            Đặt thêm
          </Link>
        </div>
      </div>
    </div>
  );
}
