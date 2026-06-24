import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError("INTERNAL_ERROR", error.message, 500);
  }
}
