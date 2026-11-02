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
    if (!asset || asset.kind !== "character-model") throw new ProjectError("NOT_FOUND", "مدل سه‌بعدی پیدا نشد.", 404);
    const bytes = await readFile(await projectService.resolveAssetFile(id, asset));
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "model/gltf-binary", "Content-Length": String(bytes.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    const { id, assetId } = await context.params;
    return Response.json(await projectService.removeCharacterModel(id, assetId));
  } catch (error) { return apiError(error); }
}
