import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import type { Product, ProductWithOptions } from "@/types/product";
import type { ProductOption, ProductOptionValue } from "@/types/product";

// Raw shape returned from Supabase join — includes deleted_at for in-memory filtering
type RawOptionValue = ProductOptionValue & { deleted_at: string | null };
type RawOption = ProductOption & { deleted_at: string | null; values: RawOptionValue[] };
type RawProductRow = Omit<ProductWithOptions, "options"> & { options: RawOption[] };

function filterDeletedNested(raw: RawProductRow): ProductWithOptions {
  return {
    ...raw,
    options: raw.options
      .filter((o) => o.deleted_at === null)
      .map(({ id, product_id, name, type, values }) => ({
        id, product_id, name, type,
        values: values
          .filter((v) => v.deleted_at === null)
          .map(({ id: vid, option_id, name: vname, extra_price }) => ({
            id: vid, option_id, name: vname, extra_price,
          })),
      })),
  };
}

const WITH_OPTIONS = `*, options:product_options(*, values:product_option_values(*))`;

export async function findAllAvailable(): Promise<ProductWithOptions[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(WITH_OPTIONS)
    .eq("is_available", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as RawProductRow[]).map(filterDeletedNested);
}

export async function findAllForAdmin(): Promise<ProductWithOptions[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(WITH_OPTIONS)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as RawProductRow[]).map(filterDeletedNested);
}

export async function findAllForAdminFlat(): Promise<Product[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, category_id, name, description, price, image_url, is_available, created_at, deleted_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function findProductById(
  id: string
): Promise<{ id: string } | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: false })
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data as { id: string } | null) ?? null;
}

export async function findByIdWithOptions(
  id: string
): Promise<ProductWithOptions | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(WITH_OPTIONS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return filterDeletedNested(data as unknown as RawProductRow);
}

export async function findByIdsWithOptions(
  ids: string[]
): Promise<ProductWithOptions[]> {
  if (ids.length === 0) return [];
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(WITH_OPTIONS)
    .in("id", ids)
    .is("deleted_at", null);

  if (error) throw error;
  return (data as unknown as RawProductRow[]).map(filterDeletedNested);
}

export async function updateAvailability(
  id: string,
  isAvailable: boolean
): Promise<{ id: string; is_available: boolean } | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, is_available")
    .maybeSingle();

  if (error) throw error;
  return (data as { id: string; is_available: boolean } | null) ?? null;
}

export async function countActiveByCategory(
  categoryId: string
): Promise<number> {
  const supabase = createAdminSupabaseClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function createProduct(data: {
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  is_available: boolean;
  image_url?: string | null;
}): Promise<Product> {
  const supabase = createAdminSupabaseClient();
  const { data: row, error } = await supabase
    .from("products")
    .insert(data)
    .select(
      "id, category_id, name, description, price, image_url, is_available, created_at, deleted_at"
    )
    .single();

  if (error) throw error;
  return row as Product;
}

type ProductUpdateFields = {
  category_id?: string;
  name?: string;
  description?: string | null;
  price?: number;
  is_available?: boolean;
  image_url?: string | null;
};

export async function updateProduct(
  id: string,
  fields: ProductUpdateFields
): Promise<Product | null> {
  // Only send defined fields — omitted keys stay unchanged in DB
  const patch = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(patch).length === 0) return null;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select(
      "id, category_id, name, description, price, image_url, is_available, created_at, deleted_at"
    )
    .maybeSingle();

  if (error) throw error;
  return (data as Product | null) ?? null;
}

export async function softDeleteProduct(
  id: string
): Promise<{ id: string; deleted_at: string } | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, deleted_at")
    .maybeSingle();

  if (error) throw error;
  return (data as { id: string; deleted_at: string } | null) ?? null;
}

// ── Product Options ───────────────────────────────────────────────────────────

export async function findOptionsByProductId(
  productId: string
): Promise<Array<ProductOption & { values: ProductOptionValue[] }>> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_options")
    .select(
      "id, product_id, name, type, values:product_option_values(id, option_id, name, extra_price, deleted_at)"
    )
    .eq("product_id", productId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as Array<ProductOption & { values: (ProductOptionValue & { deleted_at: string | null })[] }>).map((o) => ({
    ...o,
    values: o.values
      .filter((v) => v.deleted_at === null)
      .map(({ id, option_id, name, extra_price }) => ({ id, option_id, name, extra_price })),
  }));
}

export async function findProductOptionById(
  optionId: string,
  productId: string
): Promise<ProductOption | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_options")
    .select("id, product_id, name, type")
    .eq("id", optionId)
    .eq("product_id", productId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data as ProductOption | null) ?? null;
}

export async function createProductOption(
  productId: string,
  data: { name: string; type: "select" | "multi" }
): Promise<ProductOption> {
  const supabase = createAdminSupabaseClient();
  const { data: row, error } = await supabase
    .from("product_options")
    .insert({ product_id: productId, ...data })
    .select("id, product_id, name, type")
    .single();

  if (error) throw error;
  return row as ProductOption;
}

export async function updateProductOption(
  optionId: string,
  productId: string,
  fields: { name?: string; type?: "select" | "multi" }
): Promise<ProductOption | null> {
  const patch = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(patch).length === 0) return null;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_options")
    .update(patch)
    .eq("id", optionId)
    .eq("product_id", productId)
    .is("deleted_at", null)
    .select("id, product_id, name, type")
    .maybeSingle();

  if (error) throw error;
  return (data as ProductOption | null) ?? null;
}

export async function softDeleteProductOption(
  optionId: string,
  productId: string
): Promise<{ id: string; deleted_at: string } | null> {
  const now = new Date().toISOString();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_options")
    .update({ deleted_at: now })
    .eq("id", optionId)
    .eq("product_id", productId)
    .is("deleted_at", null)
    .select("id, deleted_at")
    .maybeSingle();

  if (error) throw error;
  return (data as { id: string; deleted_at: string } | null) ?? null;
}

export async function softDeleteOptionsByProductId(
  productId: string
): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_options")
    .update({ deleted_at: new Date().toISOString() })
    .eq("product_id", productId)
    .is("deleted_at", null)
    .select("id");

  if (error) throw error;
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

export async function softDeleteOptionValuesByOptionIds(
  optionIds: string[]
): Promise<void> {
  if (optionIds.length === 0) return;
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("product_option_values")
    .update({ deleted_at: new Date().toISOString() })
    .in("option_id", optionIds)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function softDeleteOptionValuesByOptionId(
  optionId: string,
  productId: string
): Promise<void> {
  const supabase = createAdminSupabaseClient();
  // Verify ownership without filtering deleted_at — the option may already be
  // soft-deleted by the time this runs (deleteOption soft-deletes parent first).
  const { data: option } = await supabase
    .from("product_options")
    .select("id")
    .eq("id", optionId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!option) return;

  const { error } = await supabase
    .from("product_option_values")
    .update({ deleted_at: new Date().toISOString() })
    .eq("option_id", optionId)
    .is("deleted_at", null);

  if (error) throw error;
}

// ── Product Option Values ─────────────────────────────────────────────────────

export async function createProductOptionValue(
  optionId: string,
  data: { name: string; extra_price: number }
): Promise<ProductOptionValue> {
  const supabase = createAdminSupabaseClient();
  const { data: row, error } = await supabase
    .from("product_option_values")
    .insert({ option_id: optionId, ...data })
    .select("id, option_id, name, extra_price")
    .single();

  if (error) throw error;
  return row as ProductOptionValue;
}

export async function updateProductOptionValue(
  valueId: string,
  optionId: string,
  fields: { name?: string; extra_price?: number }
): Promise<ProductOptionValue | null> {
  const patch = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(patch).length === 0) return null;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_option_values")
    .update(patch)
    .eq("id", valueId)
    .eq("option_id", optionId)
    .is("deleted_at", null)
    .select("id, option_id, name, extra_price")
    .maybeSingle();

  if (error) throw error;
  return (data as ProductOptionValue | null) ?? null;
}

export async function softDeleteProductOptionValue(
  valueId: string,
  optionId: string
): Promise<{ id: string; deleted_at: string } | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("product_option_values")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", valueId)
    .eq("option_id", optionId)
    .is("deleted_at", null)
    .select("id, deleted_at")
    .maybeSingle();

  if (error) throw error;
  return (data as { id: string; deleted_at: string } | null) ?? null;
}
