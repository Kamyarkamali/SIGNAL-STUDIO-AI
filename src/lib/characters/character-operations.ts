import { characterIdentitySchema, characterProjectDataSchema, type CharacterProjectData, type CharacterState } from "./character-schema.ts";
import { characterModelRegistry } from "./character-registry.ts";
import type { Vec3 } from "../environments/environment-registry.ts";

export type CharacterPlacementAnchor = { id: string; position: Vec3; facingRadians: number; role: "host" | "co-host" | "guest" };

export function clampCharacterScale(scale: Vec3): Vec3 {
  return scale.map((value) => Math.min(20, Math.max(0.05, Number.isFinite(value) ? value : 1))) as Vec3;
}

function validate(data: CharacterProjectData): CharacterProjectData { return characterProjectDataSchema.parse(data); }

export function emptyCharacterData(): CharacterProjectData {
  return { characterIdentities: {}, characterInstances: {}, characterStates: {} };
}

export function createCharacterIdentity(data: CharacterProjectData, id: string, name: string, modelId: string): CharacterProjectData {
  if (!characterModelRegistry.get(modelId)) throw new Error("این مدل شخصیت در کتابخانهٔ موجود نیست.");
  if (data.characterIdentities[id]) throw new Error("شناسهٔ شخصیت تکراری است.");
  const identity = characterIdentitySchema.parse({ id, name, modelId, customization: {} });
  return validate({ ...data, characterIdentities: { ...data.characterIdentities, [id]: identity } });
}

export function renameCharacter(data: CharacterProjectData, characterId: string, name: string): CharacterProjectData {
  const current = data.characterIdentities[characterId];
  if (!current) throw new Error("شخصیت پیدا نشد.");
  const next = characterIdentitySchema.parse({ ...current, name });
  return validate({ ...data, characterIdentities: { ...data.characterIdentities, [characterId]: next } });
}

function freePlacement(index: number): { position: Vec3; facingRadians: number } {
  return { position: [-3.8 + (index % 5) * 1.55, 0, 2.35 + Math.floor(index / 5) * 1.5], facingRadians: Math.PI };
}

export function addCharacterInstance(data: CharacterProjectData, characterId: string, instanceId: string,
  anchors: readonly CharacterPlacementAnchor[]): CharacterProjectData {
  const identity = data.characterIdentities[characterId];
  if (!identity) throw new Error("ابتدا یک هویت شخصیت از کتابخانه بسازید.");
  if (data.characterInstances[instanceId]) throw new Error("شناسهٔ نمونه تکراری است.");
  const model = characterModelRegistry.get(identity.modelId);
  if (!model) throw new Error("مدل این شخصیت در دسترس نیست.");
  const usedAnchors = new Set(Object.values(data.characterStates).map((state) => state.placementAnchorId).filter(Boolean));
  const anchor = anchors.find((candidate) => model.preferredAnchorRoles.includes(candidate.role) && !usedAnchors.has(candidate.id));
  const fallback = freePlacement(Object.keys(data.characterInstances).length);
  const transform = {
    position: anchor ? [...anchor.position] as Vec3 : fallback.position,
    rotation: [...model.defaultTransform.rotation] as Vec3,
    scale: [...model.defaultTransform.scale] as Vec3,
  };
  if (anchor) transform.rotation[1] = anchor.facingRadians;
  const state: CharacterState = { transform, initialTransform: structuredClone(transform), visible: true, ...(anchor ? { placementAnchorId: anchor.id } : {}) };
  return validate({
    ...data,
    characterInstances: { ...data.characterInstances, [instanceId]: { id: instanceId, characterId } },
    characterStates: { ...data.characterStates, [instanceId]: state },
  });
}

export function updateCharacterState(data: CharacterProjectData, instanceId: string, change: Partial<CharacterState>): CharacterProjectData {
  const current = data.characterStates[instanceId];
  if (!current || !data.characterInstances[instanceId]) throw new Error("نمونهٔ شخصیت پیدا نشد.");
  const state = { ...current, ...change };
  return validate({ ...data, characterStates: { ...data.characterStates, [instanceId]: state } });
}

export function resetCharacterPlacement(data: CharacterProjectData, instanceId: string): CharacterProjectData {
  const current = data.characterStates[instanceId];
  if (!current) throw new Error("نمونهٔ شخصیت پیدا نشد.");
  return updateCharacterState(data, instanceId, { transform: structuredClone(current.initialTransform) });
}

export function removeCharacterInstance(data: CharacterProjectData, instanceId: string): CharacterProjectData {
  if (!data.characterInstances[instanceId]) throw new Error("نمونهٔ شخصیت پیدا نشد.");
  const characterInstances = Object.fromEntries(Object.entries(data.characterInstances).filter(([id]) => id !== instanceId));
  const characterStates = Object.fromEntries(Object.entries(data.characterStates).filter(([id]) => id !== instanceId));
  return validate({ ...data, characterInstances, characterStates });
}
