"use client";

import { usePathname } from "next/navigation";
import { OWNER_PATH_PREFIXES, HIDDEN_PATH_PREFIXES } from "@/lib/constants";
import { PublicBottomNav } from "./PublicBottomNav";
import { OwnerBottomNav } from "./OwnerBottomNav";

export function NavController() {
  const pathname = usePathname();

  if (HIDDEN_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  if (OWNER_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return <OwnerBottomNav />;
  }

  return <PublicBottomNav />;
}
