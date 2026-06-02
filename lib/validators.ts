import { z } from "zod";
import { MAX_NOTE_LENGTH, MAX_PICKUP_NAME_LENGTH } from "./constants";

// Optional string field: absent/null/empty-after-trim đều coerce về null cho DB
// Non-empty string sau trim phải có ít nhất 1 ký tự và không vượt max
const trimmedOptionalString = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v.trim() || undefined))
    .pipe(z.string().min(1).max(max).optional())
    .transform((v) => v ?? null);

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  selectedOptions: z
    .array(
      z.object({
        optionId: z.string().uuid(),
        valueId: z.string().uuid(),
      })
    )
    .optional()
    .default([]),
  note: trimmedOptionalString(MAX_NOTE_LENGTH),
});

export const submitOrderSchema = z.object({
  // Server phải KHÔNG dùng giá từ client — luôn resolve price từ DB khi insert order
  // null = khách không nhập (anonymous order / no note)
  pickupName: trimmedOptionalString(MAX_PICKUP_NAME_LENGTH),
  note: trimmedOptionalString(MAX_NOTE_LENGTH),
  items: z.array(orderItemSchema).min(1).max(50),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
