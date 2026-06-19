import { ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";

const CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  [ORDER_STATUS.NEW]: {
    label: "Mới",
    className: "bg-status-new/15 text-status-new",
  },
  [ORDER_STATUS.MAKING]: {
    label: "Đang làm",
    className: "bg-status-making/15 text-status-making",
  },
  [ORDER_STATUS.DONE]: {
    label: "Xong",
    className: "bg-status-done/15 text-status-done",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Đã hủy",
    className: "bg-status-cancelled/15 text-status-cancelled",
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
