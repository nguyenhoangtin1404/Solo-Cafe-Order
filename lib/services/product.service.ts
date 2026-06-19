import type {
  Category,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductWithOptions,
} from "@/types/product";
import { AppError } from "@/lib/errors";
import type {
  CreateProductInput,
  CreateProductOptionInput,
  CreateProductOptionValueInput,
  UpdateProductInput,
  UpdateProductOptionInput,
  UpdateProductOptionValueInput,
} from "@/lib/validators";
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
  const sanitizedName = sanitizeText(data.name, 100);
  if (!sanitizedName) {
    throw new AppError("VALIDATION_ERROR", "Tên sản phẩm không hợp lệ.", 400);
  }
  const product = await productRepo.createProduct({
    ...data,
    name: sanitizedName,
    description: data.description
      ? sanitizeText(data.description, 500) || null
      : data.description,
    ...(data.image_url !== undefined && {
      image_url:
        data.image_url !== null ? data.image_url.replace(/\0/g, "") : null,
    }),
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
  const sanitizedName =
    data.name !== undefined ? sanitizeText(data.name, 100) : undefined;
  if (sanitizedName !== undefined && !sanitizedName) {
    throw new AppError("VALIDATION_ERROR", "Tên sản phẩm không hợp lệ.", 400);
  }
  const product = await productRepo.updateProduct(id, {
    ...data,
    ...(sanitizedName !== undefined && { name: sanitizedName }),
    ...(data.description !== undefined && {
      description:
        data.description !== null
          ? sanitizeText(data.description, 500) || null
          : null,
    }),
    ...(data.image_url !== undefined && {
      image_url:
        data.image_url !== null ? data.image_url.replace(/\0/g, "") : null,
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

// ── Product Options ───────────────────────────────────────────────────────────

export async function createOption(
  productId: string,
  data: CreateProductOptionInput
): Promise<ProductOption> {
  const product = await productRepo.findByIdWithOptions(productId);
  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại.", 404);
  }
  const sanitizedName = sanitizeText(data.name, 50);
  if (!sanitizedName) {
    throw new AppError("VALIDATION_ERROR", "Tên option không hợp lệ.", 400);
  }
  return productRepo.createProductOption(productId, {
    ...data,
    name: sanitizedName,
  });
}

export async function updateOption(
  productId: string,
  optionId: string,
  data: UpdateProductOptionInput
): Promise<ProductOption> {
  const sanitizedName =
    data.name !== undefined ? sanitizeText(data.name, 50) : undefined;
  if (sanitizedName !== undefined && !sanitizedName) {
    throw new AppError("VALIDATION_ERROR", "Tên option không hợp lệ.", 400);
  }
  const result = await productRepo.updateProductOption(optionId, productId, {
    ...data,
    ...(sanitizedName !== undefined && { name: sanitizedName }),
  });
  if (!result) {
    throw new AppError("OPTION_NOT_FOUND", "Option không tồn tại.", 404);
  }
  return result;
}

export async function deleteOption(
  productId: string,
  optionId: string
): Promise<{ id: string; deleted_at: string }> {
  await productRepo.softDeleteOptionValuesByOptionId(optionId);
  const result = await productRepo.softDeleteProductOption(optionId, productId);
  if (!result) {
    throw new AppError("OPTION_NOT_FOUND", "Option không tồn tại.", 404);
  }
  return result;
}

// ── Product Option Values ─────────────────────────────────────────────────────

async function requireOption(
  productId: string,
  optionId: string
): Promise<void> {
  const product = await productRepo.findByIdWithOptions(productId);
  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", "Sản phẩm không tồn tại.", 404);
  }
  const option = product.options.find((o) => o.id === optionId);
  if (!option) {
    throw new AppError("OPTION_NOT_FOUND", "Option không tồn tại.", 404);
  }
}

export async function createOptionValue(
  productId: string,
  optionId: string,
  data: CreateProductOptionValueInput
): Promise<ProductOptionValue> {
  await requireOption(productId, optionId);
  const sanitizedName = sanitizeText(data.name, 50);
  if (!sanitizedName) {
    throw new AppError("VALIDATION_ERROR", "Tên value không hợp lệ.", 400);
  }
  return productRepo.createProductOptionValue(optionId, {
    ...data,
    name: sanitizedName,
  });
}

export async function updateOptionValue(
  productId: string,
  optionId: string,
  valueId: string,
  data: UpdateProductOptionValueInput
): Promise<ProductOptionValue> {
  await requireOption(productId, optionId);
  const sanitizedName =
    data.name !== undefined ? sanitizeText(data.name, 50) : undefined;
  if (sanitizedName !== undefined && !sanitizedName) {
    throw new AppError("VALIDATION_ERROR", "Tên value không hợp lệ.", 400);
  }
  const result = await productRepo.updateProductOptionValue(valueId, optionId, {
    ...data,
    ...(sanitizedName !== undefined && { name: sanitizedName }),
  });
  if (!result) {
    throw new AppError("VALUE_NOT_FOUND", "Value không tồn tại.", 404);
  }
  return result;
}

export async function deleteOptionValue(
  productId: string,
  optionId: string,
  valueId: string
): Promise<{ id: string; deleted_at: string }> {
  await requireOption(productId, optionId);
  const result = await productRepo.softDeleteProductOptionValue(
    valueId,
    optionId
  );
  if (!result) {
    throw new AppError("VALUE_NOT_FOUND", "Value không tồn tại.", 404);
  }
  return result;
}
