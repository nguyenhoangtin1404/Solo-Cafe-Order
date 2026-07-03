"use client";

import { PICKUP_NAME_STORAGE_KEY } from "@/lib/constants";

export function getSavedPickupName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(PICKUP_NAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function savePickupName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PICKUP_NAME_STORAGE_KEY, name);
  } catch {
    // storage unavailable or access denied
  }
}

export function deleteSavedPickupName(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PICKUP_NAME_STORAGE_KEY);
  } catch {
    // storage unavailable or access denied
  }
}
