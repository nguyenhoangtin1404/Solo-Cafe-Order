import type { Category, ProductWithOptions } from "@/types/product";
import * as categoryRepo from "@/lib/repositories/category.repository";
import * as productRepo from "@/lib/repositories/product.repository";

export type CategoryWithProducts = Category & {
  products: ProductWithOptions[];
};

export async function getMenuWithCategories(): Promise<CategoryWithProducts[]> {
  const [categories, products] = await Promise.all([
    categoryRepo.findAllCategories(),
    productRepo.findAllAvailable(),
  ]);

  return categories
    .map((cat) => ({
      ...cat,
      products: products.filter((p) => p.category_id === cat.id),
    }))
    .filter((cat) => cat.products.length > 0);
}

export async function getProductWithOptions(
  id: string
): Promise<ProductWithOptions | null> {
  return productRepo.findByIdWithOptions(id);
}
