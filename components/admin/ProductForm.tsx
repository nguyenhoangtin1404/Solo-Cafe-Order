"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/types/product";
import type { AdminProduct } from "@/lib/services/product.service";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/constants";

const ALLOWED_MIME = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);
const MAX_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

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
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/[^\d.,\s]/.test(trimmed)) return null;
  if (/[.,]$/.test(trimmed)) return null;
  if (/[.,]\d{1,2}$/.test(trimmed)) return null;
  const n = Number(trimmed.replace(/[^\d]/g, ""));
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
    initialData?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? "";

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
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const previewUrlRef = useRef<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [formAlert, setFormAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const uploadIdRef = useRef(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImageError("");

    if (!ALLOWED_MIME.has(file.type)) {
      setImageError("Chỉ chấp nhận JPG, PNG, WebP.");
      return;
    }
    if (file.size === 0) {
      setImageError("File trống, vui lòng chọn lại.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setImageError("File không được vượt quá 2MB.");
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objUrl = URL.createObjectURL(file);
    previewUrlRef.current = objUrl;
    setImagePreview(objUrl);
    setImageUrl(null);
    const id = ++uploadIdRef.current;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Upload thất bại.");
      if (!data.url) throw new Error("Phản hồi không hợp lệ.");
      if (id === uploadIdRef.current) setImageUrl(data.url);
    } catch (err) {
      if (id !== uploadIdRef.current) return;
      const msg = err instanceof Error ? err.message : "Upload thất bại.";
      setImageError(msg);
      toast.error(msg);
      URL.revokeObjectURL(objUrl);
      previewUrlRef.current = null;
      setImagePreview(null);
      setImageUrl(null);
    } finally {
      if (id === uploadIdRef.current) setUploading(false);
    }
  }

  function clearImage() {
    uploadIdRef.current++; // invalidate any in-flight upload
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setImagePreview(null);
    setImageUrl(null);
    setImageError("");
    setUploading(false);
  }

  function validate(): { errors: FormErrors; parsedPrice: number | null } {
    const errors: FormErrors = {};
    if (!name.trim()) errors.name = "Tên sản phẩm không được để trống.";
    else if (name.trim().length > 100)
      errors.name = "Tên sản phẩm tối đa 100 ký tự.";
    if (!categoryId) errors.category_id = "Vui lòng chọn danh mục.";
    const parsedPrice = parsePrice(price);
    if (parsedPrice === null) errors.price = "Giá phải là số nguyên lớn hơn 0.";
    return { errors, parsedPrice };
  }

  async function callProductApi(parsedPrice: number): Promise<AdminProduct> {
    const url =
      mode === "create"
        ? "/api/products"
        : `/api/products/${initialData?.id ?? ""}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        is_available: isAvailable,
        image_url: imageUrl,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      product?: AdminProduct;
      message?: string;
    };
    if (!res.ok) throw new Error(data.message ?? "Lưu thất bại.");
    if (!data.product) throw new Error("Phản hồi không hợp lệ.");
    return data.product;
  }

  async function handleSubmit() {
    const { errors: errs, parsedPrice } = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormAlert(
        Object.values(errs)[0] ?? "Vui lòng kiểm tra lại thông tin."
      );
      return;
    }
    setFormAlert("");
    if (parsedPrice === null || submittingRef.current || uploading) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const product = await callProductApi(parsedPrice);
      setFormAlert("");
      onSuccess(product);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lưu thất bại.";
      setFormAlert(msg);
      toast.error(msg);
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
      role="form"
      aria-labelledby={`${uid}-form-title`}
      className="rounded-xl border bg-card px-4 py-4 shadow-sm"
    >
      <h3 id={`${uid}-form-title`} className="mb-3 text-sm font-semibold">
        {mode === "create" ? "Thêm sản phẩm mới" : "Sửa sản phẩm"}
      </h3>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {formAlert}
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <input
            ref={nameInputRef}
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
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            placeholder="Tên sản phẩm *"
            className={inputCls}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onCancel();
            }}
          />
          {errors.name && (
            <p id={`${uid}-name-error`} className={errorCls}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
          }}
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
                if (price !== "" && parsePrice(price) === null)
                  setErrors((p) => ({
                    ...p,
                    price: "Giá phải là số nguyên lớn hơn 0.",
                  }));
              }}
              disabled={submitting}
              aria-label="Giá (VND)"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? `${uid}-price-error` : undefined}
              placeholder="Giá (VND) *"
              className={inputCls}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onCancel();
              }}
            />
            {errors.price && (
              <p id={`${uid}-price-error`} className={errorCls}>
                {errors.price}
              </p>
            )}
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
              aria-describedby={
                errors.category_id ? `${uid}-cat-error` : undefined
              }
              className={`${inputCls} bg-background`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onCancel();
              }}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p id={`${uid}-cat-error`} className={errorCls}>
                {errors.category_id}
              </p>
            )}
          </div>
        </div>

        {/* Image */}
        <div>
          <p className="mb-1 text-xs text-muted-foreground">
            Ảnh sản phẩm (JPG/PNG/WebP, tối đa 2MB)
          </p>
          <div className="flex items-start gap-3">
            {(imagePreview ?? imageUrl) && (
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview ?? imageUrl ?? ""}
                  alt="Preview ảnh sản phẩm"
                  className="h-20 w-20 rounded-lg object-cover"
                />
                {!uploading && (
                  <button
                    type="button"
                    onClick={clearImage}
                    disabled={submitting}
                    aria-label="Xóa ảnh"
                    className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                      <X size={10} aria-hidden="true" />
                    </span>
                  </button>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                    <Loader2
                      size={20}
                      className="animate-spin text-white"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
            )}
            <label
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground hover:border-foreground hover:text-foreground${submitting || uploading ? " pointer-events-none opacity-50" : ""}`}
            >
              <ImageIcon size={16} aria-hidden="true" />
              {uploading ? "Đang upload..." : "Chọn ảnh"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={submitting || uploading}
                onChange={handleFileChange}
              />
            </label>
          </div>
          {imageError && <p className={errorCls}>{imageError}</p>}
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
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            aria-busy={submitting}
            aria-label={
              submitting
                ? "Đang lưu..."
                : uploading
                  ? "Đang upload ảnh..."
                  : mode === "create"
                    ? "Thêm sản phẩm"
                    : "Lưu thay đổi"
            }
            className="min-h-[44px] flex-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? (
              <Loader2
                size={16}
                aria-hidden="true"
                className="mx-auto animate-spin"
              />
            ) : mode === "create" ? (
              "Thêm sản phẩm"
            ) : (
              "Lưu thay đổi"
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting || uploading}
            aria-label={
              mode === "create" ? "Hủy thêm sản phẩm" : "Hủy sửa sản phẩm"
            }
            className="min-h-[44px] rounded-lg border px-4 text-sm text-muted-foreground disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
