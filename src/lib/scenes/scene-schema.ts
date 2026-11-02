import { z } from "zod";
import { productionCameraSchema } from "../camera/production-camera.ts";
import { characterTransformSchema } from "../characters/character-schema.ts";
import { studioLightingSchema } from "../environments/arrangement.ts";
import { propInstanceSchema } from "../environments/arrangement.ts";

export const PROJECT_FRAME_RATES = [24, 25, 30, 50, 60] as const;
export const projectFrameRateSchema = z.union([z.literal(24), z.literal(25), z.literal(30), z.literal(50), z.literal(60)]);
export const MAX_SCENE_DURATION_FRAMES = 1_000_000;
export const SCENE_TYPES = ["dialogue", "educational", "reaction", "establishing"] as const;
export const sceneTypeSchema = z.enum(SCENE_TYPES);

export const futureTrackKinds = [
  "character-presence", "animation", "facial-expression", "gaze", "audio", "dialogue",
  "production-camera", "educational-content", "subtitles", "prop-interaction",
] as const;

export const sceneActionTypes = [
  "head-turn", "head-nod", "quick-nod", "head-shake", "arm-gesture", "hand-wave", "explain",
  "happy", "excited", "surprised", "sad", "angry", "worried", "confused", "thinking",
  "listening", "agreeing", "disagreeing", "laughing", "celebrating", "return-idle",
  "gaze-character", "gaze-prop",
] as const;
export const sceneActionEventSchema = z.object({
  id: z.uuid(),
  sceneId: z.uuid(),
  characterInstanceId: z.uuid(),
  action: z.enum(sceneActionTypes),
  startFrame: z.number().int().safe().min(0).max(MAX_SCENE_DURATION_FRAMES),
  durationFrames: z.number().int().safe().min(1).max(MAX_SCENE_DURATION_FRAMES),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(-100).max(100).default(0),
  intensity: z.number().finite().min(0.25).max(1.5).default(1),
  speed: z.number().finite().min(0.5).max(2).default(1),
  targetKind: z.enum(["character", "prop"]).optional(),
  targetId: z.string().trim().min(1).max(120).optional(),
}).strict().superRefine((event, context) => {
  if ((event.action === "gaze-character" || event.action === "gaze-prop") && (!event.targetId || event.targetKind !== (event.action === "gaze-character" ? "character" : "prop"))) {
    context.addIssue({ code: "custom", message: "Gaze events require a matching stable scene target." });
  }
  if (event.action !== "gaze-character" && event.action !== "gaze-prop" && (event.targetId || event.targetKind)) {
    context.addIssue({ code: "custom", message: "Only gaze events can reference a target." });
  }
});

// Phase 05-A stores serializable track headers only. Timed event editing belongs to later phases.
export const sceneTrackSchema = z.object({
  id: z.uuid(),
  kind: z.enum(futureTrackKinds),
  name: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
}).strict();

export const sceneCameraTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("character-instance"), id: z.uuid() }).strict(),
  z.object({ kind: z.literal("prop-instance"), id: z.string().trim().min(1).max(100) }).strict(),
  z.object({ kind: z.literal("laptop"), id: z.string().trim().min(1).max(100) }).strict(),
  z.object({ kind: z.literal("whiteboard"), id: z.string().trim().min(1).max(100) }).strict(),
]);

export const sceneCameraSchema = productionCameraSchema.safeExtend({
  // Rotation is stored in radians as an authored pose option; look-at remains the default orientation source.
  rotation: z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]).default([0, 0, 0]),
  orientationMode: z.enum(["look-at", "rotation"]).default("look-at"),
  zoom: z.number().finite().min(0.1).max(10).default(1),
  shotType: z.enum(["wide", "medium", "close-up", "pov"]).default("wide"),
  framing: z.enum(["landscape-16:9", "portrait-9:16"]).default("landscape-16:9"),
  targetRef: sceneCameraTargetSchema.optional(),
}).strict();

export const sceneCharacterSchema = z.object({
  visible: z.boolean().default(true),
  transform: characterTransformSchema,
  placementAnchorId: z.string().min(1).max(120).nullable().optional(),
}).strict();
export const scenePropOverrideSchema = z.object({
  visible: z.boolean().optional(),
  transform: propInstanceSchema.shape.transform.optional(),
  removed: z.boolean().optional(),
  added: propInstanceSchema.optional(),
  decoration: propInstanceSchema.shape.decoration.nullable().optional(),
}).strict();

export const sceneDefinitionSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().max(1000).default(""),
  sceneType: sceneTypeSchema.optional(),
  durationFrames: z.number().int().safe().min(1).max(MAX_SCENE_DURATION_FRAMES),
  environmentId: z.string().trim().min(1).max(120).optional(),
  characters: z.record(z.uuid(), sceneCharacterSchema).default(() => ({})),
  propOverrides: z.record(z.string().min(1).max(100), scenePropOverrideSchema).default(() => ({})),
  lightingOverride: studioLightingSchema.optional(),
  productionCamera: sceneCameraSchema,
  tracks: z.array(sceneTrackSchema).max(200),
  actionEvents: z.array(sceneActionEventSchema).max(5000).default([]),
  directionNotes: z.string().max(4000),
}).strict().superRefine((scene, context) => {
  const ids = new Set<string>();
  for (const track of scene.tracks) {
    if (ids.has(track.id)) context.addIssue({ code: "custom", message: "Scene track IDs must be unique." });
    ids.add(track.id);
  }
  const eventIds = new Set<string>();
  for (const event of scene.actionEvents) {
    if (event.sceneId !== scene.id) context.addIssue({ code: "custom", message: "Scene action event references a different scene." });
    if (eventIds.has(event.id)) context.addIssue({ code: "custom", message: "Scene action event IDs must be unique." });
    eventIds.add(event.id);
    if (event.startFrame + event.durationFrames > scene.durationFrames) context.addIssue({ code: "custom", message: "Scene action events must fit within the scene duration." });
  }
});

export const sceneOrderSchema = z.array(z.uuid()).max(500);
export const scenesSchema = z.record(z.uuid(), sceneDefinitionSchema);

export type SceneDefinition = z.infer<typeof sceneDefinitionSchema>;
export type SceneCameraConfig = z.infer<typeof sceneCameraSchema>;
export type SceneCharacterConfig = z.infer<typeof sceneCharacterSchema>;
export type ScenePropOverride = z.infer<typeof scenePropOverrideSchema>;
export type SceneActionEvent = z.infer<typeof sceneActionEventSchema>;

export function defaultSceneCamera(): SceneCameraConfig {
  return { position: [4, 3, 6], target: [0, 0.75, 0], fov: 45, near: 0.1, far: 100,
    rotation: [0, 0, 0], orientationMode: "look-at", zoom: 1, shotType: "wide", framing: "landscape-16:9" };
}
