"use client";

import { LAST_ORDER_CODE_KEY, ORDER_CODE_RE } from "@/lib/constants";
import { addDaysHCM, toInputDateHCM } from "@/lib/utils/timezone";

type StoredOrder = { code: string; date: string; cancelToken?: string };

export const storageListeners = new Set<() => void>();

let _cached: string | null | undefined = undefined;
let _cachedToken: string | null | undefined = undefined;

function isStoredOrder(v: unknown): v is StoredOrder {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).code === "string" &&
    typeof (v as Record<string, unknown>).date === "string"
  );
}

export function pruneStaleOrders(): void {
  if (typeof window === "undefined") return;
  const today = toInputDateHCM(new Date());
  const yesterday = toInputDateHCM(addDaysHCM(new Date(), -1));
  for (const getStorage of [
    () => window.localStorage,
    () => window.sessionStorage,
  ]) {
    try {
      const storage = getStorage();
      const raw = storage.getItem(LAST_ORDER_CODE_KEY);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (
        !isStoredOrder(parsed) ||
        (parsed.date !== today && parsed.date !== yesterday) ||
        !ORDER_CODE_RE.test(parsed.code)
      ) {
        storage.removeItem(LAST_ORDER_CODE_KEY);
        _cached = undefined;
        _cachedToken = undefined;
      }
    } catch {
      // storage unavailable or access denied
    }
  }
}

export function readStoredOrder(): string | null {
  if (_cached !== undefined) return _cached;
  if (typeof window === "undefined") return null;
  const today = toInputDateHCM(new Date());
  const yesterday = toInputDateHCM(addDaysHCM(new Date(), -1));
  for (const getStorage of [
    () => window.localStorage,
    () => window.sessionStorage,
  ]) {
    try {
      const storage = getStorage();
      const raw = storage.getItem(LAST_ORDER_CODE_KEY);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredOrder(parsed)) continue;
      if (
        (parsed.date === today || parsed.date === yesterday) &&
        ORDER_CODE_RE.test(parsed.code)
      ) {
        _cached = parsed.code;
        _cachedToken = parsed.cancelToken ?? null;
        return _cached;
      }
    } catch {
      // storage unavailable or access denied
    }
  }
  _cached = null;
  return null;
}

/** Returns the cancel_token for the stored order, or null if not found. */
export function readStoredCancelToken(): string | null {
  if (_cachedToken !== undefined) return _cachedToken;
  // Trigger a full read to populate _cachedToken
  readStoredOrder();
  return _cachedToken ?? null;
}

export function invalidateCache(): void {
  _cached = undefined;
  _cachedToken = undefined;
}

export function saveLastOrderCode(code: string, cancelToken?: string): void {
  if (!ORDER_CODE_RE.test(code)) return;
  if (typeof window === "undefined") return;
  const entry: StoredOrder = {
    code,
    date: toInputDateHCM(new Date()),
    ...(cancelToken ? { cancelToken } : {}),
  };
  const json = JSON.stringify(entry);
  let saved = false;
  for (const getStorage of [
    () => window.localStorage,
    () => window.sessionStorage,
  ]) {
    try {
      const storage = getStorage();
      storage.setItem(LAST_ORDER_CODE_KEY, json);
      saved = true;
    } catch {
      // storage unavailable or access denied
    }
  }
  if (saved) {
    _cached = code;
    _cachedToken = cancelToken ?? null;
    storageListeners.forEach((cb) => cb());
  }
}

