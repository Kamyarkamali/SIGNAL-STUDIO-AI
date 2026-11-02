import assert from "node:assert/strict";
import { test } from "node:test";
import { AnimationClip, Bone, BoxGeometry, Float32BufferAttribute, Group, MeshStandardMaterial, Skeleton, SkinnedMesh, Uint16BufferAttribute } from "three";
import { characterModelDefinitionSchema, characterModelRegistry, createCharacterRegistry } from "../src/lib/characters/character-registry.ts";
import { createCharacterGlbInstance, inspectCharacterGlb, loadCharacterGlb, validateCharacterGlb, validateGlbContainer } from "../src/lib/characters/character-glb.ts";

function sceneFixture() {
  const scene = new Group();
  const geometry = new BoxGeometry(0.7, 1.7, 0.4);
  const vertices = geometry.attributes.position.count;
  const indices = new Uint16Array(vertices * 4);
  const weights = new Float32Array(vertices * 4);
  for (let i = 0; i < vertices; i += 1) weights[i * 4] = 1;
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
  const torso = new SkinnedMesh(geometry, new MeshStandardMaterial({ name: "Hoodie", color: "#222222" }));
  torso.name = "Torso";
  const root = new Bone(); root.name = "Root";
  torso.add(root); torso.bind(new Skeleton([root]));
  scene.add(torso);
  const glasses = new Group(); glasses.name = "Glasses"; scene.add(glasses);
  return { scene, animations: [new AnimationClip("idle", 1, [])] };
}

function assetModel() {
  const base = characterModelRegistry.get("character-model:kamyar");
  return characterModelDefinitionSchema.parse({
    ...base, id: "character-model:test-guest", source: "asset", assetId: undefined,
    customizationFields: [
      { key: "clothingColor", label: "رنگ لباس", kind: "color", defaultValue: "#222222" },
      { key: "accessory", label: "عینک", kind: "select", defaultValue: "none",
        options: [{ value: "none", label: "بدون عینک" }, { value: "glasses", label: "عینک" }] },
    ],
    capabilities: { ...base.capabilities, gaze: undefined, customizationKeys: ["clothingColor", "accessory"], animationCapabilities: [], facialRig: "none", bodyRig: "none" },
    glb: { url: "/character-assets/guests/test-guest.glb", heightRangeMeters: [1.5, 1.9], materialColors: { clothingColor: ["Hoodie"] },
      meshVariants: { accessory: { none: [], glasses: ["Glasses"] } } },
  });
}

test("asset definitions require a safe GLB path and complete appearance bindings", () => {
  const model = assetModel();
  assert.equal(createCharacterRegistry([model], new Set([model.rendererKey])).get(model.id)?.glb?.url, model.glb.url);
  assert.equal(characterModelDefinitionSchema.safeParse({ ...model, glb: undefined }).success, false);
  assert.equal(characterModelDefinitionSchema.safeParse({ ...model, glb: { ...model.glb, url: "https://example.com/guest.glb" } }).success, false);
  assert.equal(characterModelDefinitionSchema.safeParse({ ...model, glb: { ...model.glb, materialColors: {} } }).success, false);
  assert.equal(characterModelDefinitionSchema.safeParse({ ...model, glb: { ...model.glb, meshVariants: {} } }).success, false);
  assert.equal(characterModelRegistry.get("character-model:kamyar").glb, undefined);
  assert.equal(characterModelRegistry.get("character-model:chatgpt-robot").glb, undefined);
  assert.equal(characterModelRegistry.get("character-model:claude-mascot").glb, undefined);
});

test("GLB inspection reports bounds, named slots and actual rig data without declaring animation support", () => {
  const model = assetModel();
  const metadata = inspectCharacterGlb(sceneFixture());
  assert.ok(metadata.bounds.size[1] > 1.6);
  assert.deepEqual(metadata.meshNames, ["Torso"]);
  assert.ok(metadata.nodeNames.includes("Glasses"));
  assert.deepEqual(metadata.materialNames, ["Hoodie"]);
  assert.equal(metadata.skeletonCount, 1);
  assert.deepEqual(metadata.animationNames, ["idle"]);
  assert.deepEqual(model.capabilities.animationCapabilities, []);
  assert.doesNotThrow(() => validateCharacterGlb(model, metadata));
  assert.throws(() => validateCharacterGlb({ ...model, glb: { ...model.glb, heightRangeMeters: [1.9, 2.2] } }, metadata), /GLB/);
  assert.throws(() => validateCharacterGlb({ ...model, seatContactY: -2 }, metadata), /GLB/);
  assert.throws(() => validateCharacterGlb({ ...model, glb: { ...model.glb, materialColors: { clothingColor: ["Missing"] } } }, metadata), /Missing/);
  assert.throws(() => inspectCharacterGlb({ scene: new Group(), animations: [] }), /GLB/);
});

test("independent GLB instances clone bones and materials while sharing immutable geometry", () => {
  const gltf = sceneFixture();
  const model = assetModel();
  const first = createCharacterGlbInstance(gltf, model, { clothingColor: "#ff0000", accessory: "none" });
  const second = createCharacterGlbInstance(gltf, model, { clothingColor: "#00ff00", accessory: "glasses" });
  const firstTorso = first.scene.getObjectByName("Torso");
  const secondTorso = second.scene.getObjectByName("Torso");
  assert.notEqual(first.scene, second.scene);
  assert.notEqual(firstTorso, secondTorso);
  assert.equal(firstTorso.geometry, secondTorso.geometry);
  assert.notEqual(firstTorso.material, secondTorso.material);
  assert.notEqual(firstTorso.skeleton.bones[0], secondTorso.skeleton.bones[0]);
  assert.equal(firstTorso.material.color.getHexString(), "ff0000");
  assert.equal(secondTorso.material.color.getHexString(), "00ff00");
  assert.equal(first.scene.getObjectByName("Glasses").visible, false);
  assert.equal(second.scene.getObjectByName("Glasses").visible, true);
  first.dispose(); second.dispose();
});

function containerWithJson(json) {
  const source = new TextEncoder().encode(JSON.stringify(json));
  const padded = Math.ceil(source.length / 4) * 4;
  const data = new ArrayBuffer(20 + padded);
  const view = new DataView(data);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, data.byteLength, true);
  view.setUint32(12, padded, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(data, 20).fill(32);
  new Uint8Array(data, 20).set(source);
  return data;
}

test("malformed containers and external GLB dependencies are rejected before parsing", () => {
  assert.throws(() => validateGlbContainer(new ArrayBuffer(8)), /GLB/);
  assert.throws(() => validateGlbContainer(containerWithJson({ buffers: [{ uri: "https://example.com/a.bin" }] })), /GLB/);
  assert.throws(() => validateGlbContainer(containerWithJson({ images: [{ uri: "texture.png" }] })), /GLB/);
  assert.doesNotThrow(() => validateGlbContainer(containerWithJson({ images: [{ uri: "data:image/png;base64,AA==" }] })));
});

test("missing GLB load errors are recoverable and can be retried", async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return { ok: false }; };
  try {
    const model = assetModel();
    await assert.rejects(loadCharacterGlb(model), /GLB/);
    await assert.rejects(loadCharacterGlb(model), /GLB/);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
