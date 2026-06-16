import { z } from "zod";
import {
  MAX_ITEM_NOTE_LENGTH,
  MAX_ORDER_NOTE_LENGTH,
  MAX_PICKUP_NAME_LENGTH,
  ORDER_STATUS,
  PAYMENT_METHOD,
} from "./constants";

// Optional string field: absent/null/empty-after-trim đều coerce về null cho DB
// Non-empty string sau trim phải có ít nhất 1 ký tự và không vượt max
const trimmedOptionalString = (max: number) =>
  z
    .string()
    .nullable()
    .optional()
    .transform((v) =>
      v == null || v === undefined ? undefined : v.trim() || undefined
    )
    .pipe(z.string().min(1).max(max).optional())
    .transform((v) => v ?? null);

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  selected_option_value_ids: z
    .preprocess((val) => (val == null ? [] : val), z.array(z.string().uuid()))
    .default([]),
  note: trimmedOptionalString(MAX_ITEM_NOTE_LENGTH),
});

export const submitOrderSchema = z.object({
  // Server phải KHÔNG dùng giá từ client — luôn resolve price từ DB khi insert order
  // null = khách không nhập (anonymous order / no note)
  pickup_name: trimmedOptionalString(MAX_PICKUP_NAME_LENGTH),
  note: trimmedOptionalString(MAX_ORDER_NOTE_LENGTH),
  payment_method: z
    .enum([PAYMENT_METHOD.CASH, PAYMENT_METHOD.BANK_TRANSFER])
    .default(PAYMENT_METHOD.CASH),
  items: z.array(orderItemSchema).min(1).max(50),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;

// Only statuses an owner can set via the dashboard — 'new' is excluded because
// it's the initial state (set by DB default) and cannot be manually restored.
const OWNER_UPDATABLE_STATUSES = [
  ORDER_STATUS.MAKING,
  ORDER_STATUS.DONE,
  ORDER_STATUS.CANCELLED,
] as const;

export const updateStatusSchema = z
  .object({ status: z.enum(OWNER_UPDATABLE_STATUSES) })
  .strict();
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const cancelBodySchema = z
  .object({ order_id: z.string().uuid() })
  .strict();
export type CancelBodyInput = z.infer<typeof cancelBodySchema>;

export const createCategorySchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, "Tên danh mục không được để trống.")
        .max(50, "Tên danh mục tối đa 50 ký tự.")
    ),
  sort_order: z.number().int().min(0).max(9999).default(0),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .transform((s) => s.trim())
      .pipe(
        z
          .string()
          .min(1, "Tên danh mục không được để trống.")
          .max(50, "Tên danh mục tối đa 50 ký tự.")
      )
      .optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .refine((d) => d.name !== undefined || d.sort_order !== undefined, {
    message: "Cần ít nhất một trường để cập nhật.",
  });
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
