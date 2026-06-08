import * as categoryRepo from "@/lib/repositories/category.repository";
import * as productRepo from "@/lib/repositories/product.repository";
import { getMenuWithCategories } from "@/lib/services/product.service";
import type { Category, ProductWithOptions } from "@/types/product";

jest.mock("@/lib/repositories/category.repository");
jest.mock("@/lib/repositories/product.repository");

const mockedCategoryRepo = categoryRepo as jest.Mocked<typeof categoryRepo>;
const mockedProductRepo = productRepo as jest.Mocked<typeof productRepo>;

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-1111-1111-1111-111111111111",
    name: "Cà phê",
    sort_order: 1,
    created_at: "2026-06-08T00:00:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

function makeProduct(
  overrides: Partial<ProductWithOptions> = {}
): ProductWithOptions {
  return {
    id: "prod-1111-1111-1111-111111111111",
    category_id: "cat-1111-1111-1111-111111111111",
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getMenuWithCategories", () => {
  it("trả về categories kèm products đã group đúng", async () => {
    const cat1 = makeCategory({ id: "cat-aaaa", name: "Cà phê" });
    const cat2 = makeCategory({ id: "cat-bbbb", name: "Trà", sort_order: 2 });
    const p1 = makeProduct({ id: "prod-aaaa", category_id: "cat-aaaa" });
    const p2 = makeProduct({
      id: "prod-bbbb",
      category_id: "cat-bbbb",
      name: "Trà đào",
    });

    mockedCategoryRepo.findAllCategories.mockResolvedValue([cat1, cat2]);
    mockedProductRepo.findAllAvailable.mockResolvedValue([p1, p2]);

    const result = await getMenuWithCategories();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("cat-aaaa");
    expect(result[0].products).toHaveLength(1);
    expect(result[0].products[0].id).toBe("prod-aaaa");
    expect(result[1].id).toBe("cat-bbbb");
    expect(result[1].products[0].id).toBe("prod-bbbb");
  });

  it("ẩn category không có products (filter unavailable đã xử lý ở repo)", async () => {
    const cat1 = makeCategory({ id: "cat-aaaa", name: "Cà phê" });
    const cat2 = makeCategory({ id: "cat-bbbb", name: "Trà", sort_order: 2 });
    const p1 = makeProduct({ category_id: "cat-aaaa" });

    mockedCategoryRepo.findAllCategories.mockResolvedValue([cat1, cat2]);
    mockedProductRepo.findAllAvailable.mockResolvedValue([p1]);

    const result = await getMenuWithCategories();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("cat-aaaa");
  });

  it("trả về [] khi không có product nào available", async () => {
    mockedCategoryRepo.findAllCategories.mockResolvedValue([makeCategory()]);
    mockedProductRepo.findAllAvailable.mockResolvedValue([]);

    const result = await getMenuWithCategories();

    expect(result).toEqual([]);
  });

  it("trả về [] khi không có category nào", async () => {
    mockedCategoryRepo.findAllCategories.mockResolvedValue([]);
    mockedProductRepo.findAllAvailable.mockResolvedValue([makeProduct()]);

    const result = await getMenuWithCategories();

    expect(result).toEqual([]);
  });

  it("gọi cả findAllCategories và findAllAvailable", async () => {
    mockedCategoryRepo.findAllCategories.mockResolvedValue([]);
    mockedProductRepo.findAllAvailable.mockResolvedValue([]);

    await getMenuWithCategories();

    expect(mockedCategoryRepo.findAllCategories).toHaveBeenCalledTimes(1);
    expect(mockedProductRepo.findAllAvailable).toHaveBeenCalledTimes(1);
  });
});
