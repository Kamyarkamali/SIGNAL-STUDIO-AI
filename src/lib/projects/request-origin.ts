import type { NextRequest } from "next/server";
import { ProjectError } from "./project-service.ts";

type LocalRequest = Pick<NextRequest, "headers" | "nextUrl">;

export function assertLocalRequest(request: LocalRequest, write = false) {
  // Next.js may normalize nextUrl.origin to localhost in development even when
  // the browser addressed 127.0.0.1. The received Host remains authoritative.
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (!/^(?:localhost|127\.0\.0\.1)(?::[1-9]\d{0,4})?$/.test(host)) {
    throw new ProjectError("LOCAL_ONLY", "این سرویس فقط روی همین دستگاه در دسترس است.", 403);
  }
  const localUrl = new URL(`${request.nextUrl.protocol}//${host}`);
  if (localUrl.port !== request.nextUrl.port) {
    throw new ProjectError("LOCAL_ONLY", "درگاه درخواست با سرور محلی سازگار نیست.", 403);
  }
  const origin = request.headers.get("origin");
  if (write && origin) {
    try {
      const source = new URL(origin);
      if (source.protocol !== request.nextUrl.protocol || source.host.toLowerCase() !== host)
        throw new ProjectError("ORIGIN", "مبدأ درخواست مجاز نیست.", 403);
    } catch { throw new ProjectError("ORIGIN", "مبدأ درخواست مجاز نیست.", 403); }
  }
}
