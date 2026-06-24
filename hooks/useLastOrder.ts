"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import {
  storageListeners,
  readStoredOrder,
  pruneStaleOrders,
  invalidateCache,
} from "@/lib/lastOrderStorage";

function subscribe(cb: () => void): () => void {
  storageListeners.add(cb);
  function storageHandler(): void {
    invalidateCache();
    cb();
  }
  window.addEventListener("storage", storageHandler);
  return () => {
    storageListeners.delete(cb);
    window.removeEventListener("storage", storageHandler);
  };
}

export function useLastOrder(): string | null {
  useEffect(() => {
    pruneStaleOrders();
  }, []);

  return useSyncExternalStore<string | null>(
    subscribe,
    readStoredOrder,
    () => null
  );
}
