import Link from "next/link";
import { getOrderByCode } from "@/lib/services/order.service";
import { isAppError } from "@/lib/errors";
import { OrderTrackingClient } from "./OrderTrackingClient";

const ORDER_CODE_RE = /^[A-Z]\d{3}$/;

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { code } = await params;

  if (!ORDER_CODE_RE.test(code)) {
    return <NotFound />;
  }

  let order;
  try {
    order = await getOrderByCode(code);
  } catch (err) {
    if (isAppError(err) && err.code === "ORDER_NOT_FOUND") {
      return <NotFound />;
    }
    throw err;
  }

  const { items, ...orderRow } = order;

  return (
    <OrderTrackingClient
      orderCode={order.order_code}
      initialOrder={orderRow}
      items={items}
    />
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-4xl">🔍</span>
      <h1 className="text-xl font-semibold">Không tìm thấy đơn hàng</h1>
      <p className="text-muted-foreground">
        Mã đơn không tồn tại hoặc đã hết hạn tra cứu.
      </p>
      <Link
        href="/menu"
        className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground"
      >
        Về menu
      </Link>
    </div>
  );
}
