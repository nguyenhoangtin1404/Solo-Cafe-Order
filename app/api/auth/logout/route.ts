import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
