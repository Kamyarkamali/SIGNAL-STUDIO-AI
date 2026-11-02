import { NextRequest, NextResponse } from "next/server";
import { assertLocalRequest, apiError } from "@/lib/projects/api";
import { ProjectError, projectService } from "@/lib/projects/project-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    if (Number(request.headers.get("content-length")) > 65 * 1024 * 1024) throw new ProjectError("TOO_LARGE", "حجم فایل صوتی از حد مجاز بیشتر است.", 413);
    const form = await request.formData();
    const file = form.get("file");
    const duration = Number(form.get("durationSeconds"));
    if (!(file instanceof File) || file.size > 64 * 1024 * 1024) throw new ProjectError("INVALID_AUDIO", "فایل صوتی معتبر نیست یا بیش از ۶۴ مگابایت است.", 415);
    const project = await projectService.importAudioAsset((await context.params).id, file.name, file.type, duration, new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json(project, { status: 201 });
  } catch (error) { return apiError(error); }
}
