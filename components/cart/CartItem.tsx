"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "@/types/order";

interface Props {
  item: CartItemType;
  index: number;
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
}

export function CartItem({ item, index, onUpdateQty, onRemove }: Props) {
  // Track the specific URL that failed so the error resets automatically
  // when imageUrl changes (e.g. owner re-uploads the product image).
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(item.imageUrl) && item.imageUrl !== failedUrl;
  const optionText = item.selectedOptions.map((o) => o.valueName).join(", ");

  return (
    <div className="flex gap-3 rounded-xl bg-card p-3 shadow-sm">
      {/* Thumbnail */}
      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {showImage ? (
          <img
            src={item.imageUrl!}
            alt={item.productName}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setFailedUrl(item.imageUrl ?? null)}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-2xl"
          >
            ☕
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-tight">{item.productName}</p>
          <p className="flex-shrink-0 font-semibold">
            {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
          </p>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQty(index, item.quantity - 1)}
              aria-label="Giảm số lượng"
              disabled={item.quantity <= 1}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-40"
            >
              <Minus size={14} />
            </button>
            <span
              aria-live="polite"
              className="w-7 text-center text-sm font-medium"
            >
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(index, item.quantity + 1)}
              aria-label="Tăng số lượng"
              disabled={item.quantity >= 99}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={() => onRemove(index)}
            aria-label="Xóa món"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
