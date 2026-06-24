"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, UtensilsCrossed, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useLastOrder } from "@/hooks/useLastOrder";

function MenuTab({ isActive }: { isActive: boolean }) {
  return (
    <Link
      href="/menu"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <UtensilsCrossed size={22} aria-hidden="true" />
      <span>Thực đơn</span>
    </Link>
  );
}

function CartTab({ isActive, count }: { isActive: boolean; count: number }) {
  return (
    <Link
      href="/cart"
      aria-current={isActive ? "page" : undefined}
      aria-label={count > 0 ? `Giỏ hàng (${count} món)` : "Giỏ hàng"}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <span className="relative">
        <ShoppingCart size={22} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span aria-hidden="true">Giỏ hàng</span>
    </Link>
  );
}

function OrderTab({
  isActive,
  href,
}: {
  isActive: boolean;
  href: string | null;
}) {
  if (!href) {
    return (
      <button
        type="button"
        aria-disabled={true}
        aria-label="Đơn hàng (chưa có đơn hôm nay)"
        title="Bạn chưa có đơn hàng hôm nay"
        onClick={() => toast("Bạn chưa có đơn hàng hôm nay.")}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground/40"
      >
        <Package size={22} aria-hidden="true" />
        <span>Đơn hàng</span>
      </button>
    );
  }
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Package size={22} aria-hidden="true" />
      <span>Đơn hàng</span>
    </Link>
  );
}

export function PublicBottomNav() {
  const pathname = usePathname();
  const cart = useCart();
  const lastOrderCode = useLastOrder();
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const orderHref = lastOrderCode ? `/order/${lastOrderCode}` : null;

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background"
    >
      <div className="flex min-h-14 items-stretch">
        <MenuTab isActive={pathname === "/menu" || pathname === "/"} />
        <CartTab isActive={pathname === "/cart"} count={cartCount} />
        <OrderTab
          href={orderHref}
          isActive={orderHref !== null && pathname.startsWith("/order/")}
        />
      </div>
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}
