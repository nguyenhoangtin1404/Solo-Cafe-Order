import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";

export async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  if (user.app_metadata?.role !== "admin") {
    throw new AppError("FORBIDDEN", "Insufficient permissions", 403);
  }

  return user;
}
