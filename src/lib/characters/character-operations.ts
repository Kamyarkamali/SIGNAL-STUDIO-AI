import {
  characterIdentitySchema,
  characterProjectDataSchema,
  type CharacterProjectData,
  type CharacterState,
} from "./character-schema.ts";
import { characterModelRegistry } from "./character-registry.ts";
import {
  normalizeCharacterCustomization,
  type CharacterCustomization,
} from "./character-registry.ts";
import type {
  CharacterAnchor,
  CharacterPlacementKind,
  Vec3,
} from "../environments/environment-registry.ts";
import type { CharacterModelDefinition } from "./character-registry.ts";

export type CharacterPlacementAnchor = CharacterAnchor;
type PlacementModel = Pick<
  CharacterModelDefinition,
  | "seatContactY"
  | "seatPositionOffset"
  | "seatYawOffsetRadians"
  | "placementContactY"
  | "placementPositionOffset"
  | "placementYawOffsetRadians"
  | "placementKinds"
  | "placementRadius"
>;

export class CharacterSeatAssignmentError extends Error {
  readonly code:
    | "NOT_FOUND"
    | "OCCUPIED"
    | "UNAVAILABLE"
    | "UNSUPPORTED"
    | "TOO_LARGE";
  constructor(code: CharacterSeatAssignmentError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "CharacterSeatAssignmentError";
  }
}

export class CharacterIdentityDeletionError extends Error {
  readonly code: "NOT_FOUND" | "IN_USE";
  constructor(code: "NOT_FOUND" | "IN_USE", message: string) {
    super(message);
    this.code = code;
    this.name = "CharacterIdentityDeletionError";
  }
}

export function clampCharacterScale(scale: Vec3): Vec3 {
  return scale.map((value) =>
    Math.min(20, Math.max(0.05, Number.isFinite(value) ? value : 1)),
  ) as Vec3;
}

export function resolveCharacterPlacementTransform(
  model:
    | PlacementModel
    | {
        seatContactY: number;
        seatPositionOffset: Vec3;
        seatYawOffsetRadians: number;
      },
  anchor: CharacterPlacementAnchor,
  scale: Vec3,
): { position: Vec3; rotation: Vec3 } {
  const kind: CharacterPlacementKind = anchor.kind ?? "seat";
  const surfaceOffsetY = anchor.surfaceOffsetY ?? anchor.seatSurfaceOffsetY;
  if (surfaceOffsetY === undefined) {
    throw new CharacterSeatAssignmentError(
      "UNAVAILABLE",
      "این جایگاه سطح نشیمن معتبری ندارد.",
    );
  }
  if ("placementKinds" in model && !model.placementKinds.includes(kind)) {
    throw new CharacterSeatAssignmentError(
      "UNSUPPORTED",
      "\u0627\u06cc\u0646 \u0645\u062f\u0644 \u0628\u0631\u0627\u06cc \u0627\u06cc\u0646 \u0646\u0648\u0639 \u0633\u0637\u062d \u067e\u0634\u062a\u06cc\u0628\u0627\u0646\u06cc \u0646\u0645\u06cc\u200c\u0634\u0648\u062f.",
    );
  }
  if (
    anchor.maxCharacterScale !== undefined &&
    Math.max(...scale) > anchor.maxCharacterScale
  ) {
    throw new CharacterSeatAssignmentError(
      "TOO_LARGE",
      "\u0627\u0646\u062f\u0627\u0632\u0647\u0654 \u067e\u06cc\u06a9\u0631\u0647 \u0628\u0631\u0627\u06cc \u0627\u06cc\u0646 \u0633\u0637\u062d \u0632\u06cc\u0627\u062f \u0627\u0633\u062a.",
    );
  }
  const contactY =
    kind === "seat"
      ? model.seatContactY
      : (("placementContactY" in model ? model.placementContactY : undefined) ??
        model.seatContactY);
  const positionOffset =
    ("placementPositionOffset" in model
      ? model.placementPositionOffset
      : undefined) ?? model.seatPositionOffset;
  const yawOffset =
    ("placementYawOffsetRadians" in model
      ? model.placementYawOffsetRadians
      : undefined) ?? model.seatYawOffsetRadians;
  const yaw = anchor.facingRadians + yawOffset;
  const [offsetX, offsetY, offsetZ] = positionOffset.map(
    (value, index) => value * scale[index],
  ) as Vec3;
  return {
    position: [
      anchor.position[0] + offsetX * Math.cos(yaw) + offsetZ * Math.sin(yaw),
      anchor.position[1] + surfaceOffsetY + offsetY - contactY * scale[1],
      anchor.position[2] - offsetX * Math.sin(yaw) + offsetZ * Math.cos(yaw),
    ],
    rotation: [0, yaw, 0],
  };
}

/** Backward-compatible wrapper for existing chair-placement callers. */
export function resolveCharacterSeatTransform(
  model:
    | PlacementModel
    | {
        seatContactY: number;
        seatPositionOffset: Vec3;
        seatYawOffsetRadians: number;
      },
  anchor: CharacterPlacementAnchor,
  scale: Vec3,
): { position: Vec3; rotation: Vec3 } {
  return resolveCharacterPlacementTransform(model, anchor, scale);
}

function validate(data: CharacterProjectData): CharacterProjectData {
  return characterProjectDataSchema.parse(data);
}

export function emptyCharacterData(): CharacterProjectData {
  return {
    characterIdentities: {},
    characterInstances: {},
    characterStates: {},
  };
}

export function createCharacterIdentity(
  data: CharacterProjectData,
  id: string,
  name: string,
  modelId: string,
): CharacterProjectData {
  if (!characterModelRegistry.get(modelId))
    throw new Error("این مدل شخصیت در کتابخانهٔ موجود نیست.");
  if (data.characterIdentities[id]) throw new Error("شناسهٔ شخصیت تکراری است.");
  const identity = characterIdentitySchema.parse({
    id,
    name,
    modelId,
    customization: normalizeCharacterCustomization(modelId, {}),
  });
  return validate({
    ...data,
    characterIdentities: { ...data.characterIdentities, [id]: identity },
  });
}

export function previewCharacterModelChange(
  data: CharacterProjectData,
  characterId: string,
  modelId: string,
): {
  data: CharacterProjectData;
  replacedCustomizationKeys: string[];
} {
  const current = data.characterIdentities[characterId];
  if (!current) throw new Error("این هویت شخصیت در پروژه پیدا نشد.");
  const targetModel = characterModelRegistry.get(modelId);
  if (!targetModel)
    throw new Error("مدل انتخاب‌شده در کتابخانهٔ فعلی پشتیبانی نمی‌شود.");
  if (current.modelId === modelId)
    return { data, replacedCustomizationKeys: [] };

  const sourceModel = characterModelRegistry.get(current.modelId);
  const targetFields = new Map(
    targetModel.customizationFields.map((field) => [field.key, field]),
  );
  const compatible: CharacterCustomization = {};
  const replacedCustomizationKeys: string[] = [];
  for (const [key, value] of Object.entries(current.customization)) {
    const sourceField = sourceModel?.customizationFields.find(
      (field) => field.key === key,
    );
    const customized =
      typeof value !== "string" ||
      !sourceField ||
      value !== sourceField.defaultValue;
    const targetField = targetFields.get(key);
    if (targetField && typeof value === "string") {
      try {
        const normalized = normalizeCharacterCustomization(modelId, {
          [key]: value,
        });
        compatible[key] = normalized[key];
        continue;
      } catch {
        /* incompatible value falls back to the target model default */
      }
    }
    if (customized) replacedCustomizationKeys.push(key);
  }
  const identity = characterIdentitySchema.parse({
    ...current,
    modelId,
    customization: normalizeCharacterCustomization(modelId, compatible),
  });
  const next = validate({
    ...data,
    characterIdentities: {
      ...data.characterIdentities,
      [characterId]: identity,
    },
  });
  return { data: next, replacedCustomizationKeys };
}

export function replaceCharacterModel(
  data: CharacterProjectData,
  characterId: string,
  modelId: string,
): CharacterProjectData {
  return previewCharacterModelChange(data, characterId, modelId).data;
}

export function updateCharacterCustomization(
  data: CharacterProjectData,
  characterId: string,
  customization: CharacterCustomization,
): CharacterProjectData {
  const current = data.characterIdentities[characterId];
  if (!current) throw new Error("Character identity not found.");
  const identity = characterIdentitySchema.parse({
    ...current,
    customization: normalizeCharacterCustomization(
      current.modelId,
      customization,
    ),
  });
  return validate({
    ...data,
    characterIdentities: {
      ...data.characterIdentities,
      [characterId]: identity,
    },
  });
}

export function resetCharacterCustomization(
  data: CharacterProjectData,
  characterId: string,
): CharacterProjectData {
  const current = data.characterIdentities[characterId];
  if (!current) throw new Error("Character identity not found.");
  return updateCharacterCustomization(data, characterId, {});
}

export function renameCharacter(
  data: CharacterProjectData,
  characterId: string,
  name: string,
): CharacterProjectData {
  const current = data.characterIdentities[characterId];
  if (!current) throw new Error("شخصیت پیدا نشد.");
  const next = characterIdentitySchema.parse({ ...current, name });
  return validate({
    ...data,
    characterIdentities: { ...data.characterIdentities, [characterId]: next },
  });
}

function freePlacement(index: number): {
  position: Vec3;
  facingRadians: number;
} {
  return {
    position: [
      -3.8 + (index % 5) * 1.55,
      0,
      2.35 + Math.floor(index / 5) * 1.5,
    ],
    facingRadians: Math.PI,
  };
}

export function addCharacterInstance(
  data: CharacterProjectData,
  characterId: string,
  instanceId: string,
): CharacterProjectData {
  const identity = data.characterIdentities[characterId];
  if (!identity) throw new Error("ابتدا یک هویت شخصیت از کتابخانه بسازید.");
  if (data.characterInstances[instanceId])
    throw new Error("شناسهٔ نمونه تکراری است.");
  const model = characterModelRegistry.get(identity.modelId);
  if (!model) throw new Error("مدل این شخصیت در دسترس نیست.");
  const fallback = freePlacement(Object.keys(data.characterInstances).length);
  const transform = {
    position: fallback.position,
    rotation: [...model.defaultTransform.rotation] as Vec3,
    scale: [...model.defaultTransform.scale] as Vec3,
  };
  const state: CharacterState = {
    transform,
    initialTransform: structuredClone(transform),
    visible: true,
  };
  return validate({
    ...data,
    characterInstances: {
      ...data.characterInstances,
      [instanceId]: { id: instanceId, characterId },
    },
    characterStates: { ...data.characterStates, [instanceId]: state },
  });
}

/** Explicitly assigns an environment surface; unassigning preserves the current transform exactly. */
export function assignCharacterPlacement(
  data: CharacterProjectData,
  instanceId: string,
  anchorId: string | null,
  anchors: readonly CharacterPlacementAnchor[],
): CharacterProjectData {
  const instance = data.characterInstances[instanceId];
  const currentState = data.characterStates[instanceId];
  if (!instance || !currentState)
    throw new CharacterSeatAssignmentError(
      "NOT_FOUND",
      "نمونهٔ شخصیت پیدا نشد.",
    );
  if (anchorId === currentState.placementAnchorId) return data;
  if (anchorId === null) {
    const unassignedState = { ...currentState };
    delete unassignedState.placementAnchorId;
    unassignedState.initialTransform = structuredClone(currentState.transform);
    return validate({
      ...data,
      characterStates: {
        ...data.characterStates,
        [instanceId]: unassignedState,
      },
    });
  }
  const anchor = anchors.find((candidate) => candidate.id === anchorId);
  if (!anchor)
    throw new CharacterSeatAssignmentError(
      "UNAVAILABLE",
      "این نقطهٔ اتصال در محیط فعلی در دسترس نیست؛ شخصیت را آزاد و بدون لنگر نگه دارید.",
    );
  const occupant = Object.entries(data.characterStates).find(
    ([otherId, state]) =>
      otherId !== instanceId && state.placementAnchorId === anchorId,
  );
  if (occupant)
    throw new CharacterSeatAssignmentError(
      "OCCUPIED",
      "این جایگاه به شخصیت دیگری اختصاص دارد.",
    );
  const identity = data.characterIdentities[instance.characterId];
  const model = identity
    ? characterModelRegistry.get(identity.modelId)
    : undefined;
  if (!model)
    throw new CharacterSeatAssignmentError(
      "UNAVAILABLE",
      "مدل این شخصیت در دسترس نیست؛ می‌توانید نقطهٔ اتصال را آزاد کنید.",
    );
  const placement = resolveCharacterPlacementTransform(
    model,
    anchor,
    currentState.transform.scale,
  );
  const transform = { ...currentState.transform, ...placement };
  for (const [otherId, otherState] of Object.entries(data.characterStates)) {
    if (otherId === instanceId) continue;
    const otherInstance = data.characterInstances[otherId];
    const otherIdentity =
      otherInstance && data.characterIdentities[otherInstance.characterId];
    const otherModel =
      otherIdentity && characterModelRegistry.get(otherIdentity.modelId);
    if (!otherModel) continue;
    const otherRadius =
      otherModel.placementRadius *
      Math.max(otherState.transform.scale[0], otherState.transform.scale[2]);
    const distance = Math.hypot(
      transform.position[0] - otherState.transform.position[0],
      transform.position[2] - otherState.transform.position[2],
    );
    if (distance < anchor.clearanceRadius + otherRadius) {
      throw new CharacterSeatAssignmentError(
        "OCCUPIED",
        "\u062c\u0627\u06cc\u06af\u0627\u0647 \u0628\u0627 \u0645\u0648\u0642\u0639\u06cc\u062a \u0646\u0645\u0648\u0646\u0647\u0654 \u062f\u06cc\u06af\u0631 \u062a\u062f\u0627\u062e\u0644 \u062f\u0627\u0631\u062f.",
      );
    }
  }
  const state: CharacterState = {
    ...currentState,
    placementAnchorId: anchor.id,
    transform,
    initialTransform: structuredClone(transform),
  };
  return validate({
    ...data,
    characterStates: { ...data.characterStates, [instanceId]: state },
  });
}

/** Backward-compatible API for saved seat assignments and callers. */
export function assignCharacterSeat(
  data: CharacterProjectData,
  instanceId: string,
  anchorId: string | null,
  anchors: readonly CharacterPlacementAnchor[],
): CharacterProjectData {
  return assignCharacterPlacement(data, instanceId, anchorId, anchors);
}

export function updateCharacterState(
  data: CharacterProjectData,
  instanceId: string,
  change: Partial<CharacterState>,
): CharacterProjectData {
  const current = data.characterStates[instanceId];
  if (!current || !data.characterInstances[instanceId])
    throw new Error("نمونهٔ شخصیت پیدا نشد.");
  const state = { ...current, ...change };
  return validate({
    ...data,
    characterStates: { ...data.characterStates, [instanceId]: state },
  });
}

export function resetCharacterPlacement(
  data: CharacterProjectData,
  instanceId: string,
): CharacterProjectData {
  const current = data.characterStates[instanceId];
  if (!current) throw new Error("نمونهٔ شخصیت پیدا نشد.");
  return updateCharacterState(data, instanceId, {
    transform: structuredClone(current.initialTransform),
  });
}

export function removeCharacterInstance(
  data: CharacterProjectData,
  instanceId: string,
): CharacterProjectData {
  if (!data.characterInstances[instanceId])
    throw new Error("نمونهٔ شخصیت پیدا نشد.");
  const characterInstances = Object.fromEntries(
    Object.entries(data.characterInstances).filter(([id]) => id !== instanceId),
  );
  const characterStates = Object.fromEntries(
    Object.entries(data.characterStates).filter(([id]) => id !== instanceId),
  );
  return validate({ ...data, characterInstances, characterStates });
}

export function removeCharacterIdentity(
  data: CharacterProjectData,
  characterId: string,
): CharacterProjectData {
  if (!data.characterIdentities[characterId]) {
    throw new CharacterIdentityDeletionError(
      "NOT_FOUND",
      "این شخصیت دیگر در کتابخانه وجود ندارد.",
    );
  }
  const dependentInstances = Object.values(data.characterInstances).filter(
    (instance) => instance.characterId === characterId,
  );
  if (dependentInstances.length > 0) {
    throw new CharacterIdentityDeletionError(
      "IN_USE",
      `این شخصیت در صحنه استفاده شده است (${dependentInstances.length} نمونه). ابتدا هر نمونه را جداگانه با گزینهٔ «حذف از صحنه» بردارید.`,
    );
  }
  const characterIdentities = Object.fromEntries(
    Object.entries(data.characterIdentities).filter(
      ([id]) => id !== characterId,
    ),
  );
  return validate({ ...data, characterIdentities });
}
