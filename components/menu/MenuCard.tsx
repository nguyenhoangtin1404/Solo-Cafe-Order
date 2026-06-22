"use client";

import { useEffect, useState } from "react";
import type { MenuProduct } from "@/types/menu";

interface Props {
  product: MenuProduct;
  cartCount: number;
  onClick: () => void;
}

function CardImage({
  url,
  name,
  cartCount,
}: {
  url: string | null | undefined;
  name: string;
  cartCount: number;
}) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [url]);
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-muted">
      {url && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
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
  );
}

export function MenuCard({ product, cartCount, onClick }: Props) {
  const formattedPrice = product.price.toLocaleString("vi-VN");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Chọn ${product.name}, ${formattedPrice}đ${cartCount > 0 ? `, đã có ${cartCount} trong giỏ` : ""}`}
      aria-haspopup="dialog"
      className="relative flex w-full flex-col overflow-hidden rounded-xl bg-card text-left shadow-sm transition-transform active:scale-[0.98]"
    >
      <CardImage
        url={product.image_url}
        name={product.name}
        cartCount={cartCount}
      />
      <div className="flex flex-col gap-1 p-2.5">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {product.name}
        </p>
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold text-primary">
            {formattedPrice}đ
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
