import assert from "node:assert/strict";
import { test } from "node:test";
import { displayFit } from "../src/lib/environments/display-fit.ts";
import { newProject, projectSchema, migrateProject } from "../src/lib/projects/project-schema.ts";
import { ProjectService } from "../src/lib/projects/project-service.ts";
import { displayImageReferenceLabels } from "../src/lib/projects/project-service.ts";
import { defaultArrangement, updateFrameCustomization, updateSignCustomization } from "../src/lib/environments/arrangement.ts";
import { removeLaptopImageAssignment } from "../src/lib/environments/display-assignment.ts";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("display contain preserves image ratio and letterboxes within screen", () => {
  const fit = displayFit(16, 9, 4, 3, "contain");
  assert.equal(fit.width, 12);
  assert.equal(fit.height, 9);
  assert.equal(fit.repeatX, 1);
  assert.equal(fit.repeatY, 1);
});

test("display cover fills screen and centers the cropped source", () => {
  const fit = displayFit(16, 9, 4, 3, "cover");
  assert.equal(fit.width, 16);
  assert.equal(fit.height, 9);
  assert.equal(fit.repeatX, 1);
  assert.equal(fit.repeatY, 0.75);
  assert.equal(fit.offsetY, 0.125);
});

test("display assignments retain image and video assets while screen is off", () => {
  const project = newProject("68d01df5-e9a6-4eca-ae9b-6cf55e708b0d", "نمایشگر");
  const imageId = "a42f86c7-bb25-4eaa-8caf-52f3d863dcbe";
  const videoId = "998c2c5d-9a46-449a-9a73-d7c88132c287";
  const laptopId = "studio-01:laptop";
  const next = projectSchema.parse({
    ...project,
    assetManifest: {
      [imageId]: { id: imageId, kind: "display-image", displayName: "screen.png", mediaType: "image/png", relativePath: `assets/display-images/${imageId}.png`, fileSizeBytes: 10, origin: "imported" },
      [videoId]: { id: videoId, kind: "display-video", displayName: "lesson.mp4", mediaType: "video/mp4", relativePath: `assets/display-videos/${videoId}.mp4`, fileSizeBytes: 20, origin: "imported" },
    },
    displayAssignments: { [laptopId]: { state: "off", imageAssetId: imageId, videoAssetId: videoId, fit: "cover", brightness: 1.2 } },
  });
  assert.equal(next.displayAssignments[laptopId].state, "off");
  assert.equal(next.displayAssignments[laptopId].imageAssetId, imageId);
  assert.equal(next.displayAssignments[laptopId].videoAssetId, videoId);
});

test("removing the laptop image assignment is separate from deleting its library file", () => {
  const imageOnly = removeLaptopImageAssignment({ state: "image", imageAssetId: "a42f86c7-bb25-4eaa-8caf-52f3d863dcbe", fit: "cover", brightness: 1.3 });
  assert.deepEqual(imageOnly, { state: "off", fit: "cover", brightness: 1.3 });
  const imageAndVideo = removeLaptopImageAssignment({ state: "video", imageAssetId: "a42f86c7-bb25-4eaa-8caf-52f3d863dcbe", videoAssetId: "998c2c5d-9a46-449a-9a73-d7c88132c287", fit: "contain", brightness: 1 });
  assert.deepEqual(imageAndVideo, { state: "video", videoAssetId: "998c2c5d-9a46-449a-9a73-d7c88132c287", fit: "contain", brightness: 1 });
});

test("version 2 projects migrate to display-capable schema without changing arrangement", () => {
  const project = newProject("68d01df5-e9a6-4eca-ae9b-6cf55e708b0d", "Migration");
  const withoutDisplay = { ...project };
  delete withoutDisplay.displayAssignments;
  delete withoutDisplay.characterIdentities;
  delete withoutDisplay.characterInstances;
  delete withoutDisplay.characterStates;
  const rest = { ...withoutDisplay };
  delete rest.schemaVersion;
  const migrated = migrateProject({ ...rest, schemaVersion: 2 });
  assert.equal(migrated.schemaVersion, 8);
  assert.deepEqual(migrated.environmentArrangement, project.environmentArrangement);
  assert.deepEqual(migrated.displayAssignments, {});
});

test("managed display upload, assignment save, reopen and duplicate preserve independent media bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-display-"));
  try {
    const store = new ProjectService(root);
    const created = await store.create("Display persistence");
    const pngHeader = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
    const uploaded = await store.importDisplayAsset(created.id, "example.png", "image/png", pngHeader);
    const asset = Object.values(uploaded.assetManifest).find((item) => item.kind === "display-image");
    const assignment = { state: "off", imageAssetId: asset.id, fit: "contain", brightness: 1 };
    const saved = await store.save(created.id, created.title, uploaded.revision, undefined, { "studio-01:laptop": assignment });
    const reopened = await new ProjectService(root).open(created.id);
    assert.deepEqual(reopened.displayAssignments["studio-01:laptop"], assignment);
    const duplicate = await store.duplicate(created.id);
    assert.deepEqual(duplicate.displayAssignments["studio-01:laptop"], assignment);
    const duplicateBytes = await readFile(join(root, "projects", duplicate.id, ...asset.relativePath.split("/")));
    assert.deepEqual(duplicateBytes, Buffer.from(pngHeader));
    assert.equal(saved.schemaVersion, 8);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("image deletion removes only an unreferenced imported image and preserves other media", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-image-delete-"));
  try {
    const store = new ProjectService(root);
    const created = await store.create("Delete unused image");
    const imageBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 4, 5, 6]);
    const uploadedImage = await store.importDisplayAsset(created.id, "unused.png", "image/png", imageBytes);
    const image = Object.values(uploadedImage.assetManifest).find((asset) => asset.kind === "display-image");
    const videoBytes = Uint8Array.from([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109]);
    const uploadedVideo = await store.importDisplayAsset(created.id, "keep.mp4", "video/mp4", videoBytes);
    const video = Object.values(uploadedVideo.assetManifest).find((asset) => asset.kind === "display-video");
    const removed = await store.removeDisplayImage(created.id, image.id);
    assert.equal(removed.assetManifest[image.id], undefined);
    assert.ok(removed.assetManifest[video.id]);
    await assert.rejects(readFile(join(root, "projects", created.id, ...image.relativePath.split("/"))));
    assert.deepEqual(await readFile(join(root, "projects", created.id, ...video.relativePath.split("/"))), Buffer.from(videoBytes));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("image deletion rejects laptop, studio sign, and frame dependencies without changing references", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-image-in-use-"));
  try {
    const store = new ProjectService(root);
    const created = await store.create("Referenced image");
    const uploaded = await store.importDisplayAsset(created.id, "shared.png", "image/png", Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 9]));
    const image = Object.values(uploaded.assetManifest).find((asset) => asset.kind === "display-image");
    const arrangement = updateFrameCustomization(updateSignCustomization(defaultArrangement(), "studio-01:practical-lights", { design: "image", imageAssetId: image.id }), "studio-01:wall-art", 0, { imageAssetId: image.id });
    const assignment = { state: "image", imageAssetId: image.id, fit: "contain", brightness: 1 };
    const saved = await store.save(created.id, created.title, uploaded.revision, arrangement, { "studio-01:laptop": assignment });
    assert.deepEqual(displayImageReferenceLabels(saved, image.id).sort(), ["قاب‌های تصویر دیواری", "تابلوی دیواری استودیو", "نمایشگر لپ‌تاپ"].sort());
    await assert.rejects(store.removeDisplayImage(created.id, image.id), (error) => error.code === "ASSET_IN_USE" &&
      error.status === 409 && error.message.includes("نمایشگر لپ‌تاپ") && error.message.includes("قاب‌های تصویر دیواری"));
    const unchanged = await store.open(created.id);
    assert.ok(unchanged.assetManifest[image.id]);
    assert.equal(unchanged.displayAssignments["studio-01:laptop"].imageAssetId, image.id);
    assert.ok(unchanged.environmentArrangement.props.find((prop) => prop.id === "studio-01:practical-lights").decoration.sign.imageAssetId === image.id);
    assert.ok(unchanged.environmentArrangement.props.find((prop) => prop.id === "studio-01:wall-art").decoration.frames[0].imageAssetId === image.id);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("image reference scan catches future project fields outside the asset manifest", () => {
  const project = newProject("68d01df5-e9a6-4eca-ae9b-6cf55e708b0d", "Future scene ref");
  const assetId = "a42f86c7-bb25-4eaa-8caf-52f3d863dcbe";
  const withFutureRef = { ...project, futureScenes: [{ propMedia: { assetId } }], assetManifest: { [assetId]: { id: assetId } } };
  assert.deepEqual(displayImageReferenceLabels(withFutureRef, assetId), ["بخش دیگری از پروژه یا صحنه"]);
});
