import { z } from "zod";
import { arrangementSchema, defaultArrangement } from "../environments/arrangement.ts";
import { characterProjectDataSchema } from "../characters/character-schema.ts";
import { characterModelDefinitionSchema } from "../characters/character-registry.ts";
import { projectFrameRateSchema, sceneOrderSchema, scenesSchema } from "../scenes/scene-schema.ts";
import { audioProjectCollectionsSchema, validateAudioCollections } from "../audio/audio-schema.ts";

export const PROJECT_SCHEMA_VERSION = 9;
export const PROJECT_MAX_BYTES = 1024 * 1024;
export const REQUEST_MAX_BYTES = 256 * 1024;

export const projectIdSchema = z.uuid();
export const projectNameSchema = z.string().trim().min(1, "نام پروژه لازم است.").max(80, "نام پروژه نباید بیش از ۸۰ نویسه باشد.")
  .refine((name) => [...name].every((character) => character === "\u200c" || !/[\p{Cc}\p{Cf}]/u.test(character)), "نام پروژه نویسهٔ نامعتبر دارد.")
  .transform((name) => name.normalize("NFC"));

export const assetKinds = ["audio", "character-model", "environment-model", "prop-model", "texture", "display-image", "display-video", "animation", "thumbnail"] as const;
export type AssetKind = (typeof assetKinds)[number];
export const assetDirectories: Record<AssetKind, string> = {
  audio: "audio",
  "character-model": "character-models",
  "environment-model": "environment-models",
  "prop-model": "prop-models",
  texture: "textures",
  "display-image": "display-images",
  "display-video": "display-videos",
  animation: "animations",
  thumbnail: "thumbnails",
};

const assetRecordSchema = z.object({
  id: z.uuid(),
  kind: z.enum(assetKinds),
  displayName: z.string().min(1).max(120),
  mediaType: z.string().min(1).max(100),
  relativePath: z.string().min(1).max(240),
  fileSizeBytes: z.number().int().nonnegative(),
  audioDurationSeconds: z.number().finite().positive().max(86_400).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  origin: z.enum(["built-in", "imported"]),
  characterModel: characterModelDefinitionSchema.optional(),
}).strict().superRefine((asset, context) => {
  const segments = asset.relativePath.split("/");
  if (segments.length !== 3 || segments[0] !== "assets" || segments[1] !== assetDirectories[asset.kind] ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(segments[2]) || segments[2].includes("..")) {
    context.addIssue({ code: "custom", message: "مسیر دارایی نامعتبر است." });
  }
  if (asset.characterModel && (asset.kind !== "character-model" || asset.characterModel.assetId !== asset.id)) {
    context.addIssue({ code: "custom", message: "Character model metadata must reference its project asset." });
  }
  if (asset.kind === "character-model" && !asset.characterModel) context.addIssue({ code: "custom", message: "Character model metadata is required." });
  if (asset.audioDurationSeconds !== undefined && asset.kind !== "audio") context.addIssue({ code: "custom", message: "Audio duration belongs only to audio assets." });
});

export type AssetRecord = z.infer<typeof assetRecordSchema>;

const emptyCollection = z.record(z.uuid(), z.unknown());
const baseProjectSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)]),
  id: projectIdSchema,
  title: projectNameSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  revision: z.number().int().nonnegative(),
  fps: projectFrameRateSchema,
  resolution: z.object({ width: z.literal(1280), height: z.literal(720) }).strict(),
  sceneOrder: sceneOrderSchema,
  scenes: scenesSchema,
  characters: emptyCollection,
  speakers: emptyCollection,
  audioClips: emptyCollection,
  speakerRegions: emptyCollection.optional(),
  tracks: emptyCollection,
  events: emptyCollection,
  assetManifest: z.record(z.uuid(), assetRecordSchema),
  exportSettings: z.object({ fps: z.literal(30), width: z.literal(1280), height: z.literal(720) }).strict(),
}).strict().superRefine((project, context) => {
  if (project.schemaVersion < 6 && (project.fps !== 30 || project.sceneOrder.length || Object.keys(project.scenes).length)) {
    context.addIssue({ code: "custom", message: "Scene and frame-rate metadata require project schema v6 or later." });
  }
  for (const [id, asset] of Object.entries(project.assetManifest)) {
    if (id !== asset.id) context.addIssue({ code: "custom", message: "شناسهٔ دارایی ناسازگار است." });
  }
});

export const legacyProjectSchema = baseProjectSchema.safeExtend({ schemaVersion: z.literal(1) });

export const version2ProjectSchema = baseProjectSchema.safeExtend({
  schemaVersion: z.literal(2),
  environmentArrangement: arrangementSchema,
});

export const displayAssignmentSchema = z.object({
  state: z.enum(["image", "video", "off"]),
  imageAssetId: z.uuid().optional(),
  videoAssetId: z.uuid().optional(),
  fit: z.enum(["contain", "cover"]),
  brightness: z.number().finite().min(0.25).max(2),
}).strict();
export const displayAssignmentsSchema = z.record(z.string().min(1), displayAssignmentSchema);

export const version3ProjectSchema = baseProjectSchema.safeExtend({
  schemaVersion: z.literal(3),
  environmentArrangement: arrangementSchema,
  displayAssignments: displayAssignmentsSchema,
});

function projectWithCharacterSchema(version: 4 | 5 | 6 | 7 | 8 | 9) {
  return z.object({
    ...baseProjectSchema.shape,
    schemaVersion: z.literal(version),
    environmentArrangement: arrangementSchema,
    displayAssignments: displayAssignmentsSchema,
    ...(version === 9 ? { speakers: z.record(z.uuid(), z.unknown()), audioClips: z.record(z.uuid(), z.unknown()), speakerRegions: z.record(z.uuid(), z.unknown()) } : {}),
    ...characterProjectDataSchema.shape,
  }).strict().superRefine((project, context) => {
  if (version < 6 && (project.fps !== 30 || project.sceneOrder.length || Object.keys(project.scenes).length)) {
    context.addIssue({ code: "custom", message: "Scene and frame-rate metadata require project schema v6 or later." });
  }
  for (const [id, asset] of Object.entries(project.assetManifest)) {
    if (id !== asset.id) context.addIssue({ code: "custom", message: "Asset key must match its stable ID." });
  }
  if (version < 9) for (const collection of [project.speakers, project.audioClips, project.speakerRegions]) {
    if (collection && Object.keys(collection).length) context.addIssue({ code: "custom", message: "Audio records require project schema v9 or later." });
  }
  if (version >= 6) {
    const ids = new Set<string>();
    for (const sceneId of project.sceneOrder) {
      if (ids.has(sceneId)) context.addIssue({ code: "custom", message: "Scene order contains duplicate IDs.", path: ["sceneOrder"] });
      ids.add(sceneId);
      if (!project.scenes[sceneId]) context.addIssue({ code: "custom", message: "Scene order references a missing scene.", path: ["sceneOrder"] });
    }
    for (const [sceneId, scene] of Object.entries(project.scenes)) {
      if (scene.id !== sceneId) context.addIssue({ code: "custom", message: "Scene key must match its stable ID.", path: ["scenes", sceneId, "id"] });
      if (!ids.has(sceneId)) context.addIssue({ code: "custom", message: "Every scene must appear in scene order.", path: ["scenes", sceneId] });
    }
  }
  for (const [propId, assignment] of Object.entries(project.displayAssignments)) {
    const prop = project.environmentArrangement.props.find((item) => item.id === propId);
    if (prop && prop.definitionId !== "prop:laptop") context.addIssue({ code: "custom", message: "رسانه فقط به لپ‌تاپ متصل می‌شود." });
    for (const [assetId, kind] of [[assignment.imageAssetId, "display-image"], [assignment.videoAssetId, "display-video"]] as const) {
      if (assetId && project.assetManifest[assetId]?.kind !== kind) context.addIssue({ code: "custom", message: "رسانهٔ نمایشگر معتبر نیست." });
    }
    if (assignment.state === "image" && !assignment.imageAssetId || assignment.state === "video" && !assignment.videoAssetId) {
      context.addIssue({ code: "custom", message: "برای حالت نمایشگر، رسانه‌ای انتخاب نشده است." });
    }
  }
  for (const prop of project.environmentArrangement.props) {
    const decorationImageIds = [prop.decoration?.sign?.imageAssetId,
      ...(prop.decoration?.frames ?? []).map((frame) => frame.imageAssetId)].filter((id): id is string => Boolean(id));
    for (const assetId of decorationImageIds) if (project.assetManifest[assetId]?.kind !== "display-image") {
      context.addIssue({ code: "custom", message: "Artwork must reference an image asset in this project.", path: ["environmentArrangement", "props", prop.id, "decoration"] });
    }
  }
  for (const asset of Object.values(project.assetManifest)) if (asset.characterModel) {
    const definition = asset.characterModel;
    if (definition.assetId !== asset.id || definition.glb?.url !== `/api/projects/${project.id}/character-assets/${asset.id}`) {
      context.addIssue({ code: "custom", message: "Character model asset reference is not scoped to this project." });
    }
    if (asset.displayName !== definition.displayName) context.addIssue({ code: "custom", message: "Character model display names must match their asset record." });
  }
  for (const [identityId, identity] of Object.entries(project.characterIdentities)) {
    const definition = Object.values(project.assetManifest).find((asset) => asset.characterModel?.id === identity.modelId)?.characterModel;
    if (!definition) continue; // Retain unavailable model references so older projects can open and report a missing model.
    const supported = new Map(definition.customizationFields.map((field) => [field.key, field]));
    for (const [key, value] of Object.entries(identity.customization)) {
      const field = supported.get(key);
      if (!field || typeof value !== "string" || field.kind === "color" && !/^#[0-9a-fA-F]{6}$/.test(value) || field.kind === "select" && !field.options.some((option) => option.value === value)) {
        context.addIssue({ code: "custom", message: "Imported character appearance is not supported by its model.", path: ["characterIdentities", identityId, "customization", key] });
      }
    }
  }
  const characterData = characterProjectDataSchema.safeParse({ characterIdentities: project.characterIdentities,
    characterInstances: project.characterInstances, characterStates: project.characterStates });
  if (!characterData.success) for (const issue of characterData.error.issues) {
    context.addIssue({ code: "custom", message: issue.message, path: issue.path });
  }
  if (version >= 7) for (const [sceneId, scene] of Object.entries(project.scenes)) {
    for (const instanceId of Object.keys(scene.characters)) if (!project.characterInstances[instanceId]) {
      context.addIssue({ code: "custom", message: "Scene presence must reference an existing project character instance.", path: ["scenes", sceneId, "characters", instanceId] });
    }
    for (const [propId, override] of Object.entries(scene.propOverrides)) if (override.added && override.added.id !== propId) {
      context.addIssue({ code: "custom", message: "Scene prop IDs must match their override keys.", path: ["scenes", sceneId, "propOverrides", propId] });
    }
  }
  if (version >= 9) {
    const audioProject = audioProjectCollectionsSchema.safeParse({ speakers: project.speakers, audioClips: project.audioClips, speakerRegions: project.speakerRegions });
    if (!audioProject.success) {
      for (const issue of audioProject.error.issues) context.addIssue({ code: "custom", message: issue.message, path: issue.path });
      return;
    }
    const assets = Object.fromEntries(Object.values(project.assetManifest).filter((asset) => asset.kind === "audio")
      .map((asset) => [asset.id, { audioDurationSeconds: asset.audioDurationSeconds }]));
    for (const message of validateAudioCollections(audioProject.data,
      assets, new Set(Object.keys(project.characterIdentities)))) context.addIssue({ code: "custom", message });
  }
  });
}

export const version4ProjectSchema = projectWithCharacterSchema(4);
export const version5ProjectSchema = projectWithCharacterSchema(5);
export const version6ProjectSchema = projectWithCharacterSchema(6);
export const version7ProjectSchema = projectWithCharacterSchema(7);
export const version8ProjectSchema = projectWithCharacterSchema(8);
const untypedProjectSchema = projectWithCharacterSchema(9);
export type ProjectDocument = Omit<z.infer<typeof untypedProjectSchema>, "speakers" | "audioClips" | "speakerRegions"> & import("../audio/audio-schema.ts").AudioProjectCollections;
export const projectSchema = untypedProjectSchema as z.ZodType<ProjectDocument>;
export type ProjectSummary = Pick<ProjectDocument, "id" | "title" | "createdAt" | "updatedAt" | "revision">;

export const createInputSchema = z.object({ title: projectNameSchema }).strict();
export const saveInputSchema = z.object({ title: projectNameSchema, expectedRevision: z.number().int().nonnegative(), environmentArrangement: arrangementSchema.optional(), displayAssignments: displayAssignmentsSchema.optional(),
  fps: projectFrameRateSchema.optional(), sceneOrder: sceneOrderSchema.optional(), scenes: scenesSchema.optional(),
  speakers: audioProjectCollectionsSchema.shape.speakers.optional(), audioClips: audioProjectCollectionsSchema.shape.audioClips.optional(), speakerRegions: audioProjectCollectionsSchema.shape.speakerRegions.optional(),
  characterIdentities: characterProjectDataSchema.shape.characterIdentities.optional(), characterInstances: characterProjectDataSchema.shape.characterInstances.optional(), characterStates: characterProjectDataSchema.shape.characterStates.optional() }).strict();
export const deleteInputSchema = z.object({ expectedRevision: z.number().int().nonnegative() }).strict();

export function newProject(id: string, title: string, now = new Date()): ProjectDocument {
  const timestamp = now.toISOString();
  return projectSchema.parse({
    schemaVersion: PROJECT_SCHEMA_VERSION, id, title, createdAt: timestamp, updatedAt: timestamp, revision: 0,
    fps: 30, resolution: { width: 1280, height: 720 }, sceneOrder: [], scenes: {}, characters: {}, speakers: {},
    audioClips: {}, speakerRegions: {}, tracks: {}, events: {}, assetManifest: {}, exportSettings: { fps: 30, width: 1280, height: 720 },
    environmentArrangement: defaultArrangement(), displayAssignments: {}, ...characterProjectDataSchema.parse({ characterIdentities: {}, characterInstances: {}, characterStates: {} }),
  });
}

export function migrateProject(value: unknown): ProjectDocument | null {
  const current = projectSchema.safeParse(value);
  if (current.success) return current.data;
  const version8 = version8ProjectSchema.safeParse(value);
  if (version8.success) return projectSchema.parse({ ...version8.data, schemaVersion: PROJECT_SCHEMA_VERSION, speakers: {}, audioClips: {}, speakerRegions: {} });
  const version7 = version7ProjectSchema.safeParse(value);
  if (version7.success) return projectSchema.parse({ ...version7.data, schemaVersion: PROJECT_SCHEMA_VERSION });
  const version6 = version6ProjectSchema.safeParse(value);
  if (version6.success) {
    const scenes = Object.fromEntries(Object.entries(version6.data.scenes).map(([id, scene]) => {
      const characters = Object.fromEntries(Object.values(version6.data.characterInstances).flatMap((instance) => {
        const state = version6.data.characterStates[instance.id];
        if (!state) return [];
        return [[instance.id, { visible: state.visible, transform: structuredClone(state.transform), ...(state.placementAnchorId ? { placementAnchorId: state.placementAnchorId } : {}) }]];
      }));
      return [id, { ...scene, characters: Object.keys(scene.characters).length ? scene.characters : characters }];
    }));
    return projectSchema.parse({ ...version6.data, schemaVersion: PROJECT_SCHEMA_VERSION, scenes });
  }
  const version4 = version4ProjectSchema.safeParse(value);
  const version5 = version5ProjectSchema.safeParse(value);
  if (version5.success) return projectSchema.parse({ ...version5.data, schemaVersion: PROJECT_SCHEMA_VERSION,
    fps: 30, sceneOrder: [], scenes: {} });
  if (version4.success) {
    const characterIdentities = Object.fromEntries(Object.entries(version4.data.characterIdentities).map(([id, identity]) => {
      const canReplacePlaceholder = identity.modelId === "character-model:development-human" && Object.keys(identity.customization).length === 0;
      return [id, canReplacePlaceholder ? { ...identity, modelId: "character-model:kamyar" } : identity];
    }));
    return projectSchema.parse({ ...version4.data, schemaVersion: PROJECT_SCHEMA_VERSION, characterIdentities });
  }
  const version3 = version3ProjectSchema.safeParse(value);
  if (version3.success) return projectSchema.parse({ ...version3.data, schemaVersion: PROJECT_SCHEMA_VERSION,
    characterIdentities: {}, characterInstances: {}, characterStates: {} });
  const prior = version2ProjectSchema.safeParse(value);
  if (prior.success) return projectSchema.parse({ ...prior.data, schemaVersion: PROJECT_SCHEMA_VERSION, displayAssignments: {},
    characterIdentities: {}, characterInstances: {}, characterStates: {} });
  const legacy = legacyProjectSchema.safeParse(value);
  if (!legacy.success) return null;
  return projectSchema.parse({ ...legacy.data, schemaVersion: PROJECT_SCHEMA_VERSION, environmentArrangement: defaultArrangement(), displayAssignments: {},
    characterIdentities: {}, characterInstances: {}, characterStates: {} });
}
