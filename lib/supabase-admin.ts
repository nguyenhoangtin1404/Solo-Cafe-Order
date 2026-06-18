import "server-only";
/**
 * DANGER: Client này bypass RLS hoàn toàn.
 * Chỉ import file này trong Route Handlers (app/api/**) — KHÔNG dùng trong Server Components.
 * Mọi query qua client này có quyền đọc/ghi toàn bộ DB không qua policy.
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
