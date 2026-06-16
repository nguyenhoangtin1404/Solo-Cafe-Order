import { redirect } from "next/navigation";
import { isAppError } from "@/lib/errors";
import { requireOwner } from "@/lib/auth/requireOwner";
import { listOrders } from "@/lib/services/order.service";
import { DashboardView } from "@/components/dashboard/DashboardView";
import type { Order } from "@/types/order";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    await requireOwner();
  } catch (err) {
    if (isAppError(err) && (err.httpStatus === 401 || err.httpStatus === 403)) {
      redirect("/login");
    }
    throw err;
  }

  // Fetch active queue (full list — service ignores pagination for new/making)
  // plus 20 most recent done AND cancelled for the "Xong" tab
  const [
    { orders: newOrders },
    { orders: makingOrders },
    { orders: doneOrders },
    { orders: cancelledOrders },
  ] = await Promise.all([
    listOrders("new", undefined, 100),
    listOrders("making", undefined, 100),
    listOrders("done", undefined, 20),
    listOrders("cancelled", undefined, 20),
  ]);

  // Deduplicate by id: 4 parallel queries can race if an order changes status
  // between query completions (e.g., new→making), causing the same id to appear twice.
  const seen = new Map<string, Order>();
  [...newOrders, ...makingOrders, ...doneOrders, ...cancelledOrders].forEach(
    (o) => {
      const existing = seen.get(o.id);
      if (!existing || new Date(o.updated_at) > new Date(existing.updated_at))
        seen.set(o.id, o);
    }
  );
  const initialOrders: Order[] = Array.from(seen.values());

  return <DashboardView initialOrders={initialOrders} />;
}
