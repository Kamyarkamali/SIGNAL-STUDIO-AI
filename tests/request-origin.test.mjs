import assert from "node:assert/strict";
import { test } from "node:test";
import { assertLocalRequest } from "../src/lib/projects/request-origin.ts";

function request(host, origin, canonicalOrigin = "http://localhost:3000") {
  const headers = new Headers({ host, "sec-fetch-site": origin ? "same-origin" : "none" });
  if (origin) headers.set("origin", origin);
  return { headers, nextUrl: new URL(canonicalOrigin) };
}

test("accepts browser same-origin POST when Next.js canonicalizes 127.0.0.1 to localhost", () => {
  assert.doesNotThrow(() => assertLocalRequest(request("127.0.0.1:3000", "http://127.0.0.1:3000"), true));
  assert.doesNotThrow(() => assertLocalRequest(request("localhost:3000", "http://localhost:3000"), true));
  assert.doesNotThrow(() => assertLocalRequest(request("127.0.0.1:3102", null, "http://localhost:3102"), true));
});

test("rejects cross-origin POST and untrusted Host without opening the local API", () => {
  assert.throws(() => assertLocalRequest(request("127.0.0.1:3000", "http://evil.example"), true), { code: "ORIGIN", status: 403 });
  assert.throws(() => assertLocalRequest(request("127.0.0.1:3000", "http://localhost:3000"), true), { code: "ORIGIN", status: 403 });
  assert.throws(() => assertLocalRequest(request("evil.example:3000", "http://evil.example:3000"), true), { code: "LOCAL_ONLY", status: 403 });
  assert.throws(() => assertLocalRequest(request("127.0.0.1:3102", "http://127.0.0.1:3102"), true), { code: "LOCAL_ONLY", status: 403 });
});
