import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { addProp, defaultArrangement, duplicateProp, removeProp, restoreDefault, updateProp, arrangementSchema } from "../src/lib/environments/arrangement.ts";
import { ProjectService } from "../src/lib/projects/project-service.ts";
import { saveInputSchema } from "../src/lib/projects/project-schema.ts";

async function withStore(action) {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-arrangement-"));
  assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
  try { await action(new ProjectService(root), root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test("studio props can be added, selected by stable ID, hidden, restored and duplicated independently", () => {
  const original = defaultArrangement();
  const id = `studio-01:user:${randomUUID()}`;
  const added = addProp(original, "prop:chair", id);
  assert.equal(added.props.find((prop) => prop.id === id)?.definitionId, "prop:chair");
  assert.equal(original.props.some((prop) => prop.id === id), false);
  const hidden = updateProp(added, id, { visible: false });
  assert.equal(hidden.props.find((prop) => prop.id === id)?.visible, false);
  assert.equal(added.props.find((prop) => prop.id === id)?.visible, true);
  const duplicateId = `studio-01:user:${randomUUID()}`;
  const duplicated = duplicateProp(hidden, id, duplicateId);
  assert.notDeepEqual(duplicated.props.find((prop) => prop.id === duplicateId)?.transform.position,
    hidden.props.find((prop) => prop.id === id)?.transform.position);
  const moved = updateProp(duplicated, duplicateId, { transform: {
    ...duplicated.props.find((prop) => prop.id === duplicateId).transform, position: [4, 0, 2],
  } });
  assert.notDeepEqual(moved.props.find((prop) => prop.id === duplicateId)?.transform,
    moved.props.find((prop) => prop.id === id)?.transform);
  const removed = removeProp(moved, "studio-01:host-chair");
  assert.equal(removed.props.some((prop) => prop.id === "studio-01:host-chair"), false);
  const restored = restoreDefault(removed, "studio-01:host-chair");
  assert.deepEqual(restored.props.find((prop) => prop.id === "studio-01:host-chair"), original.props.find((prop) => prop.id === "studio-01:host-chair"));
  assert.throws(() => removeProp(restored, "studio-01:room"));
});

test("arrangement rejects invalid transforms, duplicate IDs and modified room shell", () => {
  const initial = defaultArrangement();
  const chair = initial.props.find((prop) => prop.id === "studio-01:host-chair");
  assert.equal(arrangementSchema.safeParse(updateProp(initial, chair.id, { transform: {
    ...chair.transform, position: [2, 0, 1], rotation: [0, Math.PI, 0],
  } })).success, true);
  for (const scale of [[0, 1, 1], [-1, 1, 1], [Infinity, 1, 1], [NaN, 1, 1]]) {
    assert.throws(() => updateProp(initial, chair.id, { transform: { ...chair.transform, scale } }));
  }
  assert.equal(arrangementSchema.safeParse({ ...initial, props: [...initial.props, chair] }).success, false);
  assert.equal(arrangementSchema.safeParse({ ...initial, props: initial.props.map((prop) => prop.id === "studio-01:room" ? { ...prop, visible: false } : prop) }).success, false);
  assert.equal(saveInputSchema.safeParse({ title: "آزمون", expectedRevision: 0, environmentArrangement: initial }).success, true);
  assert.equal(saveInputSchema.safeParse({ title: "آزمون", expectedRevision: 0, environmentArrangement: { ...initial, props: [...initial.props, chair] } }).success, false);
});

test("v1 migration is read-only until save, then backs up original and persists independent arrangements", async () => withStore(async (store, root) => {
  const created = await store.create("قدیمی");
  const environmentArrangement = created.environmentArrangement;
  const file = join(root, "projects", created.id, "project.json");
  const rest = { ...created };
  delete rest.environmentArrangement;
  delete rest.displayAssignments;
  delete rest.characterIdentities;
  delete rest.characterInstances;
  delete rest.characterStates;
  const legacy = { ...rest, schemaVersion: 1 };
  await writeFile(file, JSON.stringify(legacy));
  const opened = await store.open(created.id);
  assert.equal(opened.schemaVersion, 4);
  assert.equal(opened.environmentArrangement.props.length, environmentArrangement.props.length);
  assert.equal(JSON.parse(await readFile(file, "utf8")).schemaVersion, 1);
  const changed = updateProp(opened.environmentArrangement, "studio-01:laptop", { visible: false });
  const saved = await store.save(created.id, created.title, opened.revision, changed);
  assert.equal(saved.schemaVersion, 4);
  assert.equal(saved.revision, 1);
  assert.equal((await new ProjectService(root).open(created.id)).environmentArrangement.props.find((prop) => prop.id === "studio-01:laptop").visible, false);
  const { readdir } = await import("node:fs/promises");
  const backups = await readdir(join(root, "projects", created.id, "backups"));
  assert.equal(backups.length, 1);
  assert.equal(JSON.parse(await readFile(join(root, "projects", created.id, "backups", backups[0]), "utf8")).schemaVersion, 1);
  const copy = await store.duplicate(created.id);
  assert.equal(copy.environmentArrangement.props.find((prop) => prop.id === "studio-01:laptop").visible, false);
  const copyChanged = updateProp(copy.environmentArrangement, "studio-01:laptop", { visible: true });
  await store.save(copy.id, copy.title, copy.revision, copyChanged);
  assert.equal((await store.open(created.id)).environmentArrangement.props.find((prop) => prop.id === "studio-01:laptop").visible, false);
  assert.equal((await store.open(copy.id)).environmentArrangement.props.find((prop) => prop.id === "studio-01:laptop").visible, true);
}));
