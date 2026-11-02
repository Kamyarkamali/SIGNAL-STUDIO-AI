import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createCharacterRegistry, characterModelDefinitionSchema, characterModelRegistry } from "../src/lib/characters/character-registry.ts";
import { addCharacterInstance, clampCharacterScale, createCharacterIdentity, emptyCharacterData, removeCharacterInstance, renameCharacter, resetCharacterPlacement, updateCharacterState } from "../src/lib/characters/character-operations.ts";
import { characterProjectDataSchema } from "../src/lib/characters/character-schema.ts";
import { migrateProject, newProject, projectSchema } from "../src/lib/projects/project-schema.ts";
import { ProjectService } from "../src/lib/projects/project-service.ts";

test("character registry validates stable models, renderer keys, capabilities, forward and transforms", () => {
  const model = characterModelRegistry.list()[0];
  assert.equal(characterModelDefinitionSchema.safeParse(model).success, true);
  assert.throws(() => createCharacterRegistry([model, model], new Set([model.rendererKey])), /Duplicate/);
  assert.throws(() => createCharacterRegistry([model], new Set()), /Unsupported/);
  assert.equal(model.forwardAxis, "+Z");
  assert.deepEqual(model.capabilities.animationCapabilities, []);
  assert.equal(characterModelDefinitionSchema.safeParse({ ...model, defaultTransform: { ...model.defaultTransform, scale: [0, 1, 1] } }).success, false);
});

test("gizmo scale commits stay within valid positive bounds", () => {
  assert.deepEqual(clampCharacterScale([0, -3, 40]), [0.05, 0.05, 20]);
  assert.deepEqual(clampCharacterScale([Number.NaN, Number.POSITIVE_INFINITY, 1]), [1, 1, 1]);
});

test("identity definitions stay separate while multiple instances and state remain independent", () => {
  let data = emptyCharacterData();
  const identityId = randomUUID();
  const modelId = characterModelRegistry.list()[0].id;
  data = createCharacterIdentity(data, identityId, "نمونهٔ فنی", modelId);
  const anchors = [
    { id: "host", role: "host", position: [-1, 0, -1], facingRadians: 0 },
    { id: "cohost", role: "co-host", position: [1, 0, -1], facingRadians: Math.PI },
  ];
  const firstId = randomUUID();
  const secondId = randomUUID();
  const otherIdentityId = randomUUID();
  data = createCharacterIdentity(data, otherIdentityId, "Independent", modelId);
  data = addCharacterInstance(data, identityId, firstId, anchors);
  data = addCharacterInstance(data, identityId, secondId, anchors);
  assert.notEqual(firstId, secondId);
  assert.equal(data.characterInstances[firstId].characterId, identityId);
  assert.deepEqual(data.characterStates[firstId].transform.position, [-1, 0, -1]);
  assert.deepEqual(data.characterStates[secondId].transform.position, [1, 0, -1]);
  assert.equal(data.characterStates[secondId].transform.rotation[1], Math.PI);
  const renamed = renameCharacter(data, identityId, "Renamed identity");
  assert.equal(renamed.characterIdentities[identityId].id, identityId);
  assert.equal(renamed.characterIdentities[identityId].name, "Renamed identity");
  assert.equal(renamed.characterInstances[firstId].characterId, identityId);
  assert.equal(renamed.characterInstances[secondId].characterId, identityId);
  assert.equal(renamed.characterIdentities[otherIdentityId].name, "Independent");
  assert.throws(() => renameCharacter(renamed, identityId, "   "));
  const moved = updateCharacterState(data, firstId, { transform: { ...data.characterStates[firstId].transform, position: [2, 0, 3], rotation: [0, Math.PI / 2, 0] } });
  assert.deepEqual(moved.characterStates[secondId], data.characterStates[secondId]);
  assert.throws(() => updateCharacterState(moved, firstId, { transform: { ...moved.characterStates[firstId].transform, scale: [0, 1, 1] } }));
  const scaled = updateCharacterState(moved, firstId, { transform: { ...moved.characterStates[firstId].transform, scale: [1.25, 0.9, 1.1] } });
  assert.deepEqual(scaled.characterStates[firstId].transform.scale, [1.25, 0.9, 1.1]);
  assert.deepEqual(scaled.characterStates[secondId].transform.scale, data.characterStates[secondId].transform.scale);
  assert.equal(updateCharacterState(moved, firstId, { visible: false }).characterStates[firstId].visible, false);
  assert.deepEqual(resetCharacterPlacement(moved, firstId).characterStates[firstId].transform, data.characterStates[firstId].initialTransform);
  assert.throws(() => addCharacterInstance(data, identityId, firstId, anchors), /تکراری/);
  const removed = removeCharacterInstance(moved, firstId);
  assert.equal(removed.characterInstances[firstId], undefined);
  assert.ok(removed.characterIdentities[identityId]);
  assert.ok(removed.characterInstances[secondId]);
  assert.equal(characterProjectDataSchema.safeParse(removed).success, true);
});

test("unknown model references survive project loading and can be reported as missing", () => {
  const project = newProject(randomUUID(), "Missing model");
  const identityId = randomUUID();
  const instanceId = randomUUID();
  const missingModelId = "character-model:future-import";
  const parsed = projectSchema.parse({ ...project,
    characterIdentities: { [identityId]: { id: identityId, name: "هویت محفوظ", modelId: missingModelId, customization: {} } },
    characterInstances: { [instanceId]: { id: instanceId, characterId: identityId } },
    characterStates: { [instanceId]: { transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      initialTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, visible: true } },
  });
  assert.equal(parsed.characterIdentities[identityId].modelId, missingModelId);
  assert.equal(characterModelRegistry.get(missingModelId), undefined);
});

test("v3 migration preserves studio and laptop fields while adding empty character collections", () => {
  const project = newProject(randomUUID(), "Schema migration");
  const legacy = { ...project, schemaVersion: 3 };
  delete legacy.characterIdentities;
  delete legacy.characterInstances;
  delete legacy.characterStates;
  const migrated = migrateProject(legacy);
  assert.equal(migrated.schemaVersion, 4);
  assert.deepEqual(migrated.environmentArrangement, project.environmentArrangement);
  assert.deepEqual(migrated.displayAssignments, project.displayAssignments);
  assert.deepEqual(migrated.characterIdentities, {});
});

test("character arrangement saves, reopens and duplicates without sharing placement state", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-characters-"));
  try {
    const service = new ProjectService(root);
    const project = await service.create("Character persistence");
    let data = createCharacterIdentity(emptyCharacterData(), randomUUID(), "پیکره", characterModelRegistry.list()[0].id);
    const identityId = Object.keys(data.characterIdentities)[0];
    const instanceId = randomUUID();
    data = addCharacterInstance(data, identityId, instanceId, []);
    data = renameCharacter(data, identityId, "Persisted identity");
    data = updateCharacterState(data, instanceId, { transform: { ...data.characterStates[instanceId].transform, scale: [1.4, 0.8, 1.1] } });
    const saved = await service.save(project.id, project.title, project.revision, undefined, undefined,
      data.characterIdentities, data.characterInstances, data.characterStates);
    const opened = await service.open(project.id);
    assert.equal(opened.characterIdentities[identityId].name, "Persisted identity");
    assert.deepEqual(opened.characterStates[instanceId].transform.scale, [1.4, 0.8, 1.1]);
    assert.equal(opened.characterStates[instanceId].visible, true);
    const copy = await service.duplicate(project.id);
    const hiddenCopy = updateCharacterState({ characterIdentities: copy.characterIdentities, characterInstances: copy.characterInstances,
      characterStates: copy.characterStates }, instanceId, { visible: false });
    await service.save(copy.id, copy.title, copy.revision, undefined, undefined, hiddenCopy.characterIdentities, hiddenCopy.characterInstances, hiddenCopy.characterStates);
    assert.equal((await service.open(project.id)).characterStates[instanceId].visible, true);
    assert.equal((await service.open(copy.id)).characterStates[instanceId].visible, false);
    assert.equal(saved.schemaVersion, 4);
  } finally { await rm(root, { recursive: true, force: true }); }
});
