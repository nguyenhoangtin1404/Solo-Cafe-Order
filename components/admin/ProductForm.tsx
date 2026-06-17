"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types/product";
import type { AdminProduct } from "@/lib/services/product.service";

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: AdminProduct;
  categories: Category[];
  defaultCategoryId?: string;
  onSuccess: (product: AdminProduct) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  price?: string;
  category_id?: string;
}

function parsePrice(raw: string): number | null {
  const n = Number(raw.replace(/[^\d]/g, ""));
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function ProductForm({
  mode,
  initialData,
  categories,
  defaultCategoryId,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const defaultCategory =
    initialData?.category_id ??
    defaultCategoryId ??
    categories[0]?.id ??
    "";

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [price, setPrice] = useState(
    initialData ? String(initialData.price) : ""
  );
  const [categoryId, setCategoryId] = useState(defaultCategory);
  const [isAvailable, setIsAvailable] = useState(
    initialData?.is_available ?? true
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Tên sản phẩm không được để trống.";
    else if (name.trim().length > 100)
      errs.name = "Tên sản phẩm tối đa 100 ký tự.";
    if (!categoryId) errs.category_id = "Vui lòng chọn danh mục.";
    if (parsePrice(price) === null)
      errs.price = "Giá phải là số nguyên lớn hơn 0.";
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const parsedPrice = parsePrice(price)!;
      const body =
        mode === "create"
          ? {
              category_id: categoryId,
              name: name.trim(),
              description: description.trim() || null,
              price: parsedPrice,
              is_available: isAvailable,
            }
          : {
              category_id: categoryId,
              name: name.trim(),
              description: description.trim() || null,
              price: parsedPrice,
              is_available: isAvailable,
            };

      const url =
        mode === "create"
          ? "/api/products"
          : `/api/products/${initialData!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as {
        product?: AdminProduct;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Lưu thất bại.");
      if (!data.product) throw new Error("Phản hồi không hợp lệ.");
      onSuccess(data.product);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu thất bại.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const inputCls =
    "min-h-[44px] w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";
  const errorCls = "mt-1 text-xs text-destructive";

  return (
    <div
      role="group"
      aria-label={mode === "create" ? "Thêm sản phẩm mới" : "Sửa sản phẩm"}
      className="rounded-xl border bg-card px-4 py-4 shadow-sm"
    >
      <h3 className="mb-3 text-sm font-semibold">
        {mode === "create" ? "Thêm sản phẩm mới" : "Sửa sản phẩm"}
      </h3>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            onBlur={() => {
              if (!name.trim())
                setErrors((p) => ({
                  ...p,
                  name: "Tên sản phẩm không được để trống.",
                }));
            }}
            maxLength={100}
            disabled={submitting}
            aria-label="Tên sản phẩm"
            aria-invalid={!!errors.name}
            placeholder="Tên sản phẩm *"
            className={inputCls}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onCancel();
            }}
          />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          disabled={submitting}
          aria-label="Mô tả (không bắt buộc)"
          placeholder="Mô tả (không bắt buộc)"
          rows={2}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />

        <div className="flex gap-3">
          {/* Price */}
          <div className="flex-1">
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price)
                  setErrors((p) => ({ ...p, price: undefined }));
              }}
              onBlur={() => {
                if (parsePrice(price) === null)
                  setErrors((p) => ({
                    ...p,
                    price: "Giá phải là số nguyên lớn hơn 0.",
                  }));
              }}
              disabled={submitting}
              aria-label="Giá (VND)"
              aria-invalid={!!errors.price}
              placeholder="Giá (VND) *"
              className={inputCls}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onCancel();
              }}
            />
            {errors.price && <p className={errorCls}>{errors.price}</p>}
          </div>

          {/* Category */}
          <div className="flex-1">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (errors.category_id)
                  setErrors((p) => ({ ...p, category_id: undefined }));
              }}
              disabled={submitting}
              aria-label="Danh mục"
              aria-invalid={!!errors.category_id}
              className={`${inputCls} bg-background`}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className={errorCls}>{errors.category_id}</p>
            )}
          </div>
        </div>

        {/* Is available */}
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            disabled={submitting}
            className="h-4 w-4 accent-primary"
          />
          Hiển thị trên menu
        </label>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="min-h-[44px] flex-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={16} aria-hidden="true" className="mx-auto animate-spin" />
            ) : mode === "create" ? (
              "Thêm sản phẩm"
            ) : (
              "Lưu thay đổi"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="min-h-[44px] rounded-lg border px-4 text-sm text-muted-foreground disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
