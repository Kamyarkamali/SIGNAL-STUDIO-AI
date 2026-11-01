import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProjectError } from "./project-service.ts";
import { REQUEST_MAX_BYTES } from "./project-schema.ts";
export { assertLocalRequest } from "./request-origin.ts";

export async function readJson<T>(request: NextRequest, schema: z.ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ProjectError("CONTENT_TYPE", "درخواست JSON لازم است.", 415);
  const size = Number(request.headers.get("content-length"));
  if (size > REQUEST_MAX_BYTES) throw new ProjectError("TOO_LARGE", "درخواست بیش از حد بزرگ است.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ProjectError("EMPTY_BODY", "دادهٔ درخواست خالی است.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > REQUEST_MAX_BYTES) { await reader.cancel(); throw new ProjectError("TOO_LARGE", "درخواست بیش از حد بزرگ است.", 413); }
    chunks.push(value);
  }
  let payload: unknown;
  try { payload = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))); }
  catch { throw new ProjectError("INVALID_JSON", "دادهٔ JSON نامعتبر است."); }
  const result = schema.safeParse(payload);
  if (!result.success) throw new ProjectError("VALIDATION", result.error.issues[0]?.message || "دادهٔ درخواست نامعتبر است.");
  return result.data;
}

export function apiError(error: unknown) {
  if (error instanceof ProjectError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  console.error("Project operation failed", error);
  return NextResponse.json({ error: { code: "INTERNAL", message: "انجام عملیات ممکن نشد. دوباره تلاش کنید." } }, { status: 500 });
}
