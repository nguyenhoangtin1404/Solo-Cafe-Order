"use client";

import { useCallback, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { MenuOption, MenuProduct } from "@/types/menu";
import type { CartItem, CartSelectedOption } from "@/types/order";
import { MAX_ITEM_NOTE_LENGTH } from "@/lib/constants";

interface Props {
  product: MenuProduct;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

function initSelection(options: MenuOption[]): Record<string, string[]> {
  return Object.fromEntries(
    options.map((opt) => [
      opt.id,
      opt.type === "select" && opt.values[0] ? [opt.values[0].id] : [],
    ])
  );
}

function calcUnitPrice(
  product: MenuProduct,
  sel: Record<string, string[]>
): number {
  return product.options.reduce((acc, opt) => {
    const extra = (sel[opt.id] ?? []).reduce((s, vid) => {
      return s + (opt.values.find((v) => v.id === vid)?.extra_price ?? 0);
    }, 0);
    return acc + extra;
  }, product.price);
}

function buildCartOptions(
  options: MenuOption[],
  sel: Record<string, string[]>
): CartSelectedOption[] {
  return options.flatMap((opt) =>
    (sel[opt.id] ?? []).flatMap((vid) => {
      const v = opt.values.find((x) => x.id === vid);
      if (!v) return [];
      return [
        {
          optionId: opt.id,
          valueId: v.id,
          optionName: opt.name,
          valueName: v.name,
          extraPrice: v.extra_price,
        },
      ];
    })
  );
}

export function ProductModal({ product, onClose, onAdd }: Props) {
  const [sel, setSel] = useState(() => initSelection(product.options));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const unitPrice = calcUnitPrice(product, sel);

  const toggle = useCallback(
    (optId: string, valId: string, type: MenuOption["type"]) => {
      setSel((prev) => {
        if (type === "select") return { ...prev, [optId]: [valId] };
        const cur = prev[optId] ?? [];
        return {
          ...prev,
          [optId]: cur.includes(valId)
            ? cur.filter((v) => v !== valId)
            : [...cur, valId],
        };
      });
    },
    []
  );

  const handleAdd = () => {
    onAdd({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice,
      selectedOptions: buildCartOptions(product.options, sel),
      note: note.trim() || null,
      imageUrl: product.image_url ?? null,
    });
    toast.success(`Đã thêm ${product.name} vào giỏ`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-background sm:rounded-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{product.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {product.description && (
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          )}
          {product.options.map((opt) => (
            <OptionGroup
              key={opt.id}
              option={opt}
              selected={sel[opt.id] ?? []}
              onToggle={(vid) => toggle(opt.id, vid, opt.type)}
            />
          ))}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Ghi chú món
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ít đường, nhiều đá..."
              maxLength={MAX_ITEM_NOTE_LENGTH}
              rows={2}
              className="w-full resize-none rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {note.length > MAX_ITEM_NOTE_LENGTH - 50 && (
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {note.length}/{MAX_ITEM_NOTE_LENGTH}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Giảm số lượng"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              aria-label="Tăng số lượng"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex flex-1 items-center justify-between rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground"
          >
            <span>Thêm vào giỏ</span>
            <span>{(unitPrice * qty).toLocaleString("vi-VN")}đ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionGroup({
  option,
  selected,
  onToggle,
}: {
  option: MenuOption;
  selected: string[];
  onToggle: (vid: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{option.name}</p>
      <div className="space-y-2">
        {option.values.map((val) => {
          const on = selected.includes(val.id);
          return (
            <button
              type="button"
              key={val.id}
              onClick={() => onToggle(val.id)}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                on ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 ${
                    option.type === "select" ? "rounded-full" : "rounded-sm"
                  } ${on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}
                >
                  {on &&
                    (option.type === "select" ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    ) : (
                      <span className="text-[9px] font-bold leading-none">
                        ✓
                      </span>
                    ))}
                </span>
                <span>{val.name}</span>
              </div>
              {val.extra_price > 0 && (
                <span className="text-muted-foreground">
                  +{val.extra_price.toLocaleString("vi-VN")}đ
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
