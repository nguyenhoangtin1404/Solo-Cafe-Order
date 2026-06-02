export const ORDER_STATUS = {
  NEW: "new",
  MAKING: "making",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const WAIT_MINUTES_PER_ORDER = 3;
export const MAX_NOTE_LENGTH = 200;
export const MAX_PICKUP_NAME_LENGTH = 50;
export const MAX_IMAGE_SIZE_MB = 2;
