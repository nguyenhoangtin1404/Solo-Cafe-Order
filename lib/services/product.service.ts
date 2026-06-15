import type { Category, Product, ProductWithOptions } from "@/types/product";
import { AppError } from "@/lib/errors";
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

export type AdminProduct = Pick<
  Product,
  "id" | "category_id" | "name" | "price" | "image_url" | "is_available"
>;

export type AdminCategoryGroup = {
  category: Category;
  products: AdminProduct[];
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const products = await productRepo.findAllForAdminFlat();
  return products.map(
    ({ id, category_id, name, price, image_url, is_available }) => ({
      id,
      category_id,
      name,
      price,
      image_url,
      is_available,
    })
  );
}

export async function getAdminCategoryGroups(): Promise<AdminCategoryGroup[]> {
  const [categories, products] = await Promise.all([
    categoryRepo.findAllCategories(),
    getAdminProducts(),
  ]);

  return categories.map((category) => ({
    category,
    products: products.filter((p) => p.category_id === category.id),
  }));
}

export async function setProductAvailability(
  id: string,
  isAvailable: boolean
): Promise<{ id: string; is_available: boolean }> {
  const result = await productRepo.updateAvailability(id, isAvailable);
  if (!result) {
    throw new AppError("PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại.", 404);
  }
  return result;
}
