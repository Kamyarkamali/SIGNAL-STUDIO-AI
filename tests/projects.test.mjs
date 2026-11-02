import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { ProjectService } from "../src/lib/projects/project-service.ts";
import { newProject, projectSchema } from "../src/lib/projects/project-schema.ts";
import { statusAfterSave } from "../src/lib/projects/save-state.ts";

async function withStore(action) {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-test-"));
  assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
  try { await action(new ProjectService(root), root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test("create validates name and initializes empty versioned data and managed folders", async () => withStore(async (store, root) => {
  const project = await store.create("  آزمون  ");
  assert.equal(project.title, "آزمون");
  assert.equal(project.schemaVersion, 4);
  assert.equal(project.environmentArrangement.props.length, 16);
  assert.deepEqual(project.sceneOrder, []);
  assert.deepEqual(project.assetManifest, {});
  const directory = join(root, "projects", project.id);
  assert.equal((await stat(join(directory, "project.json"))).isFile(), true);
  for (const folder of ["audio", "character-models", "environment-models", "prop-models", "textures", "display-images", "display-videos", "animations", "thumbnails"]) {
    assert.equal((await stat(join(directory, "assets", folder))).isDirectory(), true);
  }
  await assert.rejects(store.create(" "), { code: "INVALID_NAME" });
  await assert.rejects(store.create("x".repeat(81)), { code: "INVALID_NAME" });
  await assert.rejects(store.create("bad\u0000name"), { code: "INVALID_NAME" });
}));

test("list, open, rename, backup, stale write, and reopen after a new service instance", async () => withStore(async (store, root) => {
  const first = await store.create("اول");
  const second = await store.create("دوم");
  const renamed = await store.save(first.id, "ویرایش‌شده", first.revision);
  assert.equal(renamed.id, first.id);
  assert.equal(renamed.revision, 1);
  assert.equal((await store.list()).projects.length, 2);
  assert.equal((await store.open(first.id)).title, "ویرایش‌شده");
  await assert.rejects(store.save(first.id, "قدیمی", 0), { code: "STALE_WRITE" });
  const backups = await readdir(join(root, "projects", first.id, "backups"));
  assert.equal(backups.length, 1);
  assert.equal(JSON.parse(await readFile(join(root, "projects", first.id, "backups", backups[0]), "utf8")).title, "اول");
  assert.equal((await readdir(join(root, "projects", first.id))).some((name) => name.endsWith(".tmp")), false);
  const restarted = new ProjectService(root);
  assert.equal((await restarted.open(first.id)).title, "ویرایش‌شده");
  assert.equal((await restarted.list()).projects.some((item) => item.id === second.id), true);
}));

test("duplicate assigns an independent ID and copies referenced asset bytes", async () => withStore(async (store, root) => {
  const source = await store.create("منبع");
  const assetId = randomUUID();
  const filename = `${assetId}.bin`;
  const relativePath = `assets/textures/${filename}`;
  const record = { id: assetId, kind: "texture", displayName: "بافت", mediaType: "application/octet-stream", relativePath, fileSizeBytes: 3, origin: "imported" };
  const sourceFile = join(root, "projects", source.id, ...relativePath.split("/"));
  await writeFile(sourceFile, "abc");
  const manifest = { [assetId]: record };
  await writeFile(join(root, "projects", source.id, "project.json"), JSON.stringify(projectSchema.parse({ ...source, assetManifest: manifest })));
  const copy = await store.duplicate(source.id);
  assert.notEqual(copy.id, source.id);
  assert.equal(copy.assetManifest[assetId].relativePath, relativePath);
  const copyFile = join(root, "projects", copy.id, ...relativePath.split("/"));
  assert.equal(await readFile(copyFile, "utf8"), "abc");
  await writeFile(copyFile, "xyz");
  assert.equal(await readFile(sourceFile, "utf8"), "abc");
}));

test("delete moves only the selected project to recovery and checks revision", async () => withStore(async (store, root) => {
  const first = await store.create("حذف");
  const second = await store.create("ماندگار");
  await assert.rejects(store.delete(first.id, 1), { code: "STALE_WRITE" });
  await store.delete(first.id, 0);
  assert.equal((await store.list()).projects.length, 1);
  assert.equal((await store.open(second.id)).title, "ماندگار");
  assert.equal((await readdir(join(root, "trash"))).some((name) => name.startsWith(first.id)), true);
  await assert.rejects(store.open(first.id), { code: "NOT_FOUND" });
}));

test("failed atomic replacement leaves the project file and cleans temporary output", async () => withStore(async (store, root) => {
  const project = await store.create("پایدار");
  const directory = join(root, "projects", project.id);
  const file = join(directory, "project.json");
  const before = await readFile(file, "utf8");
  const blockedTarget = join(directory, "cannot-replace");
  await mkdir(blockedTarget);
  await assert.rejects(store.atomicWrite(blockedTarget, project));
  assert.equal(await readFile(file, "utf8"), before);
  assert.equal((await readdir(directory)).some((name) => name.endsWith(".tmp")), false);
}));

test("corrupt and unsupported files remain untouched and appear as list issues", async () => withStore(async (store, root) => {
  const corrupt = await store.create("خراب");
  const file = join(root, "projects", corrupt.id, "project.json");
  await writeFile(file, "{bad json");
  await assert.rejects(store.open(corrupt.id), { code: "CORRUPT" });
  await assert.rejects(store.save(corrupt.id, "نام تازه", 0), { code: "CORRUPT" });
  assert.equal(await readFile(file, "utf8"), "{bad json");
  const newer = await store.create("آینده");
  const newerFile = join(root, "projects", newer.id, "project.json");
  await writeFile(newerFile, JSON.stringify({ ...newer, schemaVersion: 99 }));
  await assert.rejects(store.open(newer.id), { code: "UNSUPPORTED_VERSION" });
  assert.equal((await store.list()).issues.length, 2);
}));

test("rejects traversal IDs and unsafe asset paths", async () => withStore(async (store) => {
  await assert.rejects(store.open("../../outside"), { code: "INVALID_ID" });
  await assert.rejects(store.delete("../outside", 0), { code: "INVALID_ID" });
  const assetId = randomUUID();
  const project = newProject(randomUUID(), "آزمون");
  const bad = { id: assetId, kind: "audio", displayName: "بد", mediaType: "audio/wav", relativePath: "assets/audio/../../outside", fileSizeBytes: 1, origin: "imported" };
  assert.equal(projectSchema.safeParse({ ...project, assetManifest: { [assetId]: bad } }).success, false);
}));

test("missing managed asset reports a recoverable error without corrupting the project", async () => withStore(async (store, root) => {
  const project = await store.create("دارایی");
  const assetId = randomUUID();
  const asset = { id: assetId, kind: "audio", displayName: "صدا", mediaType: "audio/wav", relativePath: `assets/audio/${assetId}.wav`, fileSizeBytes: 4, origin: "imported" };
  const file = join(root, "projects", project.id, "project.json");
  await writeFile(file, JSON.stringify(projectSchema.parse({ ...project, assetManifest: { [assetId]: asset } })));
  await assert.rejects(store.resolveAssetFile(project.id, asset), { code: "MISSING_ASSET" });
  assert.equal((await store.open(project.id)).id, project.id);
}));

test("save acknowledgement is the only path to the saved status", () => {
  assert.equal(statusAfterSave("نام", "نام"), "saved");
  assert.equal(statusAfterSave("نام", "نام تازه"), "dirty");
});
