import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { focusCameraPose, freeFlyStep } from "../src/lib/camera/editor-navigation.ts";

test("focus framing centers real target bounds and respects a known front direction", () => {
  const pose = focusCameraPose({ center: [1, 1.5, 0], size: [0.8, 0.7, 0.6], currentPosition: [0, 1, 8],
    fovDegrees: 48, aspect: 16 / 9, preferredFront: [0, 0, 1] });
  assert.deepEqual(pose.target, [1, 1.5, 0]);
  assert.ok(pose.position[2] > pose.target[2], "camera is in front of a +Z-facing character");
  assert.ok(Math.hypot(pose.position[0] - 1, pose.position[1] - 1.5, pose.position[2]) > 0.75);
  const portrait = focusCameraPose({ center: [0, 0, 0], size: [5, 1, 0.2], currentPosition: [0, 0, 5], fovDegrees: 48, aspect: 9 / 16 });
  assert.ok(Math.hypot(...portrait.position) > Math.hypot(...pose.position), "narrow framing backs away enough to fit wide bounds");
});

test("free-fly movement supports horizontal, vertical, speed and bounded time steps", () => {
  const input = { position: [0, 0, 0], forward: [0, 0, -1], right: [1, 0, 0], deltaSeconds: 0.1, speed: 2 };
  assert.deepEqual(freeFlyStep({ ...input, keys: new Set(["KeyW", "KeyD", "KeyE"]) }), [0.1, 0.1, -0.1]);
  const fast = freeFlyStep({ ...input, keys: new Set(["KeyW"]), fast: true });
  assert.ok(Math.abs(fast[2] + 0.3) < 1e-12);
  assert.deepEqual(freeFlyStep({ ...input, deltaSeconds: 2, keys: new Set(["KeyQ"]) }), [0, -0.1, 0]);
});

test("free-fly inputs require pointer lock, ignore text fields, and clean up listeners without editing production data", async () => {
  const canvas = await readFile(new URL("../src/components/viewport/scene-canvas.tsx", import.meta.url), "utf8");
  const viewport = await readFile(new URL("../src/components/viewport/studio-viewport.tsx", import.meta.url), "utf8");
  assert.match(canvas, /document\.pointerLockElement !== canvas/);
  assert.match(canvas, /isTextEntry\(event\.target\)/);
  assert.match(canvas, /removeEventListener\("pointerlockchange"/);
  assert.match(canvas, /removeEventListener\("keydown"/);
  assert.match(canvas, /removeEventListener\("pointermove"/);
  assert.match(viewport, /focusTargetId = selectedCharacterId \?\? selectedId/);
  assert.match(viewport, /onProductionCameraPreviewChange\(true\)/);
  assert.match(viewport, /setFocusRequest\(\(value\) => value \+ 1\)/);
  assert.match(viewport, /onSaveProductionCamera/);
  assert.match(viewport, /Escape/);
});
