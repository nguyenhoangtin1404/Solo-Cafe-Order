import { type NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const BUCKET = "product-images";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  try {
    await requireOwner();

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Request phải là multipart/form-data.",
        400
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("VALIDATION_ERROR", "Field 'file' bị thiếu.", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Chỉ chấp nhận JPG, PNG, WebP.",
        400
      );
    }

    if (file.size > MAX_BYTES) {
      return errorResponse(
        "VALIDATION_ERROR",
        "File không được vượt quá 2MB.",
        400
      );
    }

    const ext = EXT[file.type];
    const path = `${crypto.randomUUID()}.${ext}`;

    const supabase = createAdminSupabaseClient();
    const buffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error("[upload] storage error", error);
      return errorResponse("INTERNAL_ERROR", "Upload thất bại.", 500);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return Response.json({ url: publicUrl }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
