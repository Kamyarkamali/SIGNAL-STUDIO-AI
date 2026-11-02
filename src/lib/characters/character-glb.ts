import {
  Box3,
  Mesh,
  MeshStandardMaterial,
  SkinnedMesh,
  Vector3,
  type Material,
} from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeletonAware } from "three/addons/utils/SkeletonUtils.js";
import type {
  CharacterModelDefinition,
  CharacterCustomization,
} from "./character-registry.ts";

export type CharacterGlbMetadata = {
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
  };
  nodeNames: string[];
  meshNames: string[];
  materialNames: string[];
  colorableMaterialNames: string[];
  skeletonCount: number;
  morphTargetNames: string[];
  animationNames: string[];
};

function tuple(vector: Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z];
}

export function inspectCharacterGlb(
  gltf: Pick<GLTF, "scene" | "animations">,
): CharacterGlbMetadata {
  const nodes = new Set<string>();
  const meshes = new Set<string>();
  const materials = new Set<string>();
  const colorableMaterials = new Set<string>();
  const morphs = new Set<string>();
  let skeletonCount = 0;
  let meshCount = 0;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((node) => {
    if (node.name) nodes.add(node.name);
    if (!(node instanceof Mesh)) return;
    meshCount += 1;
    if (node.name) meshes.add(node.name);
    if (node instanceof SkinnedMesh && node.skeleton.bones.length > 0)
      skeletonCount += 1;
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material]) {
      if (material?.name) materials.add(material.name);
      if (material instanceof MeshStandardMaterial && material.name)
        colorableMaterials.add(material.name);
    }
    for (const name of Object.keys(node.morphTargetDictionary ?? {}))
      morphs.add(name);
  });
  if (!meshCount) throw new Error("مدل GLB هیچ مش سه‌بعدی ندارد.");
  const box = new Box3().setFromObject(gltf.scene);
  const min = box.min;
  const max = box.max;
  const size = box.getSize(new Vector3());
  if (
    [...min.toArray(), ...max.toArray(), ...size.toArray()].some(
      (value) => !Number.isFinite(value),
    ) ||
    size.toArray().some((value) => value <= 0.01 || value > 10) ||
    [...min.toArray(), ...max.toArray()].some((value) => Math.abs(value) > 20)
  ) {
    throw new Error("اندازه یا جایگاه مدل GLB برای فضای استودیو معتبر نیست.");
  }
  return {
    bounds: { min: tuple(min), max: tuple(max), size: tuple(size) },
    nodeNames: [...nodes].sort(),
    meshNames: [...meshes].sort(),
    materialNames: [...materials].sort(),
    colorableMaterialNames: [...colorableMaterials].sort(),
    skeletonCount,
    morphTargetNames: [...morphs].sort(),
    animationNames: gltf.animations.map((clip) => clip.name),
  };
}

export function validateCharacterGlb(
  model: CharacterModelDefinition,
  metadata: CharacterGlbMetadata,
): void {
  if (!model.glb) throw new Error("برای این مدل فایل GLB تعریف نشده است.");
  if (model.forwardAxis !== "+Z")
    throw new Error("مدل GLB باید با جهت روبه‌جلوی +Z تعریف شود.");
  const height = metadata.bounds.size[1];
  if (
    model.glb.heightRangeMeters &&
    (height < model.glb.heightRangeMeters[0] ||
      height > model.glb.heightRangeMeters[1])
  ) {
    throw new Error(
      "ارتفاع مدل GLB با اندازهٔ ثبت‌شده برای استودیو سازگار نیست.",
    );
  }
  if (
    model.seatContactY < metadata.bounds.min[1] - 0.3 ||
    model.seatContactY > metadata.bounds.max[1] + 0.3
  ) {
    throw new Error("نقطهٔ تماس مدل GLB با صندلی خارج از محدودهٔ پیکره است.");
  }
  for (const names of Object.values(model.glb.materialColors))
    for (const name of names) {
      if (!metadata.colorableMaterialNames.includes(name))
        throw new Error(`جنس رنگ‌پذیر GLB پیدا نشد: ${name}`);
    }
  for (const options of Object.values(model.glb.meshVariants))
    for (const names of Object.values(options))
      for (const name of names) {
        if (!metadata.nodeNames.includes(name))
          throw new Error(`بخش نام‌گذاری‌شدهٔ GLB پیدا نشد: ${name}`);
      }
}

const loader = new GLTFLoader();
type CachedCharacterAsset = { refs: number; promise: Promise<{ gltf: GLTF; metadata: CharacterGlbMetadata }> };
const assetCache = new Map<string, CachedCharacterAsset>();

export function validateGlbContainer(data: ArrayBuffer): void {
  if (data.byteLength < 20) throw new Error("فایل GLB ناقص است.");
  const view = new DataView(data);
  if (
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== data.byteLength ||
    view.getUint32(16, true) !== 0x4e4f534a
  )
    throw new Error("ساختار فایل GLB معتبر نیست.");
  const jsonLength = view.getUint32(12, true);
  if (jsonLength <= 0 || 20 + jsonLength > data.byteLength)
    throw new Error("بخش اطلاعات فایل GLB معتبر نیست.");
  let document: { buffers?: { uri?: string }[]; images?: { uri?: string }[] };
  try {
    document = JSON.parse(
      new TextDecoder().decode(new Uint8Array(data, 20, jsonLength)),
    );
    if (
      !document ||
      typeof document !== "object" ||
      Array.isArray(document) ||
      (document.buffers && !Array.isArray(document.buffers)) ||
      (document.images && !Array.isArray(document.images))
    )
      throw new Error("invalid");
  } catch {
    throw new Error("اطلاعات فایل GLB قابل خواندن نیست.");
  }
  if (
    document.buffers?.some((buffer) => buffer.uri) ||
    document.images?.some(
      (image) => image.uri && !image.uri.startsWith("data:"),
    )
  ) {
    throw new Error(
      "مدل GLB باید همهٔ بافرها و تصویرها را درون فایل داشته باشد.",
    );
  }
}

/** Server-side structural check for uploaded character GLBs; all buffer/image dependencies must be embedded. */
export function validateCharacterGlbUpload(data: ArrayBuffer): void {
  validateGlbContainer(data);
  const view = new DataView(data);
  let offset = 12;
  let json: {
    asset?: { version?: string };
    meshes?: { primitives?: { attributes?: Record<string, number> }[] }[];
    accessors?: {
      bufferView?: number;
      count?: number;
      type?: string;
      min?: number[];
      max?: number[];
    }[];
    bufferViews?: {
      buffer?: number;
      byteOffset?: number;
      byteLength?: number;
    }[];
    buffers?: { byteLength?: number; uri?: string }[];
    images?: { uri?: string }[];
  };
  try {
    json = JSON.parse(
      new TextDecoder().decode(
        new Uint8Array(data, 20, view.getUint32(12, true)),
      ),
    );
  } catch {
    throw new Error("GLB JSON is malformed.");
  }
  let hasBinary = false;
  let binaryLength = 0;
  let chunkIndex = 0;
  while (offset < data.byteLength) {
    if (offset + 8 > data.byteLength)
      throw new Error("GLB chunk header is truncated.");
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    offset += 8;
    if (length === 0 || offset + length > data.byteLength)
      throw new Error("GLB chunk length is invalid.");
    if (chunkIndex === 0 && type !== 0x4e4f534a)
      throw new Error("GLB JSON chunk must be first.");
    if (type === 0x004e4942) {
      if (hasBinary) throw new Error("GLB has duplicate binary chunks.");
      hasBinary = true;
      binaryLength = length;
    }
    offset += length;
    chunkIndex += 1;
  }
  if (
    offset !== data.byteLength ||
    json?.asset?.version !== "2.0" ||
    !json.meshes?.some((mesh) => mesh.primitives?.length)
  )
    throw new Error("GLB does not contain valid character geometry.");
  if (
    json.buffers?.length !== 1 ||
    !hasBinary ||
    json.buffers.some(
      (buffer) =>
        buffer.uri || !buffer.byteLength || buffer.byteLength > binaryLength,
    )
  )
    throw new Error("GLB must contain its binary geometry internally.");
  const declaredBufferLength = json.buffers[0]?.byteLength ?? 0;
  if (
    !json.bufferViews?.length ||
    json.bufferViews.some(
      (bufferView) =>
        bufferView.buffer !== 0 ||
        !bufferView.byteLength ||
        (bufferView.byteOffset ?? 0) + bufferView.byteLength >
          declaredBufferLength,
    )
  )
    throw new Error("GLB contains an invalid buffer view.");
  if (
    !json.accessors?.length ||
    json.accessors.some(
      (accessor) =>
        accessor.count === undefined ||
        accessor.count <= 0 ||
        (accessor.bufferView !== undefined &&
          !json.bufferViews?.[accessor.bufferView]),
    )
  )
    throw new Error("GLB contains invalid geometry accessors.");
  if (json.images?.some((image) => image.uri && !image.uri.startsWith("data:")))
    throw new Error("GLB textures must be embedded in the file.");
  for (const mesh of json.meshes)
    for (const primitive of mesh.primitives ?? []) {
      const positionIndex = primitive.attributes?.POSITION;
      const position =
        positionIndex === undefined ? undefined : json.accessors[positionIndex];
      if (!position || position.type !== "VEC3")
        throw new Error("GLB mesh position data is incomplete.");
    }
}

export function loadCharacterGlb(model: CharacterModelDefinition) {
  if (!model.glb)
    return Promise.reject(new Error("برای این مدل فایل GLB تعریف نشده است."));
  const key = `${model.id}:${model.glb.url}`;
  const cached = assetCache.get(key);
  if (cached) { cached.refs += 1; return cached.promise; }
  const promise = fetch(model.glb.url)
    .then(async (response) => {
      if (!response.ok) throw new Error("فایل GLB پیدا نشد.");
      const data = await response.arrayBuffer();
      validateGlbContainer(data);
      return loader.parseAsync(data, "");
    })
    .then((gltf) => {
      const metadata = inspectCharacterGlb(gltf);
      validateCharacterGlb(model, metadata);
      return { gltf, metadata };
    })
    .catch((error: unknown) => {
      if (assetCache.get(key)?.promise === promise) assetCache.delete(key);
      throw error;
    });
  assetCache.set(key, { refs: 1, promise });
  return promise;
}

function disposeLoadedCharacterAsset(gltf: GLTF) {
  const geometries = new Set<import("three").BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<import("three").Texture>();
  gltf.scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value && typeof value === "object" && "isTexture" in value && value.isTexture) textures.add(value as import("three").Texture);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

export function releaseCharacterGlb(model: CharacterModelDefinition) {
  const url = model.glb?.url;
  if (!url) return;
  const key = `${model.id}:${url}`;
  const cached = assetCache.get(key);
  if (!cached) return;
  cached.refs -= 1;
  if (cached.refs > 0) return;
  assetCache.delete(key);
  void cached.promise.then(({ gltf }) => disposeLoadedCharacterAsset(gltf)).catch(() => undefined);
}

export function createCharacterGlbInstance(
  gltf: Pick<GLTF, "scene">,
  model: CharacterModelDefinition,
  appearance: CharacterCustomization,
) {
  const scene = cloneSkeletonAware(gltf.scene);
  if (model.glb?.floorOffsetY !== undefined)
    scene.position.y += model.glb.floorOffsetY;
  if (model.glb?.orientationRadians !== undefined)
    scene.rotation.y = model.glb.orientationRadians;
  const instanceMaterials = new Map<Material, Material>();
  scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const cloneMaterial = (material: Material) => {
      let copy = instanceMaterials.get(material);
      if (!copy) {
        copy = material.clone();
        instanceMaterials.set(material, copy);
      }
      return copy;
    };
    node.material = Array.isArray(node.material)
      ? node.material.map(cloneMaterial)
      : cloneMaterial(node.material);
    node.castShadow = true;
    node.receiveShadow = true;
  });
  if (model.glb) {
    for (const [key, names] of Object.entries(model.glb.materialColors)) {
      const value =
        appearance[key] ??
        model.customizationFields.find((field) => field.key === key)
          ?.defaultValue;
      if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) continue;
      scene.traverse((node) => {
        if (!(node instanceof Mesh)) return;
        for (const material of Array.isArray(node.material)
          ? node.material
          : [node.material]) {
          if (
            material instanceof MeshStandardMaterial &&
            names.includes(material.name)
          )
            material.color.set(value);
        }
      });
    }
    for (const [key, options] of Object.entries(model.glb.meshVariants)) {
      const selected =
        appearance[key] ??
        model.customizationFields.find((field) => field.key === key)
          ?.defaultValue;
      const available = new Set(Object.values(options).flat());
      const visible = new Set(selected ? (options[selected] ?? []) : []);
      scene.traverse((node) => {
        if (available.has(node.name))
          node.visible = node.visible && visible.has(node.name);
      });
    }
  }
  return {
    scene,
    dispose: () => {
      for (const material of instanceMaterials.values()) material.dispose();
    },
  };
}
