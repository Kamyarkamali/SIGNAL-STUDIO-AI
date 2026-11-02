import test from "node:test";
import assert from "node:assert/strict";
import { defaultArrangement, updateFrameCustomization, updateSignCustomization, restoreFrameArtwork, restoreSignDesign } from "../src/lib/environments/arrangement.ts";
import { EDITOR_CAMERA } from "../src/components/viewport/camera-config.ts";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectService } from "../src/lib/projects/project-service.ts";

test("studio sign changes persist through arrangement parsing and restore to original design", () => {
  const original = defaultArrangement();
  const edited = updateSignCustomization(original, "studio-01:practical-lights", {
    design: "text", text: "Episode 12", textColor: "#ffffff", illumination: 1.4,
    transform: { position: [0.1, 0.2, 0], rotation: [0, 0.1, 0], scale: [1.1, 1, 1] },
  });
  const sign = edited.props.find((prop) => prop.id === "studio-01:practical-lights").decoration.sign;
  assert.equal(sign.text, "Episode 12");
  assert.deepEqual(sign.transform.position, [0.1, 0.2, 0]);
  assert.equal(updateSignCustomization(edited, "studio-01:practical-lights", { visible: false })
    .props.find((prop) => prop.id === "studio-01:practical-lights").decoration.sign.visible, false);
  assert.equal(restoreSignDesign(edited, "studio-01:practical-lights").props.find((prop) => prop.id === "studio-01:practical-lights").decoration, undefined);
});

test("the environment library exposes the wall sign with its editor and live renderer wired to project state", async () => {
  const definition = await readFile(new URL("../src/lib/environments/studio-01.ts", import.meta.url), "utf8");
  const panel = await readFile(new URL("../src/components/viewport/studio-decoration-editor.tsx", import.meta.url), "utf8");
  const renderer = await readFile(new URL("../src/components/viewport/environments/studio-details.tsx", import.meta.url), "utf8");
  const environment = await readFile(new URL("../src/components/viewport/environments/studio-environment.tsx", import.meta.url), "utf8");
  assert.match(definition, /تابلو دیواری و چراغ‌های دکوراتیو/);
  assert.match(panel, /updateSignCustomization\(current, propId, \{ text: event\.target\.value \}\)/);
  assert.match(panel, /updateSignCustomization\(current, propId, \{ design: "image", imageAssetId: assetId \}\)/);
  assert.match(panel, /updateSignCustomization\(current, propId, \{ fit:/);
  assert.match(panel, /restoreSignDesign\(current, propId\)/);
  assert.match(environment, /decoration=\{instance\.decoration\}/);
  assert.match(renderer, /<SignTextSurface text=\{sign\.text\} color=\{sign\.textColor\}/);
  assert.match(renderer, /<ArtworkSurface url=\{imageUrl\}/);
  assert.match(renderer, /fit=\{sign\.fit\}/);
});

test("both wall frames retain independent artwork, fit, transforms and visibility", () => {
  const imageA = "11111111-1111-4111-8111-111111111111";
  const imageB = "22222222-2222-4222-8222-222222222222";
  const initial = defaultArrangement();
  const left = updateFrameCustomization(initial, "studio-01:wall-art", 0, {
    imageAssetId: imageA, fit: "cover", visible: false,
    transform: { position: [0.2, 0, 0], rotation: [0, 0.1, 0], scale: [1.2, 1, 1] },
  });
  const both = updateFrameCustomization(left, "studio-01:wall-art", 1, { imageAssetId: imageB, fit: "contain" });
  const frames = both.props.find((prop) => prop.id === "studio-01:wall-art").decoration.frames;
  assert.equal(frames[0].imageAssetId, imageA);
  assert.equal(frames[0].fit, "cover");
  assert.equal(frames[0].visible, false);
  assert.deepEqual(frames[0].transform.position, [0.2, 0, 0]);
  assert.equal(frames[1].imageAssetId, imageB);
  const restored = restoreFrameArtwork(both, "studio-01:wall-art", 0).props.find((prop) => prop.id === "studio-01:wall-art").decoration.frames;
  assert.equal(restored[0].imageAssetId, undefined);
  assert.equal(restored[0].visible, true);
  assert.equal(restored[1].imageAssetId, imageB);
});

test("decoration and uploaded local artwork survive project save and reopen", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-decoration-"));
  try {
    const service = new ProjectService(root);
    const created = await service.create("Decoration persistence");
    const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
    const uploaded = await service.importDisplayAsset(created.id, "studio-logo.png", "image/png", bytes);
    const asset = Object.values(uploaded.assetManifest).find((item) => item.kind === "display-image");
    let arrangement = updateSignCustomization(uploaded.environmentArrangement, "studio-01:practical-lights", {
      design: "text", text: "Episode 12", textColor: "#ffffff", illumination: 1.25,
    });
    arrangement = updateSignCustomization(arrangement, "studio-01:practical-lights", {
      design: "image", imageAssetId: asset.id, fit: "cover",
    });
    arrangement = updateFrameCustomization(arrangement, "studio-01:wall-art", 1, { imageAssetId: asset.id, fit: "cover" });
    await service.save(created.id, created.title, uploaded.revision, arrangement);
    const reopened = await new ProjectService(root).open(created.id);
    const reopenedSign = reopened.environmentArrangement.props.find((prop) => prop.id === "studio-01:practical-lights").decoration.sign;
    assert.equal(reopenedSign.imageAssetId, asset.id);
    assert.equal(reopenedSign.fit, "cover");
    assert.equal(reopenedSign.text, "Episode 12");
    assert.equal(reopened.environmentArrangement.props.find((prop) => prop.id === "studio-01:wall-art").decoration.frames[1].fit, "cover");
    const restored = restoreSignDesign(reopened.environmentArrangement, "studio-01:practical-lights");
    await service.save(created.id, created.title, reopened.revision, restored);
    const defaults = await new ProjectService(root).open(created.id);
    assert.equal(defaults.environmentArrangement.props.find((prop) => prop.id === "studio-01:practical-lights").decoration, undefined);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("editor camera allows rear and side views, pan/zoom, and exposes reset control", async () => {
  assert.ok(EDITOR_CAMERA.minDistance > 0 && EDITOR_CAMERA.maxDistance > EDITOR_CAMERA.minDistance);
  const canvas = await readFile(new URL("../src/components/viewport/scene-canvas.tsx", import.meta.url), "utf8");
  const viewport = await readFile(new URL("../src/components/viewport/studio-viewport.tsx", import.meta.url), "utf8");
  assert.match(canvas, /minPolarAngle=\{0\.12\} maxPolarAngle=\{Math\.PI - 0\.12\}/);
  assert.match(canvas, /enablePan/);
  assert.match(canvas, /camera\.position\.set\(\.\.\.EDITOR_CAMERA\.position\)/);
  assert.match(viewport, /بازنشانی دوربین/);
});

test("decoration panel routes image upload and editing through existing local project assets", async () => {
  const panel = await readFile(new URL("../src/components/viewport/studio-decoration-editor.tsx", import.meta.url), "utf8");
  const environmentPanel = await readFile(new URL("../src/components/viewport/environment-editor.tsx", import.meta.url), "utf8");
  assert.match(panel, /onUpload\(file\)/);
  assert.match(panel, /display-image/);
  assert.match(panel, /StudioDecorationEditor/);
  assert.match(environmentPanel, /<StudioDecorationEditor arrangement=\{arrangement\}/);
});
