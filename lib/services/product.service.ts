import type { Category, Product, ProductWithOptions } from "@/types/product";
import { AppError } from "@/lib/errors";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validators";
import * as categoryRepo from "@/lib/repositories/category.repository";
import * as productRepo from "@/lib/repositories/product.repository";
import { sanitizeText } from "@/lib/utils/sanitize";

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
  | "id"
  | "category_id"
  | "name"
  | "description"
  | "price"
  | "image_url"
  | "is_available"
>;

export type AdminCategoryGroup = {
  category: Category;
  products: AdminProduct[];
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const products = await productRepo.findAllForAdminFlat();
  return products.map(
    ({
      id,
      category_id,
      name,
      description,
      price,
      image_url,
      is_available,
    }) => ({
      id,
      category_id,
      name,
      description,
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

function toAdminProduct(p: Product): AdminProduct {
  return {
    id: p.id,
    category_id: p.category_id,
    name: p.name,
    description: p.description,
    price: p.price,
    image_url: p.image_url,
    is_available: p.is_available,
  };
}

export async function createProduct(
  data: CreateProductInput
): Promise<AdminProduct> {
  const category = await categoryRepo.findCategoryById(data.category_id);
  if (!category) {
    throw new AppError("CATEGORY_NOT_FOUND", "Danh mục không tồn tại.", 404);
  }
  const product = await productRepo.createProduct({
    ...data,
    name: sanitizeText(data.name, 100),
    description: data.description
      ? sanitizeText(data.description, 500) || null
      : data.description,
  });
  return toAdminProduct(product);
}

export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<AdminProduct> {
  if (data.category_id !== undefined) {
    const category = await categoryRepo.findCategoryById(data.category_id);
    if (!category) {
      throw new AppError("CATEGORY_NOT_FOUND", "Danh mục không tồn tại.", 404);
    }
  }
  const product = await productRepo.updateProduct(id, {
    ...data,
    ...(data.name !== undefined && { name: sanitizeText(data.name, 100) }),
    ...(data.description !== undefined && {
      description:
        data.description !== null
          ? sanitizeText(data.description, 500) || null
          : null,
    }),
  });
  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại.", 404);
  }
  return toAdminProduct(product);
}

export async function deleteProduct(
  id: string
): Promise<{ id: string; deleted_at: string }> {
  const result = await productRepo.softDeleteProduct(id);
  if (!result) {
    throw new AppError("PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại.", 404);
  }
  return result;
}
