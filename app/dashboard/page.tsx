import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth/requireOwner";
import { listOrders } from "@/lib/services/order.service";
import { DashboardView } from "@/components/dashboard/DashboardView";
import type { Order } from "@/types/order";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    await requireOwner();
  } catch {
    redirect("/login");
  }

  // Fetch active queue (full list — service ignores pagination for new/making)
  // plus 20 most recent completed/cancelled for the "Xong" tab
  const [{ orders: newOrders }, { orders: makingOrders }, { orders: doneOrders }] =
    await Promise.all([
      listOrders("new", undefined, 100),
      listOrders("making", undefined, 100),
      listOrders("done", undefined, 20),
    ]);

  const initialOrders: Order[] = [...newOrders, ...makingOrders, ...doneOrders];

  return <DashboardView initialOrders={initialOrders} />;
}
