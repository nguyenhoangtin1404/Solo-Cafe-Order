import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import type { ProductWithOptions } from "@/types/product";
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
