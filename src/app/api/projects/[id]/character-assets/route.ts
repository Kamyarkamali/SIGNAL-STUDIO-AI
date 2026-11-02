import { NextRequest, NextResponse } from "next/server";
import { assertLocalRequest, apiError } from "@/lib/projects/api";
import { ProjectError, projectService } from "@/lib/projects/project-service";
import type { CharacterGlbMetadata } from "@/lib/characters/character-glb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    const contentLength = Number(request.headers.get("content-length"));
    if (!Number.isSafeInteger(contentLength) || contentLength <= 0) throw new ProjectError("INVALID_LENGTH", "اندازهٔ درخواست بارگذاری مشخص نیست.", 411);
    if (contentLength > 65 * 1024 * 1024) throw new ProjectError("TOO_LARGE", "حجم فایل مدل بیش از ۶۴ مگابایت است.", 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".glb") || file.size > 64 * 1024 * 1024) {
      throw new ProjectError("INVALID_MODEL", "فقط فایل GLB با حجم حداکثر ۶۴ مگابایت پذیرفته می‌شود.", 415);
    }
    let inspection: CharacterGlbMetadata;
    try { inspection = JSON.parse(String(form.get("inspection"))) as CharacterGlbMetadata; }
    catch { throw new ProjectError("INVALID_MODEL", "اطلاعات بررسی مدل معتبر نیست.", 422); }
    const updated = await projectService.importCharacterModel((await context.params).id, {
      name: String(form.get("name") ?? ""), heightMeters: Number(form.get("heightMeters")),
      rotationRadians: Number(form.get("rotationRadians")), seatingOffsetY: Number(form.get("seatingOffsetY")), inspection,
    }, new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json(updated, { status: 201 });
  } catch (error) { return apiError(error); }
}
