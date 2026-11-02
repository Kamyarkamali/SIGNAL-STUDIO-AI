import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRODUCTION_CAMERA, EDITOR_CAMERA, productionCameraSchema } from "../src/components/viewport/camera-config.ts";
import { hasWebGL, watchContextLoss } from "../src/components/viewport/webgl-support.ts";
import { readFile } from "node:fs/promises";

test("camera defaults are safe and production data stays serializable", () => {
  assert.equal(productionCameraSchema.safeParse(DEFAULT_PRODUCTION_CAMERA).success, true);
  assert.ok(EDITOR_CAMERA.minDistance > EDITOR_CAMERA.near);
  assert.ok(EDITOR_CAMERA.maxDistance < EDITOR_CAMERA.far);
  assert.notDeepEqual(EDITOR_CAMERA.position, EDITOR_CAMERA.target);
  assert.deepEqual(JSON.parse(JSON.stringify(DEFAULT_PRODUCTION_CAMERA)), DEFAULT_PRODUCTION_CAMERA);
});

test("camera validation rejects unsafe or non-serializable poses", () => {
  for (const invalid of [
    { ...DEFAULT_PRODUCTION_CAMERA, position: DEFAULT_PRODUCTION_CAMERA.target },
    { ...DEFAULT_PRODUCTION_CAMERA, near: 10, far: 1 },
    { ...DEFAULT_PRODUCTION_CAMERA, fov: 0 },
    { ...DEFAULT_PRODUCTION_CAMERA, position: [Infinity, 0, 0] },
  ]) assert.equal(productionCameraSchema.safeParse(invalid).success, false);
});

test("WebGL probe reports unavailable contexts and initialization errors", () => {
  assert.equal(hasWebGL(() => ({ getContext: () => null })), false);
  assert.equal(hasWebGL(() => { throw new Error("blocked"); }), false);
  assert.equal(hasWebGL(() => ({ getContext: (kind) => kind === "webgl" ? {} : null })), true);
});

test("context-loss listener signals failure and is removed on cleanup", () => {
  const canvas = new EventTarget();
  let failures = 0;
  const cleanup = watchContextLoss(canvas, () => { failures += 1; });
  const first = new Event("webglcontextlost", { cancelable: true });
  canvas.dispatchEvent(first);
  assert.equal(first.defaultPrevented, true);
  assert.equal(failures, 1);
  cleanup();
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  assert.equal(failures, 1);
});

test("viewport keeps camera modes and secondary actions accessible without remounting the canvas", async () => {
  const viewport = await readFile(new URL("../src/components/viewport/studio-viewport.tsx", import.meta.url), "utf8");
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const scenePanel = await readFile(new URL("../src/components/scenes/scene-configuration-panel.tsx", import.meta.url), "utf8");
  assert.match(viewport, /aria-label="حالت نمایش دوربین"/);
  assert.match(viewport, /onProductionCameraPreviewChange\(true\)/);
  assert.match(viewport, /onProductionCameraPreviewChange\(false\)/);
  assert.match(viewport, /<details className="viewport-tool-more"/);
  assert.match(viewport, /onSaveProductionCamera/);
  assert.match(viewport, /<SceneCanvas/);
  assert.match(shell, /await projects\.saveNow\(\)/);
  assert.match(shell, /if \(productionCameraPreview \|\| inspectPropId\)/);
  assert.match(scenePanel, /disabled=\{!previewing && inspectionActive\}/);
});
