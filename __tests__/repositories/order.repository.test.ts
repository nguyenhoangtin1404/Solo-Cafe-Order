import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { findByCode } from "@/lib/repositories/order.repository";
import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import type { Order } from "@/types/order";

jest.mock("@/lib/supabase-admin");
jest.mock("@/lib/utils/timezone", () => ({
  getTodayHCMBounds: () => ({
    start: "2026-06-09T00:00:00.000Z",
    end: "2026-06-10T00:00:00.000Z",
  }),
  getPreviousDayHCMBounds: () => ({
    start: "2026-06-08T00:00:00.000Z",
    end: "2026-06-09T00:00:00.000Z",
  }),
}));

const mockedCreateClient = createAdminSupabaseClient as jest.MockedFunction<
  typeof createAdminSupabaseClient
>;

const yesterdayOrder: Order = {
  id: "88888888-8888-7888-8888-888888888888",
  order_code: "A001",
  status: ORDER_STATUS.NEW,
  total_amount: 30_000,
  payment_method: PAYMENT_METHOD.CASH,
  pickup_name: null,
  note: null,
  customer_ref: null,
  cancelled_by: null,
  created_at: "2026-06-08T21:59:00.000Z",
  updated_at: "2026-06-08T21:59:00.000Z",
  items: [],
};

function buildQueryChain(maybeSingle: jest.Mock) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    maybeSingle,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("findByCode", () => {
  it("fallback sang ngày HCM trước khi không tìm thấy trong hôm nay", async () => {
    const maybeSingle = jest
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: yesterdayOrder, error: null });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue(buildQueryChain(maybeSingle)),
    } as unknown as ReturnType<typeof createAdminSupabaseClient>);

    const result = await findByCode("A001");

    expect(result).toEqual(yesterdayOrder);
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });

  it("trả về đơn hôm nay khi tìm thấy, không query ngày trước", async () => {
    const todayOrder = {
      ...yesterdayOrder,
      created_at: "2026-06-09T10:00:00.000Z",
    };
    const maybeSingle = jest
      .fn()
      .mockResolvedValueOnce({ data: todayOrder, error: null });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue(buildQueryChain(maybeSingle)),
    } as unknown as ReturnType<typeof createAdminSupabaseClient>);

    const result = await findByCode("A001");

    expect(result).toEqual(todayOrder);
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });
});
