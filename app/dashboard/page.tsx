"use client";

import { useState } from "react";
import { Bell, LogOut, Coffee, Clock, CheckCircle, XCircle, LayoutDashboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "new" | "making" | "done" | "cancelled";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  selected_options: { option_name: string; value_name: string; extra_price: number }[];
}

interface Order {
  id: string;
  order_code: string;
  status: OrderStatus;
  total_amount: number;
  pickup_name: string;
  note: string;
  created_at: string;
  items: OrderItem[];
}

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    order_code: "A005",
    status: "new",
    total_amount: 80000,
    pickup_name: "Hùng",
    note: "Ít đá",
    created_at: new Date(Date.now() - 120000).toISOString(),
    items: [{ product_name: "Cà Phê Sữa Đá", quantity: 2, unit_price: 40000, selected_options: [{ option_name: "Size", value_name: "L", extra_price: 5000 }] }],
  },
  {
    id: "2",
    order_code: "A004",
    status: "making",
    total_amount: 45000,
    pickup_name: "Lan",
    note: "",
    created_at: new Date(Date.now() - 300000).toISOString(),
    items: [{ product_name: "Cappuccino", quantity: 1, unit_price: 45000, selected_options: [] }],
  },
  {
    id: "3",
    order_code: "A003",
    status: "done",
    total_amount: 120000,
    pickup_name: "Minh",
    note: "",
    created_at: new Date(Date.now() - 600000).toISOString(),
    items: [{ product_name: "Trà Sữa", quantity: 3, unit_price: 40000, selected_options: [] }],
  },
];

const STATUS_TABS: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
  { key: "new", label: "Mới", icon: Clock },
  { key: "making", label: "Đang làm", icon: Coffee },
  { key: "done", label: "Xong", icon: CheckCircle },
  { key: "cancelled", label: "Đã huỷ", icon: XCircle },
];

const STATUS_BADGE: Record<OrderStatus, { label: string; cls: string }> = {
  new: { label: "Chờ xác nhận", cls: "bg-amber-100 text-amber-700" },
  making: { label: "Đang pha", cls: "bg-blue-100 text-blue-700" },
  done: { label: "Hoàn thành", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ", cls: "bg-gray-100 text-gray-600" },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "making",
  making: "done",
};

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  new: "Bắt đầu pha",
  making: "Đã xong",
};

function getTimeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}p`;
  return `${Math.floor(diff / 3600)}h`;
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const badge = STATUS_BADGE[order.status];
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_STATUS_LABEL[order.status];

  const borderColor =
    order.status === "new"
      ? "border-amber-300"
      : order.status === "making"
      ? "border-blue-300"
      : "border-cafe-100";

  return (
    <div className={`rounded-2xl bg-white shadow-sm border-2 ${borderColor} p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-gray-900">#{order.order_code}</span>
          {order.pickup_name && (
            <span className="rounded-lg bg-cafe-50 px-2 py-0.5 text-sm font-medium text-cafe-700">
              {order.pickup_name}
            </span>
          )}
        </div>
        <div className="text-right">
          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
          <p className="text-xs text-gray-400 mt-1">{getTimeAgo(order.created_at)} trước</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cafe-100 text-xs font-bold text-cafe-700">
              {item.quantity}
            </span>
            <span className="text-gray-800 font-medium">{item.product_name}</span>
            {item.selected_options.length > 0 && (
              <span className="text-gray-400 text-xs">
                {item.selected_options.map(o => o.value_name).join(", ")}
              </span>
            )}
          </div>
        ))}
      </div>

      {order.note && (
        <p className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm italic text-amber-800">
          📝 {order.note}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="font-bold text-cafe-700">{formatPrice(order.total_amount)}</span>
        <div className="flex gap-2">
          {order.status === "new" && (
            <button
              onClick={() => onStatusChange(order.id, "cancelled")}
              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 active:scale-95"
            >
              Huỷ
            </button>
          )}
          {nextStatus && nextLabel && (
            <button
              onClick={() => onStatusChange(order.id, nextStatus)}
              className="rounded-xl bg-cafe-600 px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-cafe-100 p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("new");
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [isLoading] = useState(false);

  const filtered = orders.filter(o => o.status === activeTab);
  const newCount = orders.filter(o => o.status === "new").length;
  const makingCount = orders.filter(o => o.status === "making").length;
  const doneCount = orders.filter(o => o.status === "done").length;

  function handleStatusChange(id: string, newStatus: OrderStatus) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-cafe-700 text-white px-4 pt-4 pb-0 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Dashboard</h1>
            <p className="text-cafe-200 text-xs">Hôm nay · {orders.length} đơn</p>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Bell className="h-5 w-5" />
            {newCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
                {newCount}
              </span>
            )}
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 pb-3">
          <div className="flex-1 rounded-xl bg-white/10 p-2.5 text-center">
            <p className="text-2xl font-black">{newCount}</p>
            <p className="text-xs text-cafe-200">Chờ xử lý</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 p-2.5 text-center">
            <p className="text-2xl font-black">{makingCount}</p>
            <p className="text-xs text-cafe-200">Đang pha</p>
          </div>
          <div className="flex-1 rounded-xl bg-white/10 p-2.5 text-center">
            <p className="text-2xl font-black">{doneCount}</p>
            <p className="text-xs text-cafe-200">Hoàn thành</p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border-t border-white/10 pt-2">
          {STATUS_TABS.map(tab => {
            const count = orders.filter(o => o.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 rounded-t-xl py-2 transition-colors ${
                  activeTab === tab.key ? "bg-white text-cafe-700" : "text-white/70 hover:text-white"
                }`}
              >
                <span className="text-xs font-semibold">{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                      activeTab === tab.key ? "bg-cafe-100 text-cafe-700" : "bg-white/20 text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Orders list */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <DashboardSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Coffee className="h-12 w-12 text-cafe-200" />
            <p className="text-sm">Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
