import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";

export async function signIn(email: string, password: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Generic message — never reveal whether email exists
    throw new AppError("UNAUTHORIZED", "Email hoặc mật khẩu không đúng.", 401);
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError("INTERNAL_ERROR", error.message, 500);
  }
}
