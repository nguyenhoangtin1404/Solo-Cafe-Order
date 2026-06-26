"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import {
  addDaysHCM,
  endOfDayHCM,
  endOfPrevMonthHCM,
  startOfDayHCM,
  startOfMonthHCM,
  startOfPrevMonthHCM,
  toInputDateHCM,
} from "@/lib/utils/timezone";

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

function computePreset(id: PresetId, now: Date): DateRange | null {
  if (id === "custom") return null;
  const todayStart = startOfDayHCM(now);
  switch (id) {
    case "today":
      return { from: todayStart, to: now }; // spec: 00:00:00 HCM đến hiện tại
    case "yesterday": {
      const yest = addDaysHCM(todayStart, -1);
      return { from: yest, to: endOfDayHCM(yest) };
    }
    case "last7":
      return { from: addDaysHCM(todayStart, -6), to: endOfDayHCM(now) };
    case "last30":
      return { from: addDaysHCM(todayStart, -29), to: endOfDayHCM(now) };
    case "thisMonth":
      return { from: startOfMonthHCM(now), to: now }; // spec: đến hiện tại
    case "lastMonth":
      return { from: startOfPrevMonthHCM(now), to: endOfPrevMonthHCM(now) };
    default: {
      // Exhaustiveness check — TypeScript errors here if a new PresetId is added without a case
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function formatRange(range: DateRange): string {
  const fmt = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
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

function useDateFilter(onChange: (range: DateRange) => void) {
  const [activePreset, setActivePreset] = useState<PresetId>("today");
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customError, setCustomError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstPresetRef = useRef<HTMLButtonElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const prevPresetRef = useRef<PresetId>("today");
  const committedPresetRef = useRef<PresetId>("today");

  useEffect(() => {
    if (open) firstPresetRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (activePreset === "custom" && prevPresetRef.current !== "custom")
      fromInputRef.current?.focus();
    prevPresetRef.current = activePreset;
  }, [activePreset]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActivePreset(committedPresetRef.current);
    triggerRef.current?.focus();
  }, []);

  const selectPreset = useCallback(
    (id: PresetId) => {
      setActivePreset(id);
      if (id !== "custom") {
        setCustomFrom("");
        setCustomTo("");
        setCustomError("");
        committedPresetRef.current = id;
        const range = computePreset(id, new Date());
        if (range) onChange(range);
        closeDropdown();
      }
    },
    [onChange, closeDropdown]
  );

  const applyCustom = useCallback(() => {
    if (!customFrom || !customTo) return;
    const from = new Date(`${customFrom}T00:00:00+07:00`);
    const to = new Date(`${customTo}T23:59:59.999+07:00`);
    if (from > to) {
      setCustomError("Ngày bắt đầu phải trước ngày kết thúc.");
      return;
    }
    setCustomError("");
    committedPresetRef.current = "custom";
    onChange({ from, to });
    closeDropdown();
  }, [customFrom, customTo, onChange, closeDropdown]);

  const onCustomFromChange = useCallback((v: string) => {
    setCustomFrom(v);
    setCustomError("");
  }, []);
  const onCustomToChange = useCallback((v: string) => {
    setCustomTo(v);
    setCustomError("");
  }, []);

  return {
    activePreset,
    open,
    setOpen,
    customFrom,
    customTo,
    customError,
    triggerRef,
    firstPresetRef,
    fromInputRef,
    closeDropdown,
    selectPreset,
    applyCustom,
    onCustomFromChange,
    onCustomToChange,
  };
}

function DateDropdown({
  activePreset,
  firstPresetRef,
  fromInputRef,
  customFrom,
  customTo,
  customError,
  onCustomFromChange,
  onCustomToChange,
  selectPreset,
  applyCustom,
  onClose,
}: {
  activePreset: PresetId;
  firstPresetRef: RefObject<HTMLButtonElement | null>;
  fromInputRef: RefObject<HTMLInputElement | null>;
  customFrom: string;
  customTo: string;
  customError: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
  selectPreset: (id: PresetId) => void;
  applyCustom: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
        aria-hidden="true"
        role="presentation"
      />
      <div
        id="date-preset-dropdown"
        className="absolute inset-x-0 top-full z-20 mt-1 rounded-xl border bg-background shadow-lg sm:left-0 sm:right-auto sm:w-72"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="p-2">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.id}
              ref={i === 0 ? firstPresetRef : undefined}
              type="button"
              onClick={() => selectPreset(preset.id)}
              className={`flex min-h-[44px] w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
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
          <div className="space-y-2 border-t p-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="date-filter-from"
                className="w-12 shrink-0 text-xs text-muted-foreground"
              >
                Từ
              </label>
              <input
                ref={fromInputRef}
                id="date-filter-from"
                type="date"
                value={customFrom}
                max={customTo || toInputDateHCM(new Date())}
                onChange={(e) => onCustomFromChange(e.target.value)}
                className="min-h-[44px] flex-1 rounded-md border px-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="date-filter-to"
                className="w-12 shrink-0 text-xs text-muted-foreground"
              >
                Đến
              </label>
              <input
                id="date-filter-to"
                type="date"
                value={customTo}
                min={customFrom}
                max={toInputDateHCM(new Date())}
                onChange={(e) => onCustomToChange(e.target.value)}
                className="min-h-[44px] flex-1 rounded-md border px-2 text-sm"
              />
            </div>
            {customError && (
              <p role="alert" className="text-xs text-destructive">
                {customError}
              </p>
            )}
            <button
              type="button"
              onClick={applyCustom}
              disabled={!customFrom || !customTo}
              className="min-h-[44px] w-full rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Áp dụng
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function DateFilter({ value, onChange }: Props) {
  const df = useDateFilter(onChange);
  return (
    <div className="relative">
      <button
        ref={df.triggerRef}
        type="button"
        aria-expanded={df.open}
        aria-controls="date-preset-dropdown"
        aria-label="Chọn khoảng thời gian"
        onClick={() => df.setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") df.closeDropdown();
        }}
        className="flex min-h-[44px] items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted"
      >
        <span className="hidden sm:inline">
          {PRESETS.find((p) => p.id === df.activePreset)?.label}:&nbsp;
        </span>
        <span className="text-muted-foreground">{formatRange(value)}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={
            df.open ? "rotate-180 transition-transform" : "transition-transform"
          }
        />
      </button>
      {df.open && (
        <DateDropdown
          activePreset={df.activePreset}
          firstPresetRef={df.firstPresetRef}
          fromInputRef={df.fromInputRef}
          customFrom={df.customFrom}
          customTo={df.customTo}
          customError={df.customError}
          onCustomFromChange={df.onCustomFromChange}
          onCustomToChange={df.onCustomToChange}
          selectPreset={df.selectPreset}
          applyCustom={df.applyCustom}
          onClose={df.closeDropdown}
        />
      )}
    </div>
  );
}
