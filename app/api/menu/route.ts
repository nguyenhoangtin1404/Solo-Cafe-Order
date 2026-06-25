import {
  getMenuWithCategories,
  type CategoryWithProducts,
} from "@/lib/services/product.service";
import { handleRouteError } from "@/lib/errors";
import type { ProductOption, ProductWithOptions } from "@/types/product";

// DTO theo docs/API_CONTRACT.md — không expose is_available, deleted_at, created_at
type MenuOptionValueDto = {
  id: string;
  name: string;
  extra_price: number;
};

type MenuOptionDto = {
  id: string;
  name: string;
  type: ProductOption["type"];
  values: MenuOptionValueDto[];
};

type MenuProductDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  options: MenuOptionDto[];
};

type MenuCategoryDto = {
  id: string;
  name: string;
  sort_order: number;
  products: MenuProductDto[];
};

function toProductDto(product: ProductWithOptions): MenuProductDto {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.image_url,
    // Sort tường minh vì nested select không có ORDER BY: id là UUID v7 (thứ tự tạo, so sánh
    // codepoint — không dùng localeCompare vì phụ thuộc locale runtime), values theo extra_price
    // tăng dần để FE default-select value rẻ nhất, tie-break bằng id cho deterministic.
    options: product.options
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .map((option) => ({
        id: option.id,
        name: option.name,
        type: option.type,
        values: [...option.values]
          .sort(
            (a, b) => a.extra_price - b.extra_price || (a.id < b.id ? -1 : 1)
          )
          .map((value) => ({
            id: value.id,
            name: value.name,
            extra_price: value.extra_price,
          })),
      })),
  };
}

function toCategoryDto(category: CategoryWithProducts): MenuCategoryDto {
  return {
    id: category.id,
    name: category.name,
    sort_order: category.sort_order,
    products: category.products.map(toProductDto),
  };
}

// Không cache (Next 16 GET handler mặc định dynamic) — chủ đích: owner toggle
// is_available phải có hiệu lực ngay ở request kế tiếp của khách.
export async function GET() {
  try {
    const categories = await getMenuWithCategories();
    return Response.json({ categories: categories.map(toCategoryDto) });
  } catch (err) {
    return handleRouteError(err);
  }
}
