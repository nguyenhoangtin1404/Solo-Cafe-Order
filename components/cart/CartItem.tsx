import { Minus, Plus, X } from "lucide-react";
import type { CartItem as CartItemType } from "@/types/order";

interface Props {
  item: CartItemType;
  index: number;
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
}

export function CartItem({ item, index, onUpdateQty, onRemove }: Props) {
  const optionText = item.selectedOptions.map((o) => o.valueName).join(", ");

  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{item.productName}</p>
        <button
          onClick={() => onRemove(index)}
          aria-label="Xóa món"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-secondary"
        >
          <X size={14} />
        </button>
      </div>
      {optionText && (
        <p className="mt-0.5 text-sm text-muted-foreground">{optionText}</p>
      )}
      {item.note && (
        <p className="mt-0.5 text-sm italic text-muted-foreground">
          &ldquo;{item.note}&rdquo;
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <p className="font-semibold">
          {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQty(index, item.quantity - 1)}
            aria-label="Giảm số lượng"
            disabled={item.quantity <= 1}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="w-7 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQty(index, item.quantity + 1)}
            aria-label="Tăng số lượng"
            disabled={item.quantity >= 99}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
