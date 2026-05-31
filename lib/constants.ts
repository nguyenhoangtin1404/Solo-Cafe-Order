// ─── Brand ────────────────────────────────────────────────────────────────────
export const BRAND = {
  name:     "Vibe Coffee",
  tagline:  "Phin. Prompt. Pickup.",
  subtitle: "Cà phê truyền thống, đặt hàng thông minh.",
  colors: {
    espresso: "#1C0A00",
    roast:    "#3D1C02",
    caramel:  "#C87941",
    amber:    "#E8A020",
    cream:    "#FEF3DC",
    coral:    "#E8543A",
    matcha:   "#2D6A4F",
    ai:       "#7C3AED",
  },
} as const;

// ─── Order ────────────────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  NEW:       "new",
  MAKING:    "making",
  DONE:      "done",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new:       "Mới",
  making:    "Đang pha",
  done:      "Xong",
  cancelled: "Đã huỷ",
};

export const WAIT_MINUTES_PER_ORDER = 3;

// ─── Validation ──────────────────────────────────────────────────────────────
export const MAX_PICKUP_NAME_LENGTH = 50;
export const MAX_NOTE_LENGTH = 200;
export const MAX_ITEM_QUANTITY = 10;

// ─── Rate limiting ────────────────────────────────────────────────────────────
export const RATE_LIMIT_REQUESTS = 10;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

// ─── Image upload ─────────────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const PRODUCT_IMAGE_BUCKET = "product-images";
