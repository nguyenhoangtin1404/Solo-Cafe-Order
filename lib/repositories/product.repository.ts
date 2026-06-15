import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import type { Product, ProductWithOptions } from "@/types/product";
import type { ProductOption, ProductOptionValue } from "@/types/product";

// Raw shape returned from Supabase join — options/values may include deleted rows
type RawProductRow = Omit<ProductWithOptions, "options"> & {
  options: Array<
    ProductOption & {
      values: ProductOptionValue[];
    }
  >;
};

function filterDeletedNested(raw: RawProductRow): ProductWithOptions {
  return {
    ...raw,
    options: raw.options
      .filter((o) => o.deleted_at === null)
      .map((o) => ({
        ...o,
        values: o.values.filter((v) => v.deleted_at === null),
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
