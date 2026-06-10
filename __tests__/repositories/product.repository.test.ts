import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  findAllAvailable,
  findByIdWithOptions,
} from "@/lib/repositories/product.repository";

jest.mock("@/lib/supabase-admin");

const mockedCreateClient = createAdminSupabaseClient as jest.MockedFunction<
  typeof createAdminSupabaseClient
>;

function makeRawProductRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod-1111-1111-1111-111111111111",
    category_id: "cat-1111-1111-1111-111111111111",
    name: "Cà phê sữa",
    description: null,
    price: 35_000,
    image_url: null,
    is_available: true,
    created_at: "2026-06-08T00:00:00.000Z",
    deleted_at: null,
    options: [],
    ...overrides,
  };
}

function buildListChain(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function mockClientWith(chain: ReturnType<typeof buildListChain>) {
  mockedCreateClient.mockReturnValue({
    from: jest.fn().mockReturnValue(chain),
  } as unknown as ReturnType<typeof createAdminSupabaseClient>);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("findAllAvailable", () => {
  it("query filter is_available = true và deleted_at IS NULL", async () => {
    const chain = buildListChain({ data: [], error: null });
    mockClientWith(chain);

    await findAllAvailable();

    expect(chain.eq).toHaveBeenCalledWith("is_available", true);
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.order).toHaveBeenCalledWith("created_at", {
      ascending: true,
    });
  });

  it("lọc options và values đã soft delete khỏi kết quả", async () => {
    const row = makeRawProductRow({
      options: [
        {
          id: "opt-deleted",
          product_id: "prod-1111-1111-1111-111111111111",
          name: "Đường",
          type: "select",
          deleted_at: "2026-06-01T00:00:00.000Z",
          values: [],
        },
        {
          id: "opt-live",
          product_id: "prod-1111-1111-1111-111111111111",
          name: "Size",
          type: "select",
          deleted_at: null,
          values: [
            {
              id: "val-live",
              option_id: "opt-live",
              name: "M",
              extra_price: 0,
              deleted_at: null,
            },
            {
              id: "val-deleted",
              option_id: "opt-live",
              name: "XL",
              extra_price: 10_000,
              deleted_at: "2026-06-01T00:00:00.000Z",
            },
          ],
        },
      ],
    });
    const chain = buildListChain({ data: [row], error: null });
    mockClientWith(chain);

    const result = await findAllAvailable();

    expect(result).toHaveLength(1);
    expect(result[0].options).toHaveLength(1);
    expect(result[0].options[0].id).toBe("opt-live");
    expect(result[0].options[0].values).toHaveLength(1);
    expect(result[0].options[0].values[0].id).toBe("val-live");
  });

  it("throw khi Supabase trả error", async () => {
    const chain = buildListChain({
      data: null,
      error: new Error("connection refused"),
    });
    mockClientWith(chain);

    await expect(findAllAvailable()).rejects.toThrow("connection refused");
  });
});

describe("findByIdWithOptions", () => {
  it("filter deleted_at IS NULL và trả null khi không tìm thấy", async () => {
    const chain = buildListChain({ data: null, error: null });
    mockClientWith(chain);

    const result = await findByIdWithOptions("prod-xxxx");

    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(result).toBeNull();
  });
});
