import Link from "next/link";
import { getOrderByCode } from "@/lib/services/order.service";
import { isAppError } from "@/lib/errors";
import { OrderTrackingClient } from "./OrderTrackingClient";
import { ORDER_CODE_RE } from "@/lib/constants";

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
      key={order.order_code}
      orderCode={order.order_code}
      initialOrder={orderRow}
      items={items}
    />
  );
}

function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
      style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
    >
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
