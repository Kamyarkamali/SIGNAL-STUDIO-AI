import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { characterModelRegistry } from "../src/lib/characters/character-registry.ts";
import { addCharacterInstance, createCharacterIdentity, emptyCharacterData, replaceCharacterModel } from "../src/lib/characters/character-operations.ts";
import { ProjectService } from "../src/lib/projects/project-service.ts";

function validGlb() {
  const json = Buffer.from(JSON.stringify({ asset: { version: "2.0" }, scenes: [{ nodes: [0] }], scene: 0,
    nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [-0.5, 0, -0.3], max: [0.5, 1.6, 0.3] }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }], buffers: [{ byteLength: 36 }] }));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const binaryLength = 36;
  const result = new ArrayBuffer(12 + 8 + jsonLength + 8 + binaryLength);
  const view = new DataView(result);
  view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, result.byteLength, true);
  view.setUint32(12, jsonLength, true); view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(result, 20, jsonLength).fill(0x20); new Uint8Array(result, 20, json.length).set(json);
  view.setUint32(20 + jsonLength, binaryLength, true); view.setUint32(24 + jsonLength, 0x004e4942, true);
  return new Uint8Array(result);
}

const inspection = { bounds: { min: [-0.5, 0, -0.3], max: [0.5, 1.6, 0.3], size: [1, 1.6, 0.6] },
  nodeNames: ["Actor"], meshNames: ["Body"], materialNames: ["Fabric"], colorableMaterialNames: ["Fabric"],
  skeletonCount: 1, morphTargetNames: ["Blink"], animationNames: ["Idle"] };
const config = (name = "Guest") => ({ name, heightMeters: 1.7, rotationRadians: Math.PI / 2, seatingOffsetY: 0.03, inspection });

async function withStore(action) {
  const root = await mkdtemp(join(tmpdir(), "signal-character-import-"));
  try { await action(new ProjectService(root), root); } finally { await rm(root, { recursive: true, force: true }); }
}

test("valid GLB imports to safe project-local storage with reusable inspected model metadata", async () => withStore(async (service, root) => {
  const project = await service.create("Import test");
  const bytes = validGlb();
  const imported = await service.importCharacterModel(project.id, config(), bytes);
  const asset = Object.values(imported.assetManifest).find((item) => item.kind === "character-model");
  assert.ok(asset);
  assert.equal(asset.mediaType, "model/gltf-binary");
  assert.equal(asset.characterModel.displayName, "Guest");
  assert.equal(asset.characterModel.glb.inspection.skeletonCount, 1);
  assert.equal(asset.characterModel.capabilities.animationCapabilities.length, 0);
  assert.match(asset.relativePath, /^assets\/character-models\/[0-9a-f-]{36}\.glb$/);
  assert.equal((await readFile(join(root, "projects", project.id, ...asset.relativePath.split("/"))).then((data) => data.equals(Buffer.from(bytes)))), true);
  const reopened = await new ProjectService(root).open(project.id);
  assert.equal(reopened.assetManifest[asset.id].characterModel.id, asset.characterModel.id);
  characterModelRegistry.replaceProjectModels([asset.characterModel]);
  try {
    let data = createCharacterIdentity(emptyCharacterData(), randomUUID(), "Guest A", asset.characterModel.id);
    data = createCharacterIdentity(data, randomUUID(), "Guest B", asset.characterModel.id);
    const ids = Object.keys(data.characterIdentities);
    const firstInstanceId = randomUUID(); const secondInstanceId = randomUUID();
    data = addCharacterInstance(data, ids[0], firstInstanceId); data = addCharacterInstance(data, ids[1], secondInstanceId);
    assert.equal(Object.keys(data.characterInstances).length, 2);
    const firstTransform = structuredClone(data.characterStates[firstInstanceId].transform);
    data = replaceCharacterModel(data, ids[0], "character-model:kamyar");
    assert.equal(data.characterIdentities[ids[0]].modelId, "character-model:kamyar");
    assert.deepEqual(data.characterStates[firstInstanceId].transform, firstTransform);
    assert.equal(data.characterInstances[firstInstanceId].id, firstInstanceId);
    assert.equal(data.characterIdentities[ids[1]].modelId, asset.characterModel.id);
  } finally { characterModelRegistry.replaceProjectModels([]); }
}));

test("malformed uploads and unsafe external dependencies are rejected without writing assets", async () => withStore(async (service) => {
  const project = await service.create("Invalid model");
  const before = await service.open(project.id);
  await assert.rejects(service.importCharacterModel(project.id, config(), new Uint8Array([1, 2, 3])), { code: "INVALID_MODEL" });
  assert.deepEqual((await service.open(project.id)).assetManifest, before.assetManifest);
  assert.equal(await stat(join(service.dataRoot, "projects", project.id, "assets", "character-models")).then(() => true), true);
}));

test("duplicate imports receive independent stable asset and model IDs", async () => withStore(async (service) => {
  const project = await service.create("Duplicate imports");
  const bytes = validGlb();
  const first = await service.importCharacterModel(project.id, config("Same label"), bytes);
  const second = await service.importCharacterModel(project.id, config("Same label"), bytes);
  const assets = Object.values(second.assetManifest).filter((item) => item.kind === "character-model");
  assert.equal(assets.length, 2);
  assert.notEqual(assets[0].id, assets[1].id);
  assert.notEqual(assets[0].characterModel.id, assets[1].characterModel.id);
  const duplicate = await service.duplicate(first.id);
  const cloned = Object.values(duplicate.assetManifest).find((item) => item.kind === "character-model");
  assert.match(cloned.characterModel.glb.url, new RegExp(duplicate.id));
  assert.equal(cloned.id, assets[0].id);
}));

test("in-use imported models cannot be removed and unused ones can be removed safely", async () => withStore(async (service) => {
  const project = await service.create("Dependency check");
  const imported = await service.importCharacterModel(project.id, config(), validGlb());
  const asset = Object.values(imported.assetManifest).find((item) => item.kind === "character-model");
  const identityId = randomUUID();
  const identities = { [identityId]: { id: identityId, name: "Uses asset", modelId: asset.characterModel.id, customization: {} } };
  const saved = await service.save(project.id, project.title, imported.revision, undefined, undefined, identities);
  await assert.rejects(service.removeCharacterModel(project.id, asset.id), { code: "MODEL_IN_USE" });
  const cleared = await service.save(project.id, project.title, saved.revision, undefined, undefined, {});
  const removed = await service.removeCharacterModel(project.id, asset.id);
  assert.equal(removed.assetManifest[asset.id], undefined);
  assert.equal(removed.revision, cleared.revision + 1);
  await assert.rejects(service.resolveAssetFile(project.id, asset), { code: "INVALID_ASSET" });
}));
