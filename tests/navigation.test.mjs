import test from "node:test";
import assert from "node:assert/strict";
import { navigationItems } from "../src/config/navigation.ts";

test("every Phase 01 destination has a distinct Persian label and stable ID", () => {
  const required = ["projects", "scenes", "characters", "environments", "audio", "dialogue", "behaviors", "camera", "settings", "export"];
  assert.deepEqual(navigationItems.map(({ id }) => id), required);
  assert.equal(new Set(navigationItems.map(({ label }) => label)).size, required.length);
  assert.ok(navigationItems.every(({ label, phase }) => label.length > 1 && phase.startsWith("فاز")));
});
