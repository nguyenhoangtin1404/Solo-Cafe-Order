import { z } from "zod";
import { MAX_NOTE_LENGTH, MAX_PICKUP_NAME_LENGTH } from "./constants";

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
  note: z.string().max(MAX_NOTE_LENGTH).optional(),
});

export const submitOrderSchema = z.object({
  pickupName: z
    .string()
    .max(MAX_PICKUP_NAME_LENGTH)
    .transform((s) => s.trim())
    .optional(),
  note: z
    .string()
    .max(MAX_NOTE_LENGTH)
    .transform((s) => s.trim())
    .optional(),
  items: z.array(orderItemSchema).min(1).max(50),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
