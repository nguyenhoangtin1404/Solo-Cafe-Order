"use client";

import { useEffect, useState } from "react";
import type { CategoryRevenueItem } from "@/lib/services/report.service";
import type { DateRange } from "@/components/reports/DateFilter";

interface FetchedState {
  data: CategoryRevenueItem[] | null;
  fromMs: number;
  toMs: number;
  error: boolean;
}

export function useRevenueByCategory(dateRange: DateRange): {
  isLoading: boolean;
  data: CategoryRevenueItem[] | null;
  error: boolean;
} {
  const [fetched, setFetched] = useState<FetchedState | null>(null);

  const fromMs = dateRange.from.getTime();
  const toMs = dateRange.to.getTime();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const params = new URLSearchParams({
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
    });

    fetch(`/api/reports/categories?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<{ categories: CategoryRevenueItem[] }>;
      })
      .then(({ categories }) => {
        if (!cancelled)
          setFetched({ data: categories, fromMs, toMs, error: false });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cancelled) setFetched({ data: null, fromMs, toMs, error: true });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fromMs, toMs]);

  const isLoading =
    !fetched || fetched.fromMs !== fromMs || fetched.toMs !== toMs;

  return {
    isLoading,
    data: isLoading ? null : fetched!.data,
    error: isLoading ? false : fetched!.error,
  };
}
