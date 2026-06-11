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
      aria-label={`Chọn ${product.name}`}
      className="flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left shadow-sm transition-transform active:scale-[0.98]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
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
          <div className="flex h-full w-full items-center justify-center text-3xl">
            ☕
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground line-clamp-2">
          {product.name}
        </p>
        {product.description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
            {product.description}
          </p>
        )}
        <p className="mt-1 font-semibold">
          {product.price.toLocaleString("vi-VN")}đ
        </p>
      </div>
      <div
        aria-hidden="true"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <span className="text-xl font-bold leading-none">+</span>
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </div>
    </button>
  );
}
