"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type {
  ProductOption,
  ProductOptionWithValues,
  ProductOptionValue,
} from "@/types/product";

interface Props {
  productId: string;
}

interface OptionDraft {
  name: string;
  type: "select" | "multi";
}

interface ValueDraft {
  name: string;
  extra_price: string;
}

const emptyOption = (): OptionDraft => ({ name: "", type: "select" });
const emptyValue = (): ValueDraft => ({ name: "", extra_price: "0" });

function parseExtraPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 && n <= 500_000 ? n : null;
}

export function OptionsEditor({ productId }: Props) {
  const [options, setOptions] = useState<ProductOptionWithValues[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingOption, setAddingOption] = useState(false);
  const [optionDraft, setOptionDraft] = useState<OptionDraft>(emptyOption);
  const [savingOption, setSavingOption] = useState(false);

  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionDraft, setEditOptionDraft] =
    useState<OptionDraft>(emptyOption);
  const [savingEditOption, setSavingEditOption] = useState(false);

  const [addingValueForOptionId, setAddingValueForOptionId] = useState<
    string | null
  >(null);
  const [valueDraft, setValueDraft] = useState<ValueDraft>(emptyValue);
  const [savingValue, setSavingValue] = useState(false);

  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editValueDraft, setEditValueDraft] = useState<ValueDraft>(emptyValue);
  const [savingEditValue, setSavingEditValue] = useState(false);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const addOptionInputRef = useRef<HTMLInputElement>(null);
  const addValueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${productId}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{
          product?: { options?: ProductOptionWithValues[] };
        }>;
      })
      .then((data) => setOptions(data.product?.options ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") toast.error("Không tải được options.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    if (addingOption) addOptionInputRef.current?.focus();
  }, [addingOption]);

  useEffect(() => {
    if (addingValueForOptionId) addValueInputRef.current?.focus();
  }, [addingValueForOptionId]);

  // ── Option CRUD ─────────────────────────────────────────────────────────────

  async function submitAddOption() {
    if (!optionDraft.name.trim()) return;
    setSavingOption(true);
    try {
      const res = await fetch(`/api/products/${productId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: optionDraft.name.trim(),
          type: optionDraft.type,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        option?: ProductOption;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Thêm option thất bại.");
      if (!data.option) throw new Error("Phản hồi không hợp lệ.");
      setOptions((prev) => [...prev, { ...data.option!, values: [] }]);
      setAddingOption(false);
      setOptionDraft(emptyOption());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm option thất bại.");
    } finally {
      setSavingOption(false);
    }
  }

  async function submitEditOption(optionId: string) {
    if (!editOptionDraft.name.trim()) return;
    setSavingEditOption(true);
    try {
      const res = await fetch(
        `/api/products/${productId}/options/${optionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editOptionDraft.name.trim(),
            type: editOptionDraft.type,
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        option?: { name: string; type: "select" | "multi" };
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Cập nhật thất bại.");
      if (!data.option) throw new Error("Phản hồi không hợp lệ.");
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId
            ? { ...o, name: data.option!.name, type: data.option!.type }
            : o
        )
      );
      setEditingOptionId((cur) => (cur === optionId ? null : cur));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSavingEditOption(false);
    }
  }

  async function handleDeleteOption(optionId: string) {
    if (!window.confirm("Xóa option này và tất cả values bên trong?")) return;
    setDeletingIds((s) => new Set(s).add(optionId));
    try {
      const res = await fetch(
        `/api/products/${productId}/options/${optionId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message ?? "Xóa thất bại.");
      }
      setOptions((prev) => prev.filter((o) => o.id !== optionId));
      setAddingValueForOptionId((cur) => (cur === optionId ? null : cur));
      setValueDraft((cur) =>
        addingValueForOptionId === optionId ? emptyValue() : cur
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
    } finally {
      setDeletingIds((s) => {
        const n = new Set(s);
        n.delete(optionId);
        return n;
      });
    }
  }

  // ── Value CRUD ──────────────────────────────────────────────────────────────

  async function submitAddValue(optionId: string) {
    if (!valueDraft.name.trim()) return;
    const extra_price = parseExtraPrice(valueDraft.extra_price);
    if (extra_price === null) {
      toast.error("Giá thêm phải là số nguyên từ 0 đến 500,000.");
      return;
    }
    setSavingValue(true);
    try {
      const res = await fetch(
        `/api/products/${productId}/options/${optionId}/values`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: valueDraft.name.trim(), extra_price }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        value?: ProductOptionValue;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Thêm value thất bại.");
      if (!data.value) throw new Error("Phản hồi không hợp lệ.");
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, values: [...o.values, data.value!] } : o
        )
      );
      setAddingValueForOptionId(null);
      setValueDraft(emptyValue());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm value thất bại.");
    } finally {
      setSavingValue(false);
    }
  }

  async function submitEditValue(optionId: string, valueId: string) {
    if (!editValueDraft.name.trim()) return;
    const extra_price = parseExtraPrice(editValueDraft.extra_price);
    if (extra_price === null) {
      toast.error("Giá thêm phải là số nguyên từ 0 đến 500,000.");
      return;
    }
    setSavingEditValue(true);
    try {
      const res = await fetch(
        `/api/products/${productId}/options/${optionId}/values/${valueId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editValueDraft.name.trim(),
            extra_price,
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        value?: ProductOptionValue;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Cập nhật thất bại.");
      if (!data.value) throw new Error("Phản hồi không hợp lệ.");
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId
            ? {
                ...o,
                values: o.values.map((v) =>
                  v.id === valueId ? data.value! : v
                ),
              }
            : o
        )
      );
      setEditingValueId((cur) => (cur === valueId ? null : cur));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSavingEditValue(false);
    }
  }

  async function handleDeleteValue(optionId: string, valueId: string) {
    if (!window.confirm("Xóa value này?")) return;
    setDeletingIds((s) => new Set(s).add(valueId));
    try {
      const res = await fetch(
        `/api/products/${productId}/options/${optionId}/values/${valueId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message ?? "Xóa thất bại.");
      }
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId
            ? { ...o, values: o.values.filter((v) => v.id !== valueId) }
            : o
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại.");
    } finally {
      setDeletingIds((s) => {
        const n = new Set(s);
        n.delete(valueId);
        return n;
      });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputCls =
    "min-h-[44px] w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2
          size={16}
          className="animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Đang tải options…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Options
      </p>

      {options.map((option) => (
        <div key={option.id} className="rounded-lg border px-3 py-3">
          {/* Option header */}
          {editingOptionId === option.id ? (
            <div className="flex gap-2">
              <input
                value={editOptionDraft.name}
                onChange={(e) =>
                  setEditOptionDraft((d) => ({ ...d, name: e.target.value }))
                }
                maxLength={50}
                disabled={savingEditOption}
                aria-label="Tên option"
                className={`${inputCls} flex-1`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !savingEditOption)
                    submitEditOption(option.id);
                  if (e.key === "Escape" && !savingEditOption)
                    setEditingOptionId(null);
                }}
              />
              <select
                value={editOptionDraft.type}
                onChange={(e) => {
                  const newType = e.target.value as "select" | "multi";
                  if (option.values.length > 0 && newType !== option.type) {
                    if (
                      !window.confirm(
                        "Thay đổi type có thể ảnh hưởng các orders hiện tại. Tiếp tục?"
                      )
                    )
                      return;
                  }
                  setEditOptionDraft((d) => ({ ...d, type: newType }));
                }}
                disabled={savingEditOption}
                aria-label="Kiểu chọn"
                className={`${inputCls} w-28 bg-background`}
              >
                <option value="select">Chọn 1</option>
                <option value="multi">Nhiều</option>
              </select>
              <button
                type="button"
                onClick={() => submitEditOption(option.id)}
                disabled={savingEditOption || !editOptionDraft.name.trim()}
                aria-label="Lưu option"
                className="min-h-[44px] rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
              >
                {savingEditOption ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  "Lưu"
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditingOptionId(null)}
                disabled={savingEditOption}
                aria-label="Hủy sửa option"
                className="min-h-[44px] rounded-lg border px-3 text-sm text-muted-foreground disabled:opacity-50"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{option.name}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {option.type === "select" ? "Chọn 1" : "Nhiều"}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOptionId(option.id);
                    setEditOptionDraft({
                      name: option.name,
                      type: option.type,
                    });
                  }}
                  disabled={deletingIds.has(option.id)}
                  aria-label={`Sửa option ${option.name}`}
                  className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <Pencil size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOption(option.id)}
                  disabled={deletingIds.has(option.id)}
                  aria-label={`Xóa option ${option.name}`}
                  className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border border-destructive text-destructive disabled:opacity-50"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Values list */}
          {option.values.length > 0 && (
            <ul
              className="mt-2 space-y-1"
              aria-label={`Values của ${option.name}`}
            >
              {option.values.map((value) =>
                editingValueId === value.id ? (
                  <li key={value.id} className="flex gap-2">
                    <input
                      value={editValueDraft.name}
                      onChange={(e) =>
                        setEditValueDraft((d) => ({
                          ...d,
                          name: e.target.value,
                        }))
                      }
                      maxLength={50}
                      disabled={savingEditValue}
                      aria-label="Tên value"
                      className={`${inputCls} flex-1`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !savingEditValue)
                          submitEditValue(option.id, value.id);
                        if (e.key === "Escape" && !savingEditValue)
                          setEditingValueId(null);
                      }}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editValueDraft.extra_price}
                      onChange={(e) =>
                        setEditValueDraft((d) => ({
                          ...d,
                          extra_price: e.target.value,
                        }))
                      }
                      disabled={savingEditValue}
                      aria-label="Giá thêm (VND)"
                      placeholder="+giá"
                      className={`${inputCls} w-24`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !savingEditValue)
                          submitEditValue(option.id, value.id);
                        if (e.key === "Escape" && !savingEditValue)
                          setEditingValueId(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => submitEditValue(option.id, value.id)}
                      disabled={savingEditValue || !editValueDraft.name.trim()}
                      aria-label="Lưu value"
                      className="min-h-[44px] rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
                    >
                      {savingEditValue ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        "Lưu"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingValueId(null)}
                      disabled={savingEditValue}
                      aria-label="Hủy sửa value"
                      className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border disabled:opacity-50"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ) : (
                  <li
                    key={value.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="text-sm">
                      {value.name}
                      {value.extra_price > 0 && (
                        <span className="ml-1 text-muted-foreground">
                          +{value.extra_price.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingValueId(value.id);
                          setEditValueDraft({
                            name: value.name,
                            extra_price: String(value.extra_price),
                          });
                        }}
                        disabled={deletingIds.has(value.id)}
                        aria-label={`Sửa value ${value.name}`}
                        className="flex min-h-[44px] w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        <Pencil size={13} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteValue(option.id, value.id)}
                        disabled={deletingIds.has(value.id)}
                        aria-label={`Xóa value ${value.name}`}
                        className="flex min-h-[44px] w-9 items-center justify-center text-destructive disabled:opacity-50"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}

          {/* Add value */}
          {addingValueForOptionId === option.id ? (
            <div className="mt-2 flex gap-2">
              <input
                ref={addValueInputRef}
                value={valueDraft.name}
                onChange={(e) =>
                  setValueDraft((d) => ({ ...d, name: e.target.value }))
                }
                maxLength={50}
                disabled={savingValue}
                aria-label="Tên value mới"
                placeholder="Tên value *"
                className={`${inputCls} flex-1`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !savingValue)
                    submitAddValue(option.id);
                  if (e.key === "Escape" && !savingValue) {
                    setAddingValueForOptionId(null);
                    setValueDraft(emptyValue());
                  }
                }}
              />
              <input
                type="text"
                inputMode="numeric"
                value={valueDraft.extra_price}
                onChange={(e) =>
                  setValueDraft((d) => ({ ...d, extra_price: e.target.value }))
                }
                disabled={savingValue}
                aria-label="Giá thêm (VND)"
                placeholder="+giá"
                className={`${inputCls} w-24`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !savingValue)
                    submitAddValue(option.id);
                  if (e.key === "Escape" && !savingValue) {
                    setAddingValueForOptionId(null);
                    setValueDraft(emptyValue());
                  }
                }}
              />
              <button
                type="button"
                onClick={() => submitAddValue(option.id)}
                disabled={savingValue || !valueDraft.name.trim()}
                aria-label="Thêm value"
                className="min-h-[44px] rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
              >
                {savingValue ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  "Thêm"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingValueForOptionId(null);
                  setValueDraft(emptyValue());
                }}
                disabled={savingValue}
                aria-label="Hủy thêm value"
                className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border disabled:opacity-50"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAddingValueForOptionId(option.id);
                setValueDraft(emptyValue());
              }}
              aria-label={`Thêm value vào ${option.name}`}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              <Plus size={12} aria-hidden="true" /> Thêm value
            </button>
          )}
        </div>
      ))}

      {/* Add option group */}
      {addingOption ? (
        <div className="flex gap-2">
          <input
            ref={addOptionInputRef}
            value={optionDraft.name}
            onChange={(e) =>
              setOptionDraft((d) => ({ ...d, name: e.target.value }))
            }
            maxLength={50}
            disabled={savingOption}
            aria-label="Tên nhóm option mới"
            placeholder="Tên option *"
            className={`${inputCls} flex-1`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !savingOption) submitAddOption();
              if (e.key === "Escape" && !savingOption) {
                setAddingOption(false);
                setOptionDraft(emptyOption());
              }
            }}
          />
          <select
            value={optionDraft.type}
            onChange={(e) =>
              setOptionDraft((d) => ({
                ...d,
                type: e.target.value as "select" | "multi",
              }))
            }
            disabled={savingOption}
            aria-label="Kiểu chọn"
            className={`${inputCls} w-28 bg-background`}
          >
            <option value="select">Chọn 1</option>
            <option value="multi">Nhiều</option>
          </select>
          <button
            type="button"
            onClick={submitAddOption}
            disabled={savingOption || !optionDraft.name.trim()}
            aria-label="Thêm nhóm option"
            className="min-h-[44px] rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
          >
            {savingOption ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              "Thêm"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingOption(false);
              setOptionDraft(emptyOption());
            }}
            disabled={savingOption}
            aria-label="Hủy thêm option"
            className="flex min-h-[44px] w-11 items-center justify-center rounded-lg border disabled:opacity-50"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingOption(true)}
          className="flex min-h-[44px] w-full items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          <Plus size={14} aria-hidden="true" /> Thêm nhóm option
        </button>
      )}
    </div>
  );
}
