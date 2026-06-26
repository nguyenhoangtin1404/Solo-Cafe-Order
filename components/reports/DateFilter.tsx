"use client";

import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";

const TZ = "Asia/Ho_Chi_Minh";

export interface DateRange {
  from: Date;
  to: Date;
}

type PresetId =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

interface Preset {
  id: PresetId;
  label: string;
}

const PRESETS: Preset[] = [
  { id: "today", label: "Hôm nay" },
  { id: "yesterday", label: "Hôm qua" },
  { id: "last7", label: "7 ngày qua" },
  { id: "last30", label: "30 ngày qua" },
  { id: "thisMonth", label: "Tháng này" },
  { id: "lastMonth", label: "Tháng trước" },
  { id: "custom", label: "Tuỳ chọn" },
];

function startOfDayHCM(date: Date): Date {
  // Get the date string in HCM timezone then parse as midnight HCM
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  // Create midnight in HCM by using the offset
  return new Date(`${y}-${m}-${d}T00:00:00+07:00`);
}

function endOfDayHCM(date: Date): Date {
  const start = startOfDayHCM(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function computePreset(id: PresetId, now: Date): DateRange | null {
  if (id === "custom") return null;

  const todayStart = startOfDayHCM(now);
  const todayEnd = endOfDayHCM(now);

  switch (id) {
    case "today":
      return { from: todayStart, to: todayEnd };
    case "yesterday": {
      const yest = addDays(todayStart, -1);
      return { from: yest, to: endOfDayHCM(yest) };
    }
    case "last7":
      return { from: addDays(todayStart, -6), to: todayEnd };
    case "last30":
      return { from: addDays(todayStart, -29), to: todayEnd };
    case "thisMonth": {
      const hcmParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);
      const y = hcmParts.find((p) => p.type === "year")!.value;
      const mo = hcmParts.find((p) => p.type === "month")!.value;
      const monthStart = new Date(`${y}-${mo}-01T00:00:00+07:00`);
      return { from: monthStart, to: todayEnd };
    }
    case "lastMonth": {
      const hcmParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
      }).formatToParts(now);
      const y = parseInt(hcmParts.find((p) => p.type === "year")!.value);
      const mo = parseInt(hcmParts.find((p) => p.type === "month")!.value);
      const prevMonth = mo === 1 ? 12 : mo - 1;
      const prevYear = mo === 1 ? y - 1 : y;
      const lmStart = new Date(
        `${prevYear}-${String(prevMonth).padStart(2, "0")}-01T00:00:00+07:00`
      );
      // Last day of prev month = day before this month start
      const thisMonthStart = new Date(
        `${y}-${String(mo).padStart(2, "0")}-01T00:00:00+07:00`
      );
      const lmEnd = new Date(thisMonthStart.getTime() - 1);
      return { from: lmStart, to: lmEnd };
    }
  }
}

function toInputDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatRange(range: DateRange): string {
  const fmt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${fmt.format(range.from)} – ${fmt.format(range.to)}`;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateFilter({ value, onChange }: Props) {
  const [activePreset, setActivePreset] = useState<PresetId>("today");
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const selectPreset = useCallback(
    (id: PresetId) => {
      setActivePreset(id);
      if (id !== "custom") {
        const range = computePreset(id, new Date());
        if (range) onChange(range);
        setOpen(false);
      }
    },
    [onChange]
  );

  const applyCustom = useCallback(() => {
    if (!customFrom || !customTo) return;
    const from = new Date(`${customFrom}T00:00:00+07:00`);
    const to = new Date(`${customTo}T23:59:59+07:00`);
    if (from > to) return;
    onChange({ from, to });
    setOpen(false);
  }, [customFrom, customTo, onChange]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted"
      >
        <span className="hidden sm:inline">
          {PRESETS.find((p) => p.id === activePreset)?.label}:&nbsp;
        </span>
        <span className="text-muted-foreground">{formatRange(value)}</span>
        <ChevronDown
          size={16}
          className={
            open ? "rotate-180 transition-transform" : "transition-transform"
          }
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-xl border bg-background shadow-lg">
            <div className="p-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  className={`flex min-h-[40px] w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activePreset === preset.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {activePreset === "custom" && (
              <div className="border-t p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-12 shrink-0 text-xs text-muted-foreground">
                    Từ
                  </label>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || toInputDate(new Date())}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="min-h-[36px] flex-1 rounded-md border px-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-12 shrink-0 text-xs text-muted-foreground">
                    Đến
                  </label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={toInputDate(new Date())}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="min-h-[36px] flex-1 rounded-md border px-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo}
                  className="min-h-[36px] w-full rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Áp dụng
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
