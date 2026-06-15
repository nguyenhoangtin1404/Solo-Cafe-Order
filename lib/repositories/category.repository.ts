import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import type { Category } from "@/types/product";

export async function findAllCategories(): Promise<Category[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function findCategoryById(id: string): Promise<Category | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data as Category | null) ?? null;
}

export async function createCategory(
  name: string,
  sortOrder: number
): Promise<Category> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder })
    .select("*")
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  fields: { name?: string; sort_order?: number }
): Promise<Category | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .update(fields)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as Category | null) ?? null;
}

export async function softDeleteCategory(id: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}
