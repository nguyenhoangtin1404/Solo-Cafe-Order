import MenuPage from "@/app/menu/page";
import { getMenuWithCategories } from "@/lib/services/product.service";
import type { CategoryWithProducts } from "@/lib/services/product.service";
import type { MenuCategory } from "@/types/menu";
import type { ProductWithOptions } from "@/types/product";

jest.mock("@/lib/services/product.service", () => ({
  getMenuWithCategories: jest.fn(),
}));

jest.mock("@/components/menu/MenuView", () => ({
  MenuView: jest.fn(() => null),
}));

const mockedGetMenuWithCategories =
  getMenuWithCategories as jest.MockedFunction<typeof getMenuWithCategories>;

function makeProduct(
  overrides: Partial<ProductWithOptions> = {}
): ProductWithOptions {
  return {
    id: "01910000-0000-7002-8000-000000000001",
    category_id: "01910000-0000-7001-8000-000000000001",
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

function makeCategoryWithProducts(
  products: ProductWithOptions[]
): CategoryWithProducts {
  return {
    id: "01910000-0000-7001-8000-000000000001",
    name: "Cà phê",
    sort_order: 1,
    created_at: "2026-06-08T00:00:00.000Z",
    deleted_at: null,
    products,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MenuPage", () => {
  it("vẫn hiển thị product nếu select option chưa có value", async () => {
    mockedGetMenuWithCategories.mockResolvedValue([
      makeCategoryWithProducts([
        makeProduct({
          options: [
            {
              id: "01910000-0000-7003-8000-000000000001",
              product_id: "01910000-0000-7002-8000-000000000001",
              name: "Size",
              type: "select",
              values: [],
            },
          ],
        }),
        makeProduct({
          id: "01910000-0000-7002-8000-000000000002",
          name: "Bạc xỉu",
        }),
      ]),
    ]);

    const page = (await MenuPage()) as {
      props: { children: { props: { categories: MenuCategory[] } } };
    };

    const categories = page.props.children.props.categories;
    expect(categories[0].products.map((p) => p.name)).toEqual([
      "Cà phê sữa",
      "Bạc xỉu",
    ]);
    expect(categories[0].products[0].options).toEqual([
      {
        id: "01910000-0000-7003-8000-000000000001",
        name: "Size",
        type: "select",
        values: [],
      },
    ]);
  });
});
