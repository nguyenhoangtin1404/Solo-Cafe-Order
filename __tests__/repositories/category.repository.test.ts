import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { findAllCategories } from "@/lib/repositories/category.repository";

jest.mock("@/lib/supabase-admin");

const mockedCreateClient = createAdminSupabaseClient as jest.MockedFunction<
  typeof createAdminSupabaseClient
>;

function buildChain(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(result),
  };
}

function mockClientWith(chain: ReturnType<typeof buildChain>) {
  mockedCreateClient.mockReturnValue({
    from: jest.fn().mockReturnValue(chain),
  } as unknown as ReturnType<typeof createAdminSupabaseClient>);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("findAllCategories", () => {
  it("filter deleted_at IS NULL và sort theo sort_order tăng dần", async () => {
    const chain = buildChain({ data: [], error: null });
    mockClientWith(chain);

    await findAllCategories();

    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(chain.order).toHaveBeenCalledWith("sort_order", {
      ascending: true,
    });
  });

  it("throw khi Supabase trả error", async () => {
    const chain = buildChain({
      data: null,
      error: new Error("connection refused"),
    });
    mockClientWith(chain);

    await expect(findAllCategories()).rejects.toThrow("connection refused");
  });
});
