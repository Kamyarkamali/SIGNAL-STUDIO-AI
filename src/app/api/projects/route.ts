import { NextRequest, NextResponse } from "next/server";
import { assertLocalRequest, apiError, readJson } from "@/lib/projects/api";
import { createInputSchema } from "@/lib/projects/project-schema";
import { projectService } from "@/lib/projects/project-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try { assertLocalRequest(request); return NextResponse.json(await projectService.list()); }
  catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertLocalRequest(request, true);
    const { title } = await readJson(request, createInputSchema);
    return NextResponse.json(await projectService.create(title), { status: 201 });
  } catch (error) { return apiError(error); }
}
