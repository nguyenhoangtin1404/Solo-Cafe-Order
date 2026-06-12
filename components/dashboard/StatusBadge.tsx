import { ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";

const CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  [ORDER_STATUS.NEW]: {
    label: "Mới",
    className: "bg-blue-100 text-blue-700",
  },
  [ORDER_STATUS.MAKING]: {
    label: "Đang làm",
    className: "bg-yellow-100 text-yellow-700",
  },
  [ORDER_STATUS.DONE]: {
    label: "Xong",
    className: "bg-gray-100 text-gray-600",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Đã hủy",
    className: "bg-red-100 text-red-600",
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
