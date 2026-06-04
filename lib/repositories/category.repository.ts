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
