import type { Category } from "@/types/product";
import { AppError } from "@/lib/errors";
import { CATEGORY_HAS_PRODUCTS } from "@/lib/constants";
import * as categoryRepo from "@/lib/repositories/category.repository";
import * as productRepo from "@/lib/repositories/product.repository";
import { sanitizeText } from "@/lib/utils/sanitize";

export async function getAdminCategories(): Promise<Category[]> {
  return categoryRepo.findAllCategories();
}

export async function createCategory(
  name: string,
  sortOrder: number
): Promise<Category> {
  const sanitizedName = sanitizeText(name, 50);
  if (!sanitizedName) {
    throw new AppError("VALIDATION_ERROR", "Tên danh mục không hợp lệ.", 400);
  }
  return categoryRepo.createCategory(sanitizedName, sortOrder);
}

export async function updateCategory(
  id: string,
  fields: { name?: string; sort_order?: number }
): Promise<Category> {
  if (fields.name !== undefined) {
    const sanitizedName = sanitizeText(fields.name, 50);
    if (!sanitizedName) {
      throw new AppError("VALIDATION_ERROR", "Tên danh mục không hợp lệ.", 400);
    }
    fields = { ...fields, name: sanitizedName };
  }
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
      CATEGORY_HAS_PRODUCTS,
      "Danh mục còn sản phẩm, không thể xóa.",
      422
    );
  }
  await categoryRepo.softDeleteCategory(id);
}
