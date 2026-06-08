import {
  CAFE_CLOSES_HOUR_HCM,
  MAX_ITEM_NOTE_LENGTH,
  MAX_ORDER_NOTE_LENGTH,
  MAX_PICKUP_NAME_LENGTH,
  MAX_WAIT_MINS,
  MIN_PREP_MINS,
  ORDER_STATUS,
  WAIT_MINUTES_PER_ORDER,
  WAIT_VARIANCE_MINS,
} from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import * as orderRepo from "@/lib/repositories/order.repository";
import type { CreateOrderItemData } from "@/lib/repositories/order.repository";
import * as productRepo from "@/lib/repositories/product.repository";
import { sanitizeText } from "@/lib/utils/sanitize";
import { getHCMHour } from "@/lib/utils/timezone";
import type { SubmitOrderInput } from "@/lib/validators";
import type { Order, SelectedOption } from "@/types/order";
import type { ProductWithOptions } from "@/types/product";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.NEW]: [ORDER_STATUS.MAKING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.MAKING]: [ORDER_STATUS.DONE],
  [ORDER_STATUS.DONE]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

// Per-status message shown to customers when cancel is not allowed.
const CANCEL_BLOCKED_MESSAGE: Partial<Record<OrderStatus, string>> = {
  [ORDER_STATUS.CANCELLED]: "Đơn hàng đã được hủy trước đó.",
  [ORDER_STATUS.DONE]: "Đơn hàng đã hoàn thành, không thể hủy.",
  [ORDER_STATUS.MAKING]:
    "Đơn hàng đang được pha chế. Vui lòng nói trực tiếp với nhân viên để hủy đơn.",
};

export interface WaitEstimate {
  min: number;
  max: number;
  unit: "minutes";
  degraded?: boolean; // true = countPending failed; UI should show fallback message
}

export interface SubmitOrderResult {
  order: Order;
  wait_estimate: WaitEstimate;
}

type OrderItemInput = SubmitOrderInput["items"][number];

async function safeCountPending(): Promise<{
  count: number;
  degraded: boolean;
}> {
  try {
    return { count: await orderRepo.countPending(), degraded: false };
  } catch (err) {
    console.error("[order] wait estimate degraded — countPending failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { count: 0, degraded: true };
  }
}

function computeWaitEstimate(pendingCount: number): WaitEstimate {
  const base = Math.min(
    Math.max(MIN_PREP_MINS, pendingCount * WAIT_MINUTES_PER_ORDER),
    MAX_WAIT_MINS
  );
  const min = Math.round(Math.max(MIN_PREP_MINS, base - WAIT_VARIANCE_MINS));
  const max = Math.round(Math.min(base + WAIT_VARIANCE_MINS, MAX_WAIT_MINS));
  return {
    min,
    max: Math.max(min, max),
    unit: "minutes",
  };
}

// Sanitizes a nullable string and coerces empty-after-sanitize back to null.
// Prevents HTML-only values like "<b>" from bypassing the validator min(1) check
// and landing as an empty string in the DB.
function sanitizeOrNull(
  value: string | null,
  maxLength: number
): string | null {
  if (value === null) return null;
  return sanitizeText(value, maxLength) || null;
}

// Throws if any select-type option has no values, if a client-selected ID is
// not in this product's option set, or if a select option has != 1 selection.
function validateOptionConstraints(
  product: ProductWithOptions,
  uniqueValueIds: string[]
): void {
  const allValueIds = new Set(
    product.options.flatMap((o) => o.values.map((v) => v.id))
  );

  for (const valueId of uniqueValueIds) {
    if (!allValueIds.has(valueId)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Lựa chọn tùy chọn không hợp lệ cho sản phẩm "${product.name}".`
      );
    }
  }

  for (const option of product.options) {
    if (option.type === "select" && option.values.length === 0) {
      throw new AppError(
        "PRODUCT_UNAVAILABLE",
        `"${product.name}" tạm thời không có sẵn.`,
        422
      );
    }
    const optionValueIds = new Set(option.values.map((v) => v.id));
    const selectedCount = uniqueValueIds.filter((id) =>
      optionValueIds.has(id)
    ).length;
    if (option.type === "select" && selectedCount !== 1) {
      throw new AppError(
        "VALIDATION_ERROR",
        `"${option.name}" yêu cầu chọn đúng một lựa chọn.`
      );
    }
    // multi options: no minimum enforced — all selections are optional extras.
    // If schema adds min_selections to product_options, enforce it here.
  }
}

function buildSelectedOptions(
  uniqueValueIds: string[],
  valueMap: Map<
    string,
    { extraPrice: number; optionName: string; valueName: string }
  >
): { selectedOptions: SelectedOption[]; extraPrice: number } {
  let extraPrice = 0;
  const selectedOptions: SelectedOption[] = [];
  for (const valueId of uniqueValueIds) {
    const info = valueMap.get(valueId);
    if (!info) {
      throw new AppError(
        "VALIDATION_ERROR",
        `ID tùy chọn không hợp lệ: ${valueId}`
      );
    }
    extraPrice += info.extraPrice;
    selectedOptions.push({
      option_name: info.optionName,
      value_name: info.valueName,
      extra_price: info.extraPrice,
    });
  }
  return { selectedOptions, extraPrice };
}

function validateAndPriceItem(
  item: OrderItemInput,
  product: ProductWithOptions
): { orderItem: CreateOrderItemData; itemTotal: number } {
  const valueMap = new Map<
    string,
    { extraPrice: number; optionName: string; valueName: string }
  >();
  for (const option of product.options) {
    for (const value of option.values) {
      valueMap.set(value.id, {
        extraPrice: value.extra_price,
        optionName: option.name,
        valueName: value.name,
      });
    }
  }

  const uniqueValueIds = [...new Set(item.selected_option_value_ids)];
  validateOptionConstraints(product, uniqueValueIds);
  const { selectedOptions, extraPrice } = buildSelectedOptions(
    uniqueValueIds,
    valueMap
  );

  const unitPrice = product.price + extraPrice;
  return {
    orderItem: {
      product_id: item.product_id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      selected_options: selectedOptions,
      note: sanitizeOrNull(item.note, MAX_ITEM_NOTE_LENGTH),
    },
    itemTotal: unitPrice * item.quantity,
  };
}

function assertAllItemsAvailable(
  items: OrderItemInput[],
  productMap: Map<string, ProductWithOptions>
): void {
  const notFoundCount = items.filter(
    (item) => !productMap.has(item.product_id)
  ).length;
  if (notFoundCount > 0) {
    throw new AppError(
      "PRODUCT_NOT_FOUND",
      "Một hoặc nhiều sản phẩm trong giỏ không tồn tại.",
      404
    );
  }

  const unavailableNames: string[] = [];
  for (const item of items) {
    const p = productMap.get(item.product_id)!;
    if (!p.is_available) {
      unavailableNames.push(`"${p.name}"`);
    } else if (
      p.options.some((o) => o.type === "select" && o.values.length === 0)
    ) {
      unavailableNames.push(`"${p.name}"`);
    }
  }
  if (unavailableNames.length === 0) return;
  const uniqueList = [...new Set(unavailableNames)];
  throw new AppError(
    "PRODUCT_UNAVAILABLE",
    `${uniqueList.join(", ")} không còn khả dụng. Vui lòng xóa khỏi giỏ hàng.`,
    422
  );
}

function buildOrderItems(
  items: OrderItemInput[],
  productMap: Map<string, ProductWithOptions>
): { orderItems: CreateOrderItemData[]; totalAmount: number } {
  const orderItems: CreateOrderItemData[] = [];
  let totalAmount = 0;
  for (const item of items) {
    const { orderItem, itemTotal } = validateAndPriceItem(
      item,
      productMap.get(item.product_id)!
    );
    orderItems.push(orderItem);
    totalAmount += itemTotal;
  }
  return { orderItems, totalAmount };
}

export async function submitOrder(
  input: SubmitOrderInput
): Promise<SubmitOrderResult> {
  if (getHCMHour() >= CAFE_CLOSES_HOUR_HCM) {
    throw new AppError(
      "CAFE_CLOSED",
      `Quán đã đóng cửa. Vui lòng quay lại trước ${CAFE_CLOSES_HOUR_HCM}:00.`,
      422
    );
  }

  const productIds = [...new Set(input.items.map((i) => i.product_id))];
  const products = await productRepo.findByIdsWithOptions(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  assertAllItemsAvailable(input.items, productMap);
  const { orderItems, totalAmount } = buildOrderItems(input.items, productMap);

  if (totalAmount <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Tổng đơn hàng phải lớn hơn 0.",
      400
    );
  }

  const order = await orderRepo.createOrder({
    pickup_name: sanitizeOrNull(input.pickup_name, MAX_PICKUP_NAME_LENGTH),
    note: sanitizeOrNull(input.note, MAX_ORDER_NOTE_LENGTH),
    payment_method: input.payment_method,
    total_amount: totalAmount,
    items: orderItems,
  });

  // Subtract 1: this new order is already counted as pending — exclude from estimate
  const { count, degraded } = await safeCountPending();
  const pendingCount = Math.max(0, count - 1);

  const wait_estimate: WaitEstimate = {
    ...computeWaitEstimate(pendingCount),
    ...(degraded ? { degraded: true } : {}),
  };
  return { order, wait_estimate };
}

export async function cancelOrder(
  orderCode: string,
  actor: "customer" | "owner"
): Promise<Order> {
  const order = await orderRepo.findByCode(orderCode);
  if (!order) {
    throw new AppError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
  }

  if (!VALID_TRANSITIONS[order.status].includes(ORDER_STATUS.CANCELLED)) {
    const message =
      CANCEL_BLOCKED_MESSAGE[order.status] ??
      "Không thể hủy đơn hàng ở trạng thái hiện tại.";
    throw new AppError("INVALID_STATUS_TRANSITION", message, 422);
  }

  const updated = await orderRepo.updateStatus(
    order.id,
    ORDER_STATUS.CANCELLED,
    order.status,
    actor
  );
  if (!updated) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      "Trạng thái đơn vừa thay đổi. Vui lòng tải lại và thử lại.",
      409
    );
  }
  return updated;
}

export async function updateStatus(
  id: string,
  newStatus: Exclude<OrderStatus, typeof ORDER_STATUS.NEW>
): Promise<Order> {
  const order = await orderRepo.findById(id);
  if (!order) {
    throw new AppError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404);
  }

  if (!VALID_TRANSITIONS[order.status].includes(newStatus)) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      `Không thể chuyển từ trạng thái "${order.status}" sang "${newStatus}".`,
      422
    );
  }

  const cancelledBy =
    newStatus === ORDER_STATUS.CANCELLED ? "owner" : undefined;
  const updated = await orderRepo.updateStatus(
    id,
    newStatus,
    order.status,
    cancelledBy
  );
  if (!updated) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      "Trạng thái đơn vừa thay đổi. Vui lòng tải lại và thử lại.",
      409
    );
  }
  return updated;
}
