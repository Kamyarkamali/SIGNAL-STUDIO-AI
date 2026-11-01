import { NextRequest, NextResponse } from "next/server";
import { assertLocalRequest, apiError, readJson } from "@/lib/projects/api";
import { deleteInputSchema, saveInputSchema } from "@/lib/projects/project-schema";
import { projectService } from "@/lib/projects/project-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try { assertLocalRequest(request); return NextResponse.json(await projectService.open((await context.params).id)); }
  catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    const { title, expectedRevision, environmentArrangement } = await readJson(request, saveInputSchema);
    return NextResponse.json(await projectService.save((await context.params).id, title, expectedRevision, environmentArrangement));
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    const { expectedRevision } = await readJson(request, deleteInputSchema);
    await projectService.delete((await context.params).id, expectedRevision);
    return NextResponse.json({ deleted: true });
  } catch (error) { return apiError(error); }
}
