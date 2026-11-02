import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { emptyCharacterData, createCharacterIdentity, addCharacterInstance } from "../src/lib/characters/character-operations.ts";
import { arrangementSchema, defaultArrangement, updateProp } from "../src/lib/environments/arrangement.ts";
import { STUDIO_01 } from "../src/lib/environments/studio-01.ts";
import { newProject, migrateProject, projectSchema, version6ProjectSchema } from "../src/lib/projects/project-schema.ts";
import { createScene, duplicateScene, setSceneCamera } from "../src/lib/scenes/scene-operations.ts";
import { applySceneCameraPreset } from "../src/lib/scenes/scene-camera-presets.ts";
import { captureSceneCamera } from "../src/lib/scenes/capture-scene-camera.ts";
import {
  resolveSceneArrangement, resolveSceneCameraTarget, resolveSceneCharacterData,
  seedSceneCharacters, setSceneCharacter, setScenePropOverride, updateSceneArrangement, updateSceneCharacter,
} from "../src/lib/scenes/scene-configuration.ts";

function sceneAndCast() {
  const identityId = randomUUID();
  const instanceId = randomUUID();
  let characters = createCharacterIdentity(emptyCharacterData(), identityId, "Kamyar", "character-model:kamyar");
  characters = addCharacterInstance(characters, identityId, instanceId);
  const sequence = createScene({ sceneOrder: [], scenes: {} }, randomUUID(), STUDIO_01.id);
  const scene = seedSceneCharacters(sequence.scenes[sequence.sceneOrder[0]], characters);
  return { identityId, instanceId, characters, sequence: { ...sequence, scenes: { ...sequence.scenes, [scene.id]: scene } }, scene };
}

test("scene character presence and transforms are isolated while identity and appearance stay shared", () => {
  const { instanceId, characters, sequence } = sceneAndCast();
  const [sceneA, sceneB] = sequence.sceneOrder;
  const original = sequence.scenes[sceneA];
  const moved = updateSceneCharacter(original, instanceId, { transform: { ...original.characters[instanceId].transform, position: [2, 1, -1] } });
  const hidden = updateSceneCharacter(moved, instanceId, { visible: false });
  const removed = setSceneCharacter(hidden, instanceId, null);
  assert.equal(removed.characters[instanceId], undefined);
  assert.deepEqual(resolveSceneCharacterData(characters, { ...original, id: sceneB }).characterStates[instanceId].transform.position, original.characters[instanceId].transform.position);
  assert.deepEqual(resolveSceneCharacterData(characters, moved).characterStates[instanceId].transform.position, [2, 1, -1]);
  assert.equal(Object.keys(resolveSceneCharacterData(characters, removed).characterInstances).length, 0);
  assert.ok(characters.characterIdentities[characters.characterInstances[instanceId].characterId], "scene removal retains the project identity");
});

test("scene prop and lighting changes resolve over immutable shared environment defaults", () => {
  const { scene } = sceneAndCast();
  const base = defaultArrangement();
  const next = updateSceneArrangement(scene, base, (current) => updateProp(current, "studio-01:laptop", {
    visible: false, transform: { ...current.props.find((prop) => prop.id === "studio-01:laptop").transform, position: [1, 2, 3] },
  }));
  const effective = resolveSceneArrangement(base, next).arrangement;
  assert.equal(effective.props.find((prop) => prop.id === "studio-01:laptop").visible, false);
  assert.deepEqual(effective.props.find((prop) => prop.id === "studio-01:laptop").transform.position, [1, 2, 3]);
  assert.equal(base.props.find((prop) => prop.id === "studio-01:laptop").visible, true);
  assert.deepEqual(resolveSceneArrangement(base, scene).arrangement, base);
  const removed = updateSceneArrangement(scene, base, (current) => ({ ...current, props: current.props.filter((prop) => prop.id !== "studio-01:plant") }));
  assert.equal(resolveSceneArrangement(base, removed).arrangement.props.some((prop) => prop.id === "studio-01:plant"), false);
  const added = updateSceneArrangement(scene, base, (current) => ({ ...current, props: [...current.props, { ...current.props.find((prop) => prop.id === "studio-01:plant"), id: `studio-01:user:${randomUUID()}` }] }));
  assert.equal(resolveSceneArrangement(base, added).arrangement.props.length, base.props.length + 1);
});

test("fixed room structure stays immutable while valid scene-local prop overrides resolve independently", () => {
  const { scene } = sceneAndCast();
  const base = defaultArrangement();
  const laptop = base.props.find((prop) => prop.id === "studio-01:laptop");
  const sceneA = setScenePropOverride(scene, laptop.id, { visible: false, transform: { ...laptop.transform, position: [1, 2, 3] } });
  const sceneB = setScenePropOverride(scene, laptop.id, { transform: { ...laptop.transform, position: [-2, 1, 4] } });
  const resolvedA = resolveSceneArrangement(base, sceneA);
  const resolvedB = resolveSceneArrangement(base, sceneB);
  assert.equal(arrangementSchema.safeParse(resolvedA.arrangement).success, true);
  assert.equal(resolvedA.arrangement.props.find((prop) => prop.id === laptop.id).visible, false);
  assert.deepEqual(resolvedA.arrangement.props.find((prop) => prop.id === laptop.id).transform.position, [1, 2, 3]);
  assert.deepEqual(resolvedB.arrangement.props.find((prop) => prop.id === laptop.id).transform.position, [-2, 1, 4]);
  assert.equal(base.props.find((prop) => prop.id === laptop.id).visible, true);
  for (const id of ["studio-01:room", "studio-01:acoustic-wall"]) {
    assert.throws(() => setScenePropOverride(scene, id, { visible: false }), /ساختار اتاق/);
    const structure = base.props.find((prop) => prop.id === id);
    const invalid = { ...base, props: base.props.map((prop) => prop.id === id ? { ...prop, visible: false } : prop) };
    assert.equal(arrangementSchema.safeParse(invalid).success, false);
    assert.deepEqual(resolveSceneArrangement(base, { ...scene, propOverrides: { [id]: { visible: false } } }).arrangement.props.find((prop) => prop.id === id), structure);
  }
  assert.throws(() => updateSceneArrangement(scene, base, (current) => ({ ...current, props: current.props.filter((prop) => prop.id !== "studio-01:room") })), /ساختار اتاق/);
});

test("legacy structural scene overrides are ignored with a recoverable warning and duplicated overrides stay independent", () => {
  const { scene, sequence } = sceneAndCast();
  const base = defaultArrangement();
  const legacy = { ...scene, propOverrides: { "studio-01:room": { visible: false }, "studio-01:laptop": { visible: false } } };
  const resolved = resolveSceneArrangement(base, legacy);
  assert.ok(resolved.warning);
  assert.equal(resolved.arrangement.props.find((prop) => prop.id === "studio-01:room").visible, true);
  assert.equal(resolved.arrangement.props.find((prop) => prop.id === "studio-01:laptop").visible, false);
  const source = setScenePropOverride(scene, "studio-01:laptop", { visible: false });
  const withSource = { ...sequence, scenes: { ...sequence.scenes, [scene.id]: source } };
  const duplicateId = randomUUID();
  const duplicated = duplicateScene(withSource, scene.id, duplicateId);
  const changed = setScenePropOverride(duplicated.scenes[duplicateId], "studio-01:laptop", { visible: true });
  assert.equal(changed.propOverrides["studio-01:laptop"].visible, true);
  assert.equal(duplicated.scenes[scene.id].propOverrides["studio-01:laptop"].visible, false);
});

test("camera presets use registered studio poses, target refs resolve safely, and scene copies are independent", () => {
  const { instanceId, characters, sequence, scene } = sceneAndCast();
  const arrangement = defaultArrangement();
  const preset = applySceneCameraPreset(scene, "laptop-focused", arrangement, characters);
  assert.deepEqual(preset.targetRef, { kind: "laptop", id: "studio-01:laptop" });
  const referenced = { ...scene, productionCamera: { ...preset } };
  assert.equal(resolveSceneCameraTarget(referenced, characters, arrangement).missing, false);
  const missingTarget = { ...referenced, characters: {} };
  assert.equal(resolveSceneCameraTarget(missingTarget, characters, arrangement).missing, false, "laptop target still exists even if a character is removed");
  const withCharTarget = { ...scene, productionCamera: { ...scene.productionCamera, targetRef: { kind: "character-instance", id: instanceId } } };
  assert.equal(resolveSceneCameraTarget(withCharTarget, characters, arrangement).missing, false);
  assert.equal(resolveSceneCameraTarget({ ...withCharTarget, characters: {} }, characters, arrangement).missing, true);
  const duplicateId = randomUUID();
  const cloned = duplicateScene(sequence, scene.id, duplicateId);
  const editedClone = { ...cloned.scenes[duplicateId], characters: {} };
  assert.ok(cloned.scenes[scene.id].characters[instanceId]);
  assert.notEqual(editedClone.characters, cloned.scenes[scene.id].characters);
  assert.equal(setSceneCamera(cloned, scene.id, preset).scenes[scene.id].productionCamera.targetRef.kind, "laptop");
});

test("saving editor camera clears stale zoom and target reference without changing another scene", () => {
  const first = sceneAndCast();
  const second = createScene(first.sequence, randomUUID(), STUDIO_01.id);
  const idA = first.scene.id;
  const idB = second.sceneOrder.at(-1);
  const previous = { ...second.scenes[idA].productionCamera, zoom: 2, targetRef: { kind: "laptop", id: "studio-01:laptop" } };
  const captured = captureSceneCamera(previous, { position: [3, 4, 5], target: [0, 1, 0], fov: 44, near: 0.1, far: 100 });
  const updated = setSceneCamera(second, idA, captured);
  assert.equal(updated.scenes[idA].productionCamera.zoom, 1);
  assert.equal(updated.scenes[idA].productionCamera.fov / updated.scenes[idA].productionCamera.zoom, 44);
  assert.equal(updated.scenes[idA].productionCamera.targetRef, undefined);
  assert.deepEqual(updated.scenes[idA].productionCamera.position, [3, 4, 5]);
  assert.deepEqual(updated.scenes[idB].productionCamera, second.scenes[idB].productionCamera);
});

test("schema v6 migrates scenes by copying existing project character states into independent scene data", () => {
  const { characters, sequence, instanceId, scene } = sceneAndCast();
  const project = newProject(randomUUID(), "migration");
  const v6 = version6ProjectSchema.parse({ ...project, schemaVersion: 6,
    characterIdentities: characters.characterIdentities, characterInstances: characters.characterInstances, characterStates: characters.characterStates,
    sceneOrder: sequence.sceneOrder, scenes: { [scene.id]: { ...scene, characters: {}, propOverrides: { "studio-01:room": { visible: false } }, lightingOverride: undefined } },
  });
  const migrated = migrateProject(v6);
  assert.equal(migrated.schemaVersion, 9);
  assert.deepEqual(migrated.scenes[scene.id].characters[instanceId].transform, characters.characterStates[instanceId].transform);
  assert.equal(projectSchema.safeParse(migrated).success, true);
  const legacyResolution = resolveSceneArrangement(defaultArrangement(), migrated.scenes[scene.id]);
  assert.ok(legacyResolution.warning);
  assert.equal(legacyResolution.arrangement.props.find((prop) => prop.id === "studio-01:room").visible, true);
});

