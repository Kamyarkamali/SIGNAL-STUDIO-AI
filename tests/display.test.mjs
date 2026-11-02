import assert from "node:assert/strict";
import { test } from "node:test";
import { displayFit } from "../src/lib/environments/display-fit.ts";
import { newProject, projectSchema, migrateProject } from "../src/lib/projects/project-schema.ts";
import { ProjectService } from "../src/lib/projects/project-service.ts";
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
  assert.equal(migrated.schemaVersion, 4);
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
    assert.equal(saved.schemaVersion, 4);
  } finally { await rm(root, { recursive: true, force: true }); }
});
