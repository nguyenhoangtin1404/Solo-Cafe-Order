export const ORDER_STATUS = {
  NEW: "new",
  MAKING: "making",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_METHOD = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const WAIT_MINUTES_PER_ORDER = 3;
export const MAX_ORDER_NOTE_LENGTH = 500;
export const MAX_ITEM_NOTE_LENGTH = 200;
export const MAX_PICKUP_NAME_LENGTH = 50;
export const MAX_IMAGE_SIZE_MB = 2;
