"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { CartItem, CartSelectedOption } from "@/types/order";

const CART_KEY = "vibe_cafe_cart";
const CART_STORAGE_EVENT = "vibe_cafe_cart_change";

function itemKey(
  productId: string,
  options: CartSelectedOption[],
  note: string | null
): string {
  const sorted = [...options].sort((a, b) =>
    a.valueId.localeCompare(b.valueId)
  );
  return `${productId}:${sorted.map((o) => o.valueId).join(",")}:${note ?? ""}`;
}

let _cachedStr: string | null = null;
let _cachedItems: CartItem[] = [];

function readCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (stored === _cachedStr) return _cachedItems;
    _cachedStr = stored;
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      _cachedItems = Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } else {
      _cachedItems = [];
    }
    return _cachedItems;
  } catch {
    _cachedStr = null;
    _cachedItems = [];
    return _cachedItems;
  }
}

function writeCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_STORAGE_EVENT));
}

function subscribeCart(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CART_STORAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CART_STORAGE_EVENT, onStoreChange);
  };
}

const SERVER_SNAPSHOT: CartItem[] = [];
function getServerCartSnapshot(): CartItem[] {
  return SERVER_SNAPSHOT;
}

export function useCart() {
  const items = useSyncExternalStore(
    subscribeCart,
    readCart,
    getServerCartSnapshot
  );

  const updateItems = useCallback(
    (updater: (prev: CartItem[]) => CartItem[]) => {
      writeCart(updater(readCart()));
    },
    []
  );

  const addItem = useCallback(
    (item: CartItem) => {
      const key = itemKey(item.productId, item.selectedOptions, item.note);
      updateItems((prev) => {
        const idx = prev.findIndex(
          (i) => itemKey(i.productId, i.selectedOptions, i.note) === key
        );
        if (idx !== -1) {
          return prev.map((i, index) =>
            index === idx
              ? { ...i, quantity: Math.min(99, i.quantity + item.quantity) }
              : i
          );
        }
        return [...prev, item];
      });
    },
    [updateItems]
  );

  const removeItem = useCallback(
    (index: number) => {
      updateItems((prev) => prev.filter((_, i) => i !== index));
    },
    [updateItems]
  );

  const updateQuantity = useCallback(
    (index: number, quantity: number) => {
      if (quantity <= 0) {
        updateItems((prev) => prev.filter((_, i) => i !== index));
        return;
      }
      updateItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, quantity } : item))
      );
    },
    [updateItems]
  );

  const clear = useCallback(() => {
    writeCart([]);
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return { items, addItem, removeItem, updateQuantity, clear, total };
}
