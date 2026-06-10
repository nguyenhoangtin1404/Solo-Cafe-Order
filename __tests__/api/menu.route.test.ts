import { GET } from "@/app/api/menu/route";
import * as productService from "@/lib/services/product.service";
import type { CategoryWithProducts } from "@/lib/services/product.service";

jest.mock("@/lib/services/product.service");

const mockedService = productService as jest.Mocked<typeof productService>;

function makeCategoryWithProducts(
  overrides: Partial<CategoryWithProducts> = {}
): CategoryWithProducts {
  return {
    id: "cat-1111-1111-1111-111111111111",
    name: "Cà phê",
    sort_order: 1,
    created_at: "2026-06-08T00:00:00.000Z",
    deleted_at: null,
    products: [
      {
        id: "prod-1111-1111-1111-111111111111",
        category_id: "cat-1111-1111-1111-111111111111",
        name: "Cà phê sữa",
        description: "Đậm đà",
        price: 35_000,
        image_url: "https://example.com/cf-sua.webp",
        is_available: true,
        created_at: "2026-06-08T00:00:00.000Z",
        deleted_at: null,
        options: [
          {
            id: "opt-1111",
            product_id: "prod-1111-1111-1111-111111111111",
            name: "Size",
            type: "select",
            deleted_at: null,
            values: [
              {
                id: "val-1111",
                option_id: "opt-1111",
                name: "M",
                extra_price: 0,
                deleted_at: null,
              },
              {
                id: "val-2222",
                option_id: "opt-1111",
                name: "L",
                extra_price: 5_000,
                deleted_at: null,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/menu", () => {
  it("trả về 200 với categories map đúng contract", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts(),
    ]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      categories: [
        {
          id: "cat-1111-1111-1111-111111111111",
          name: "Cà phê",
          sort_order: 1,
          products: [
            {
              id: "prod-1111-1111-1111-111111111111",
              name: "Cà phê sữa",
              description: "Đậm đà",
              price: 35_000,
              image_url: "https://example.com/cf-sua.webp",
              options: [
                {
                  id: "opt-1111",
                  name: "Size",
                  type: "select",
                  values: [
                    { id: "val-1111", name: "M", extra_price: 0 },
                    { id: "val-2222", name: "L", extra_price: 5_000 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("không expose is_available, created_at, deleted_at trong response", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts(),
    ]);

    const res = await GET();
    const body = await res.json();

    const category = body.categories[0];
    const product = category.products[0];
    expect(category).not.toHaveProperty("created_at");
    expect(category).not.toHaveProperty("deleted_at");
    expect(product).not.toHaveProperty("is_available");
    expect(product).not.toHaveProperty("created_at");
    expect(product).not.toHaveProperty("deleted_at");
    expect(product).not.toHaveProperty("category_id");
  });

  it("trả về categories: [] khi menu trống", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ categories: [] });
  });

  it("trả về 500 INTERNAL_ERROR khi service throw", async () => {
    mockedService.getMenuWithCategories.mockRejectedValue(new Error("db down"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ code: "INTERNAL_ERROR", message: "Server error" });
  });
});
