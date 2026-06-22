"use client";

import { useState } from "react";
import type { MenuProduct } from "@/types/menu";

interface Props {
  product: MenuProduct;
  cartCount: number;
  onClick: () => void;
}

export function MenuCard({ product, cartCount, onClick }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={`Chọn ${product.name}, ${product.price.toLocaleString("vi-VN")}đ`}
      className="relative flex w-full flex-col overflow-hidden rounded-xl bg-card text-left shadow-sm transition-transform active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.image_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            ☕
          </div>
        )}
        {cartCount > 0 && (
          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-2.5">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {product.name}
        </p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold text-primary">
            {product.price.toLocaleString("vi-VN")}đ
          </p>
          <div
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <span className="text-base font-bold leading-none">+</span>
          </div>
        </div>
      </div>
    </button>
  );
}
