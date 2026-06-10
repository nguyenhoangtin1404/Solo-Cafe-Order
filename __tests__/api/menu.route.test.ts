import { GET } from "@/app/api/menu/route";
import * as productService from "@/lib/services/product.service";
import type { CategoryWithProducts } from "@/lib/services/product.service";
import type { ProductWithOptions } from "@/types/product";

jest.mock("@/lib/services/product.service");

const mockedService = productService as jest.Mocked<typeof productService>;

function makeProduct(
  overrides: Partial<ProductWithOptions> = {}
): ProductWithOptions {
  return {
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
    ...overrides,
  };
}

function makeCategoryWithProducts(
  overrides: Partial<CategoryWithProducts> = {}
): CategoryWithProducts {
  return {
    id: "cat-1111-1111-1111-111111111111",
    name: "Cà phê",
    sort_order: 1,
    created_at: "2026-06-08T00:00:00.000Z",
    deleted_at: null,
    products: [makeProduct()],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/menu", () => {
  it("trả về 200 application/json với categories map đúng contract", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts(),
    ]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
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

  it("giữ nguyên thứ tự categories và products từ service", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts({
        id: "cat-aaaa",
        name: "Cà phê",
        sort_order: 1,
        products: [
          makeProduct({ id: "prod-a1", options: [] }),
          makeProduct({ id: "prod-a2", options: [] }),
        ],
      }),
      makeCategoryWithProducts({
        id: "cat-bbbb",
        name: "Trà",
        sort_order: 2,
        products: [makeProduct({ id: "prod-b1", options: [] })],
      }),
    ]);

    const res = await GET();
    const body = await res.json();

    expect(body.categories.map((c: { id: string }) => c.id)).toEqual([
      "cat-aaaa",
      "cat-bbbb",
    ]);
    expect(
      body.categories[0].products.map((p: { id: string }) => p.id)
    ).toEqual(["prod-a1", "prod-a2"]);
  });

  it("sort values theo extra_price tăng dần và options theo id", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts({
        products: [
          makeProduct({
            options: [
              {
                id: "opt-2222",
                product_id: "prod-1111-1111-1111-111111111111",
                name: "Topping",
                type: "multi",
                deleted_at: null,
                values: [
                  {
                    id: "val-tc",
                    option_id: "opt-2222",
                    name: "Trân châu",
                    extra_price: 5_000,
                    deleted_at: null,
                  },
                ],
              },
              {
                id: "opt-1111",
                product_id: "prod-1111-1111-1111-111111111111",
                name: "Size",
                type: "select",
                deleted_at: null,
                values: [
                  {
                    id: "val-l",
                    option_id: "opt-1111",
                    name: "L",
                    extra_price: 5_000,
                    deleted_at: null,
                  },
                  {
                    id: "val-m",
                    option_id: "opt-1111",
                    name: "M",
                    extra_price: 0,
                    deleted_at: null,
                  },
                ],
              },
            ],
          }),
        ],
      }),
    ]);

    const res = await GET();
    const body = await res.json();

    const options = body.categories[0].products[0].options;
    expect(options.map((o: { id: string }) => o.id)).toEqual([
      "opt-1111",
      "opt-2222",
    ]);
    expect(options[0].values.map((v: { name: string }) => v.name)).toEqual([
      "M",
      "L",
    ]);
  });

  it("ẩn option không còn value nào", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts({
        products: [
          makeProduct({
            options: [
              {
                id: "opt-empty",
                product_id: "prod-1111-1111-1111-111111111111",
                name: "Size",
                type: "select",
                deleted_at: null,
                values: [],
              },
            ],
          }),
        ],
      }),
    ]);

    const res = await GET();
    const body = await res.json();

    expect(body.categories[0].products[0].options).toEqual([]);
  });

  it("pass-through description và image_url null", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts({
        products: [
          makeProduct({ description: null, image_url: null, options: [] }),
        ],
      }),
    ]);

    const res = await GET();
    const body = await res.json();

    const product = body.categories[0].products[0];
    expect(product.description).toBeNull();
    expect(product.image_url).toBeNull();
  });

  it("trả về categories: [] khi menu trống", async () => {
    mockedService.getMenuWithCategories.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ categories: [] });
  });

  it("trả về 500 INTERNAL_ERROR và log error khi service throw", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockedService.getMenuWithCategories.mockRejectedValue(new Error("db down"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ code: "INTERNAL_ERROR", message: "Server error" });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
