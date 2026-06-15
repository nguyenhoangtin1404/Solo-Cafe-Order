import type { Category } from "@/types/product";
import { AppError } from "@/lib/errors";
import * as categoryRepo from "@/lib/repositories/category.repository";
import * as productRepo from "@/lib/repositories/product.repository";

export async function getAdminCategories(): Promise<Category[]> {
  return categoryRepo.findAllCategories();
}

export async function createCategory(
  name: string,
  sortOrder: number
): Promise<Category> {
  return categoryRepo.createCategory(name, sortOrder);
}

export async function updateCategory(
  id: string,
  fields: { name?: string; sort_order?: number }
): Promise<Category> {
  const result = await categoryRepo.updateCategory(id, fields);
  if (!result) {
    throw new AppError("CATEGORY_NOT_FOUND", "Danh mục không tồn tại.", 404);
  }
  return result;
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await categoryRepo.findCategoryById(id);
  if (!existing) {
    throw new AppError("CATEGORY_NOT_FOUND", "Danh mục không tồn tại.", 404);
  }
  const productCount = await productRepo.countActiveByCategory(id);
  if (productCount > 0) {
    throw new AppError(
      "CATEGORY_HAS_PRODUCTS",
      "Danh mục còn sản phẩm, không thể xóa.",
      422
    );
  }
  await categoryRepo.softDeleteCategory(id);
}
