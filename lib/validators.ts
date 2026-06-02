import { z } from "zod";
import { MAX_NOTE_LENGTH, MAX_PICKUP_NAME_LENGTH } from "./constants";

const trimmedOptionalString = (max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1).max(max))
    .optional()
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
  // null = khách không nhập tên (anonymous order)
  pickupName: trimmedOptionalString(MAX_PICKUP_NAME_LENGTH),
  note: trimmedOptionalString(MAX_NOTE_LENGTH),
  items: z.array(orderItemSchema).min(1).max(50),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
