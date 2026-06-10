import {
  getMenuWithCategories,
  type CategoryWithProducts,
} from "@/lib/services/product.service";
import { errorResponse } from "@/lib/errors";
import type { ProductWithOptions } from "@/types/product";

// DTO theo docs/API_CONTRACT.md — không expose is_available, deleted_at, created_at
type MenuOptionValueDto = {
  id: string;
  name: string;
  extra_price: number;
};

type MenuOptionDto = {
  id: string;
  name: string;
  type: "select" | "multi";
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
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      type: option.type,
      values: option.values.map((value) => ({
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

export async function GET() {
  try {
    const categories = await getMenuWithCategories();
    return Response.json({ categories: categories.map(toCategoryDto) });
  } catch {
    return errorResponse("INTERNAL_ERROR", "Server error", 500);
  }
}
