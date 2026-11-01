import { NextRequest, NextResponse } from "next/server";
import { assertLocalRequest, apiError } from "@/lib/projects/api";
import { ProjectError, projectService } from "@/lib/projects/project-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    if (Number(request.headers.get("content-length")) > 65 * 1024 * 1024) throw new ProjectError("TOO_LARGE", "حجم رسانه بیش از حد مجاز است.", 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 64 * 1024 * 1024) throw new ProjectError("INVALID_MEDIA", "فایل رسانه معتبر نیست.", 415);
    const updated = await projectService.importDisplayAsset((await context.params).id, file.name, file.type, new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json(updated, { status: 201 });
  } catch (error) { return apiError(error); }
}
