import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import * as orderRepo from "@/lib/repositories/order.repository";
import * as productRepo from "@/lib/repositories/product.repository";
import {
  cancelOrder,
  submitOrder,
  updateStatus,
} from "@/lib/services/order.service";
import { getHCMHour } from "@/lib/utils/timezone";
import type { Order } from "@/types/order";
import type { ProductWithOptions } from "@/types/product";

jest.mock("@/lib/repositories/order.repository");
jest.mock("@/lib/repositories/product.repository");
jest.mock("@/lib/utils/timezone", () => ({
  getHCMHour: jest.fn(() => 10),
  getTodayHCMBounds: jest.fn(() => ({
    start: "2026-06-08T00:00:00.000Z",
    end: "2026-06-09T00:00:00.000Z",
  })),
}));

const mockedOrderRepo = orderRepo as jest.Mocked<typeof orderRepo>;
const mockedProductRepo = productRepo as jest.Mocked<typeof productRepo>;
const mockedGetHCMHour = getHCMHour as jest.MockedFunction<typeof getHCMHour>;

function makeProduct(
  overrides: Partial<ProductWithOptions> = {}
): ProductWithOptions {
  return {
    id: "11111111-1111-7111-8111-111111111111",
    category_id: "22222222-2222-7222-8222-222222222222",
    name: "Cà phê đen",
    description: null,
    price: 30_000,
    image_url: null,
    is_available: true,
    created_at: "2026-06-08T00:00:00.000Z",
    deleted_at: null,
    options: [],
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "33333333-3333-7333-8333-333333333333",
    order_code: "A001",
    cancel_token: "aaaaaaaa-aaaa-7aaa-8aaa-aaaaaaaaaaaa",
    status: ORDER_STATUS.NEW,
    total_amount: 30_000,
    payment_method: PAYMENT_METHOD.CASH,
    pickup_name: null,
    note: null,
    customer_ref: null,
    cancelled_by: null,
    created_at: "2026-06-08T00:00:00.000Z",
    updated_at: "2026-06-08T00:00:00.000Z",
    items: [],
    ...overrides,
  };
}

const SIZE_OPTION_ID = "55555555-5555-7555-8555-555555555555";
const SIZE_SMALL_ID = "44444444-4444-7444-8444-444444444444";
const SIZE_LARGE_ID = "44444444-4444-7444-8444-444444444445";
const FOREIGN_VALUE_ID = "99999999-9999-7999-8999-999999999999";

function makeProductWithSizeSelect(
  values: { id: string; name: string; extra_price?: number }[]
): ProductWithOptions {
  return makeProduct({
    options: [
      {
        id: SIZE_OPTION_ID,
        product_id: "11111111-1111-7111-8111-111111111111",
        name: "Size",
        type: "select",
        deleted_at: null,
        values: values.map((v) => ({
          option_id: SIZE_OPTION_ID,
          extra_price: v.extra_price ?? 0,
          deleted_at: null,
          id: v.id,
          name: v.name,
        })),
      },
    ],
  });
}

const baseSubmitInput = {
  pickup_name: null,
  note: null,
  payment_method: PAYMENT_METHOD.CASH as const,
  items: [
    {
      product_id: "11111111-1111-7111-8111-111111111111",
      quantity: 1,
      selected_option_value_ids: [] as string[],
      note: null,
    },
  ],
};

function submitWithOptionIds(valueIds: string[]) {
  return submitOrder({
    ...baseSubmitInput,
    items: [
      {
        ...baseSubmitInput.items[0],
        selected_option_value_ids: valueIds,
      },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetHCMHour.mockReturnValue(10);
});

describe("submitOrder", () => {
  it("throws PRODUCT_NOT_FOUND khi product_id không tồn tại", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([]);

    await expect(submitOrder(baseSubmitInput)).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
      httpStatus: 404,
    });
  });

  it("throws PRODUCT_UNAVAILABLE khi product is_available = false", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([
      makeProduct({ is_available: false }),
    ]);

    await expect(submitOrder(baseSubmitInput)).rejects.toMatchObject({
      code: "PRODUCT_UNAVAILABLE",
      httpStatus: 422,
    });
  });

  it("throws CAFE_CLOSED khi quá giờ đóng cửa", async () => {
    mockedGetHCMHour.mockReturnValue(22);

    await expect(submitOrder(baseSubmitInput)).rejects.toMatchObject({
      code: "CAFE_CLOSED",
      httpStatus: 422,
    });
    expect(mockedProductRepo.findByIdsWithOptions).not.toHaveBeenCalled();
  });

  it("tính wait_estimate và trả degraded khi countPending fail", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([makeProduct()]);
    mockedOrderRepo.createOrder.mockResolvedValue(makeOrder());
    mockedOrderRepo.countPending.mockRejectedValue(new Error("db down"));

    const result = await submitOrder(baseSubmitInput);

    expect(result.wait_estimate).toMatchObject({
      min: 3,
      max: 5,
      unit: "minutes",
      degraded: true,
    });
  });

  it("coerce pickup_name HTML-only thành null khi tạo đơn", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([makeProduct()]);
    mockedOrderRepo.createOrder.mockResolvedValue(makeOrder());
    mockedOrderRepo.countPending.mockResolvedValue(0);

    await submitOrder({ ...baseSubmitInput, pickup_name: "<b>" });

    expect(mockedOrderRepo.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ pickup_name: null })
    );
  });

  it("cho phép multi-option với 0 lựa chọn", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([
      makeProduct({
        options: [
          {
            id: "66666666-6666-7666-8666-666666666666",
            product_id: "11111111-1111-7111-8111-111111111111",
            name: "Topping",
            type: "multi",
            deleted_at: null,
            values: [
              {
                id: "77777777-7777-7777-8777-777777777777",
                option_id: "66666666-6666-7666-8666-666666666666",
                name: "Kem",
                extra_price: 3_000,
                deleted_at: null,
              },
            ],
          },
        ],
      }),
    ]);
    mockedOrderRepo.createOrder.mockResolvedValue(makeOrder());
    mockedOrderRepo.countPending.mockResolvedValue(0);

    await submitOrder(baseSubmitInput);

    expect(mockedOrderRepo.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [expect.objectContaining({ unit_price: 30_000 })],
      })
    );
  });

  it("throws VALIDATION_ERROR khi select option thiếu lựa chọn", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([
      makeProductWithSizeSelect([{ id: SIZE_SMALL_ID, name: "Nhỏ" }]),
    ]);

    await expect(submitWithOptionIds([])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringContaining("Size"),
    });
    expect(mockedOrderRepo.createOrder).not.toHaveBeenCalled();
  });

  it("throws VALIDATION_ERROR khi select option chọn 2 values", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([
      makeProductWithSizeSelect([
        { id: SIZE_SMALL_ID, name: "Nhỏ" },
        { id: SIZE_LARGE_ID, name: "Lớn" },
      ]),
    ]);

    await expect(
      submitWithOptionIds([SIZE_SMALL_ID, SIZE_LARGE_ID])
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringContaining("Size"),
    });
  });

  it("throws VALIDATION_ERROR khi value_id không thuộc product", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([
      makeProductWithSizeSelect([{ id: SIZE_SMALL_ID, name: "Nhỏ" }]),
    ]);

    await expect(submitWithOptionIds([FOREIGN_VALUE_ID])).rejects.toMatchObject(
      {
        code: "VALIDATION_ERROR",
        message: expect.stringContaining("Cà phê đen"),
      }
    );
  });

  it("throws PRODUCT_UNAVAILABLE khi select option không có values", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([
      makeProduct({
        options: [
          {
            id: SIZE_OPTION_ID,
            product_id: "11111111-1111-7111-8111-111111111111",
            name: "Size",
            type: "select",
            deleted_at: null,
            values: [],
          },
        ],
      }),
    ]);

    await expect(submitWithOptionIds([])).rejects.toMatchObject({
      code: "PRODUCT_UNAVAILABLE",
      httpStatus: 422,
      message: expect.stringContaining("Cà phê đen"),
    });
  });

  it("làm tròn wait_estimate min/max thành số nguyên", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([makeProduct()]);
    mockedOrderRepo.createOrder.mockResolvedValue(makeOrder());
    // count BEFORE insert: 1.5 pending → base 4.5 → min rounds 2.5→3, max rounds 6.5→7
    mockedOrderRepo.countPending.mockResolvedValue(1.5);

    const result = await submitOrder(baseSubmitInput);

    expect(result.wait_estimate.min).toBe(3);
    expect(result.wait_estimate.max).toBe(7);
    expect(Number.isInteger(result.wait_estimate.min)).toBe(true);
    expect(Number.isInteger(result.wait_estimate.max)).toBe(true);
  });

  it("tính wait_estimate 3–5 phút khi queue có 1 MAKING (weighted 0.5)", async () => {
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([makeProduct()]);
    mockedOrderRepo.createOrder.mockResolvedValue(makeOrder());
    // count BEFORE insert: only the in-making order remains (weighted 0.5)
    mockedOrderRepo.countPending.mockResolvedValue(0.5);

    const result = await submitOrder(baseSubmitInput);

    expect(result.wait_estimate).toEqual({
      min: 3,
      max: 5,
      unit: "minutes",
    });
  });

  it("tính unit_price từ DB price + option extra_price", async () => {
    const valueId = "44444444-4444-7444-8444-444444444444";
    mockedProductRepo.findByIdsWithOptions.mockResolvedValue([
      makeProduct({
        price: 30_000,
        options: [
          {
            id: "55555555-5555-7555-8555-555555555555",
            product_id: "11111111-1111-7111-8111-111111111111",
            name: "Size",
            type: "select",
            deleted_at: null,
            values: [
              {
                id: valueId,
                option_id: "55555555-5555-7555-8555-555555555555",
                name: "Lớn",
                extra_price: 5_000,
                deleted_at: null,
              },
            ],
          },
        ],
      }),
    ]);
    mockedOrderRepo.createOrder.mockImplementation(async (data) =>
      makeOrder({ total_amount: data.total_amount, items: [] })
    );
    mockedOrderRepo.countPending.mockResolvedValue(1);

    await submitOrder({
      ...baseSubmitInput,
      items: [
        {
          product_id: "11111111-1111-7111-8111-111111111111",
          quantity: 2,
          selected_option_value_ids: [valueId],
          note: null,
        },
      ],
    });

    expect(mockedOrderRepo.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        total_amount: 70_000,
        items: [
          expect.objectContaining({
            unit_price: 35_000,
            quantity: 2,
          }),
        ],
      })
    );
  });
});

describe("cancelOrder", () => {
  const VALID_TOKEN = "aaaaaaaa-aaaa-7aaa-8aaa-aaaaaaaaaaaa";
  const WRONG_TOKEN = "00000000-0000-7000-8000-000000000000";

  it("thành công khi customer cung cấp cancel_token đúng", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW, cancel_token: VALID_TOKEN });
    mockedOrderRepo.findByCode.mockResolvedValue(order);
    mockedOrderRepo.updateStatus.mockResolvedValue({
      ...order,
      status: ORDER_STATUS.CANCELLED,
      cancelled_by: "customer",
    });

    const result = await cancelOrder("A001", "customer", VALID_TOKEN);

    expect(result.status).toBe(ORDER_STATUS.CANCELLED);
    expect(mockedOrderRepo.updateStatus).toHaveBeenCalledWith(
      order.id,
      ORDER_STATUS.CANCELLED,
      order.status,
      "customer"
    );
  });

  it("throws ORDER_NOT_FOUND khi customer không cung cấp cancel_token", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW, cancel_token: VALID_TOKEN });
    mockedOrderRepo.findByCode.mockResolvedValue(order);

    await expect(cancelOrder("A001", "customer")).rejects.toMatchObject({
      code: "ORDER_NOT_FOUND",
      httpStatus: 404,
    });
  });

  it("throws ORDER_NOT_FOUND khi customer cung cấp cancel_token sai", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW, cancel_token: VALID_TOKEN });
    mockedOrderRepo.findByCode.mockResolvedValue(order);

    await expect(
      cancelOrder("A001", "customer", WRONG_TOKEN)
    ).rejects.toMatchObject({
      code: "ORDER_NOT_FOUND",
      httpStatus: 404,
    });
  });

  it("owner có thể hủy mà không cần cancel_token", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW, cancel_token: VALID_TOKEN });
    mockedOrderRepo.findByCode.mockResolvedValue(order);
    mockedOrderRepo.updateStatus.mockResolvedValue({
      ...order,
      status: ORDER_STATUS.CANCELLED,
      cancelled_by: "owner",
    });

    const result = await cancelOrder("A001", "owner");
    expect(result.status).toBe(ORDER_STATUS.CANCELLED);
  });

  it("throws INVALID_STATUS_TRANSITION khi status = making", async () => {
    const order = makeOrder({ status: ORDER_STATUS.MAKING, cancel_token: VALID_TOKEN });
    mockedOrderRepo.findByCode.mockResolvedValue(order);

    await expect(cancelOrder("A001", "customer", VALID_TOKEN)).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      httpStatus: 422,
    });
  });

  it("throws 409 khi optimistic lock fail (race cancel)", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW, cancel_token: VALID_TOKEN });
    mockedOrderRepo.findByCode.mockResolvedValue(order);
    mockedOrderRepo.updateStatus.mockResolvedValue(null);

    await expect(cancelOrder("A001", "customer", VALID_TOKEN)).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      httpStatus: 409,
    });
  });
});

describe("updateStatus", () => {
  it("cho phép new → making", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW });
    mockedOrderRepo.findById.mockResolvedValue(order);
    mockedOrderRepo.updateStatus.mockResolvedValue({
      ...order,
      status: ORDER_STATUS.MAKING,
    });

    const result = await updateStatus(order.id, ORDER_STATUS.MAKING);

    expect(result.status).toBe(ORDER_STATUS.MAKING);
  });

  it("throws INVALID_STATUS_TRANSITION cho making → cancelled", async () => {
    mockedOrderRepo.findById.mockResolvedValue(
      makeOrder({ status: ORDER_STATUS.MAKING })
    );

    await expect(
      updateStatus(
        "33333333-3333-7333-8333-333333333333",
        ORDER_STATUS.CANCELLED
      )
    ).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      httpStatus: 422,
    });
  });

  it("set cancelled_by = owner khi owner hủy đơn new", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW });
    mockedOrderRepo.findById.mockResolvedValue(order);
    mockedOrderRepo.updateStatus.mockResolvedValue({
      ...order,
      status: ORDER_STATUS.CANCELLED,
      cancelled_by: "owner",
    });

    const result = await updateStatus(order.id, ORDER_STATUS.CANCELLED);

    expect(result.cancelled_by).toBe("owner");
    expect(mockedOrderRepo.updateStatus).toHaveBeenCalledWith(
      order.id,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.NEW,
      "owner"
    );
  });

  it("throws 409 khi optimistic lock fail (race update)", async () => {
    const order = makeOrder({ status: ORDER_STATUS.NEW });
    mockedOrderRepo.findById.mockResolvedValue(order);
    mockedOrderRepo.updateStatus.mockResolvedValue(null);

    await expect(
      updateStatus(order.id, ORDER_STATUS.MAKING)
    ).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION",
      httpStatus: 409,
    });
  });
});
