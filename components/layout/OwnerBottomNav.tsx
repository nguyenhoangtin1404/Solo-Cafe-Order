"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ClipboardList, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Đơn hàng",
    icon: ClipboardList,
    href: "/dashboard",
    match: (p: string) => p === "/dashboard",
  },
  {
    key: "admin",
    label: "Quản lý",
    icon: Settings,
    href: "/admin",
    match: (p: string) => p.startsWith("/admin"),
  },
] as const;

function LogoutButton() {
  const router = useRouter();
  const loggingOutRef = useRef(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
        setLoggingOut(false);
        return;
      }
      router.push("/login");
    } catch {
      toast.error("Đăng xuất thất bại. Vui lòng thử lại.");
      setLoggingOut(false);
    } finally {
      loggingOutRef.current = false;
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground disabled:opacity-50"
    >
      <LogOut size={22} aria-hidden="true" />
      <span>{loggingOut ? "Đang xuất..." : "Đăng xuất"}</span>
    </button>
  );
}

export function OwnerBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng quản lý"
      className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background"
    >
      <div className="flex min-h-14 items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <LogoutButton />
      </div>
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}
