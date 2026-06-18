import { type NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/requireOwner";
import { errorResponse, handleRouteError } from "@/lib/errors";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/constants";

const ALLOWED_TYPES = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);
const MAX_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const BUCKET = "product-images";

const MAGIC: Partial<Record<string, (b: Uint8Array) => boolean>> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/webp": (b) =>
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50,
};

async function checkMagicBytes(file: File): Promise<boolean> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  return MAGIC[file.type]?.(buf) ?? false;
}

function extFor(mime: string): string {
  return mime.split("/")[1]!.replace("jpeg", "jpg");
}

export async function POST(req: NextRequest) {
  try {
    await requireOwner();

    const cl = Number(req.headers.get("content-length") ?? NaN);
    if (!Number.isNaN(cl) && cl > MAX_BYTES) {
      return errorResponse("VALIDATION_ERROR", "File không được vượt quá 2MB.", 400);
    }

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
    if (file.size === 0 || file.size > MAX_BYTES) {
      return errorResponse(
        "VALIDATION_ERROR",
        "File không được vượt quá 2MB.",
        400
      );
    }
    if (!(await checkMagicBytes(file))) {
      return errorResponse("VALIDATION_ERROR", "File không hợp lệ.", 400);
    }

    const path = `${crypto.randomUUID()}.${extFor(file.type)}`;
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

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
