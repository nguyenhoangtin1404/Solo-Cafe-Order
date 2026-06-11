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

// Calibrate after launch based on observed avg prep time per order
export const WAIT_MINUTES_PER_ORDER = 3;
export const MIN_PREP_MINS = 3;
export const WAIT_VARIANCE_MINS = 2;
export const MAX_WAIT_MINS = 60;
// MAKING orders are already being prepared — weight at 0.5 so they don't
// inflate the estimate as much as a fully-queued NEW order.
export const MAKING_ORDER_WEIGHT = 0.5;

// Orders submitted at or after this hour (HCM, 24h) are rejected.
// Prevents the midnight dead zone where an order placed at 23:58 becomes
// unfindable by order_code after midnight (daily code scoping resets at 00:00 HCM).
export const CAFE_CLOSES_HOUR_HCM = 22;
export const MAX_ORDER_NOTE_LENGTH = 500;
export const MAX_ITEM_NOTE_LENGTH = 200;
export const MAX_PICKUP_NAME_LENGTH = 50;
export const MAX_IMAGE_SIZE_MB = 2;

export const ORDER_SUCCESS_SESSION_KEY = "vibe_cafe_order_success";

export const ORDER_CODE_RE = /^[A-Z]\d{3}$/;
