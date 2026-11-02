import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";
import { assertLocalRequest, apiError } from "@/lib/projects/api";
import { ProjectError, projectService } from "@/lib/projects/project-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string; assetId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request);
    const { id, assetId } = await context.params;
    const project = await projectService.open(id);
    const asset = project.assetManifest[assetId];
    if (!asset || asset.kind !== "audio") throw new ProjectError("NOT_FOUND", "فایل صوتی پیدا نشد.", 404);
    const bytes = await readFile(await projectService.resolveAssetFile(id, asset));
    const range = request.headers.get("range");
    const match = range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range && !match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.length}` } });
    const start = match ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : bytes.length - 1;
    if (start >= bytes.length || end >= bytes.length || end < start) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.length}` } });
    const chunk = bytes.subarray(start, end + 1);
    return new Response(new Uint8Array(chunk), { status: match ? 206 : 200, headers: {
      "Content-Type": asset.mediaType, "Content-Length": String(chunk.length), "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      ...(match ? { "Content-Range": `bytes ${start}-${end}/${bytes.length}` } : {}),
    } });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    const { id, assetId } = await context.params;
    return Response.json(await projectService.removeAudioAsset(id, assetId));
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    if (Number(request.headers.get("content-length")) > 65 * 1024 * 1024) throw new ProjectError("TOO_LARGE", "حجم فایل صوتی از حد مجاز بیشتر است.", 413);
    const form = await request.formData();
    const file = form.get("file");
    const duration = Number(form.get("durationSeconds"));
    if (!(file instanceof File) || file.size > 64 * 1024 * 1024) throw new ProjectError("INVALID_AUDIO", "فایل صوتی معتبر نیست یا بیش از ۶۴ مگابایت است.", 415);
    const { id, assetId } = await context.params;
    return Response.json(await projectService.replaceAudioAsset(id, assetId, file.name, file.type, duration, new Uint8Array(await file.arrayBuffer())));
  } catch (error) { return apiError(error); }
}
