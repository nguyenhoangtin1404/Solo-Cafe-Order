import { NextRequest } from "next/server";
import { POST } from "@/app/api/orders/route";
import * as orderService from "@/lib/services/order.service";
import * as bankConfig from "@/lib/config/bank";
import { AppError } from "@/lib/errors";
import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import type { Order, OrderItem } from "@/types/order";
import type { WaitEstimate } from "@/lib/services/order.service";

jest.mock("@/lib/services/order.service");
jest.mock("@/lib/config/bank");

// Ratelimit mock — dùng class để tránh hoisting issue với jest.mock factory.
// `limit` đọc module-scope vars tại call time (sau khi beforeEach assign), không phải lúc factory chạy.
let mockRatelimitSuccess = true;
let mockRatelimitReset = Date.now() + 60_000;

jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow() {
      return "sliding-window";
    }
    limit() {
      return Promise.resolve({
        success: mockRatelimitSuccess,
        reset: mockRatelimitReset,
      });
    }
  },
}));

jest.mock("@upstash/redis", () => ({
  Redis: { fromEnv: jest.fn().mockReturnValue({}) },
}));

const mockedService = orderService as jest.Mocked<typeof orderService>;
const mockedBank = bankConfig as jest.Mocked<typeof bankConfig>;

// UUID v7-like hợp lệ để Zod .uuid() pass
const PRODUCT_ID = "11111111-1111-7111-8111-111111111111";

function makeOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "22222222-2222-7222-8222-222222222222",
    order_id: "33333333-3333-7333-8333-333333333333",
    product_id: PRODUCT_ID,
    product_name: "Cà phê sữa",
    quantity: 2,
    unit_price: 35_000,
    selected_options: [],
    note: null,
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "33333333-3333-7333-8333-333333333333",
    order_code: "A001",
    status: ORDER_STATUS.NEW,
    payment_method: PAYMENT_METHOD.CASH,
    total_amount: 70_000,
    pickup_name: "Mon",
    note: null,
    customer_ref: null,
    cancelled_by: null,
    created_at: "2026-06-10T03:00:00.000Z",
    updated_at: "2026-06-10T03:00:00.000Z",
    items: [makeOrderItem()],
    ...overrides,
  };
}

function makeWaitEstimate(overrides: Partial<WaitEstimate> = {}): WaitEstimate {
  return { min: 5, max: 10, unit: "minutes", ...overrides };
}

function makeRequest(body: unknown, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const validBody = {
  pickup_name: "Mon",
  note: null,
  payment_method: "cash",
  items: [
    {
      product_id: PRODUCT_ID,
      quantity: 2,
      selected_option_value_ids: [],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRatelimitSuccess = true;
  mockRatelimitReset = Date.now() + 60_000;
  mockedBank.getBankTransferInfo.mockReturnValue(null);
});

describe("POST /api/orders", () => {
  it("trả về 201 với đủ fields khi hợp lệ", async () => {
    mockedService.submitOrder.mockResolvedValue({
      order: makeOrder(),
      wait_estimate: makeWaitEstimate(),
    });

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toMatchObject({
      order_code: "A001",
      pickup_name: "Mon",
      total_amount: 70_000,
      payment_method: "cash",
      wait_estimate: "5–10 phút",
      bank_transfer_info: null,
      items: [
        {
          product_name: "Cà phê sữa",
          quantity: 2,
          unit_price: 35_000,
          note: null,
          selected_options: [],
        },
      ],
    });
  });

  it("bank_transfer_info có đủ 4 fields khi payment_method = bank_transfer", async () => {
    mockedService.submitOrder.mockResolvedValue({
      order: makeOrder({ payment_method: PAYMENT_METHOD.BANK_TRANSFER }),
      wait_estimate: makeWaitEstimate(),
    });
    mockedBank.getBankTransferInfo.mockReturnValue({
      bank_name: "Vietcombank",
      account_number: "1234567890",
      account_name: "NGUYEN VAN A",
      qr_image_url: "https://example.com/qr.png",
    });

    const res = await POST(
      makeRequest({ ...validBody, payment_method: "bank_transfer" })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.bank_transfer_info).toEqual({
      bank_name: "Vietcombank",
      account_number: "1234567890",
      account_name: "NGUYEN VAN A",
      qr_image_url: "https://example.com/qr.png",
    });
  });

  it("bank_transfer_info = null khi payment_method = cash", async () => {
    mockedService.submitOrder.mockResolvedValue({
      order: makeOrder(),
      wait_estimate: makeWaitEstimate(),
    });

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(body.bank_transfer_info).toBeNull();
  });

  it("wait_estimate degraded trả fallback string", async () => {
    mockedService.submitOrder.mockResolvedValue({
      order: makeOrder(),
      wait_estimate: makeWaitEstimate({ degraded: true }),
    });

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(body.wait_estimate).toBe("10–20 phút");
  });

  it("400 VALIDATION_ERROR khi body rỗng", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR khi payment_method = momo", async () => {
    const res = await POST(
      makeRequest({ ...validBody, payment_method: "momo" })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR khi items rỗng", async () => {
    const res = await POST(makeRequest({ ...validBody, items: [] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("400 VALIDATION_ERROR khi body không phải JSON", async () => {
    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: "not-json",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("429 RATE_LIMITED kèm Retry-After khi vượt rate limit", async () => {
    mockRatelimitSuccess = false;
    mockRatelimitReset = Date.now() + 30_000;

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.code).toBe("RATE_LIMITED");
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("AppError từ service (422 PRODUCT_UNAVAILABLE) được passthrough", async () => {
    mockedService.submitOrder.mockRejectedValue(
      new AppError("PRODUCT_UNAVAILABLE", "Món đã hết.", 422)
    );

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body).toEqual({
      code: "PRODUCT_UNAVAILABLE",
      message: "Món đã hết.",
    });
  });

  it("lỗi lạ từ service trả 500 INTERNAL_ERROR và log error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockedService.submitOrder.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
