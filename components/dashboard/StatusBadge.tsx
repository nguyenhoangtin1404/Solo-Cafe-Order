import { ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";

const CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  [ORDER_STATUS.NEW]: {
    label: "Đang chờ",
    className: "bg-amber-100 text-amber-800",
  },
  [ORDER_STATUS.MAKING]: {
    label: "Đang làm",
    className: "bg-orange-100 text-orange-800",
  },
  [ORDER_STATUS.DONE]: {
    label: "Xong",
    className: "bg-green-100 text-green-800",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Đã hủy",
    className: "bg-red-100 text-red-700",
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
