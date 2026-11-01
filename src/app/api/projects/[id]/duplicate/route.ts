import { NextRequest, NextResponse } from "next/server";
import { assertLocalRequest, apiError } from "@/lib/projects/api";
import { projectService } from "@/lib/projects/project-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    assertLocalRequest(request, true);
    return NextResponse.json(await projectService.duplicate((await context.params).id), { status: 201 });
  } catch (error) { return apiError(error); }
}
