import { z } from "zod";

export const PROJECT_SCHEMA_VERSION = 1;
export const PROJECT_MAX_BYTES = 1024 * 1024;
export const REQUEST_MAX_BYTES = 16 * 1024;

export const projectIdSchema = z.uuid();
export const projectNameSchema = z.string().trim().min(1, "نام پروژه لازم است.").max(80, "نام پروژه نباید بیش از ۸۰ نویسه باشد.")
  .refine((name) => [...name].every((character) => character === "\u200c" || !/[\p{Cc}\p{Cf}]/u.test(character)), "نام پروژه نویسهٔ نامعتبر دارد.")
  .transform((name) => name.normalize("NFC"));

export const assetKinds = ["audio", "character-model", "environment-model", "prop-model", "texture", "animation", "thumbnail"] as const;
export type AssetKind = (typeof assetKinds)[number];
export const assetDirectories: Record<AssetKind, string> = {
  audio: "audio",
  "character-model": "character-models",
  "environment-model": "environment-models",
  "prop-model": "prop-models",
  texture: "textures",
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
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  origin: z.enum(["built-in", "imported"]),
}).strict().superRefine((asset, context) => {
  const segments = asset.relativePath.split("/");
  if (segments.length !== 3 || segments[0] !== "assets" || segments[1] !== assetDirectories[asset.kind] ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(segments[2]) || segments[2].includes("..")) {
    context.addIssue({ code: "custom", message: "مسیر دارایی نامعتبر است." });
  }
});

export type AssetRecord = z.infer<typeof assetRecordSchema>;

const emptyCollection = z.record(z.string(), z.never());
export const projectSchema = z.object({
  schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
  id: projectIdSchema,
  title: projectNameSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  revision: z.number().int().nonnegative(),
  fps: z.literal(30),
  resolution: z.object({ width: z.literal(1280), height: z.literal(720) }).strict(),
  sceneOrder: z.array(z.never()),
  scenes: emptyCollection,
  characters: emptyCollection,
  speakers: emptyCollection,
  audioClips: emptyCollection,
  tracks: emptyCollection,
  events: emptyCollection,
  assetManifest: z.record(z.uuid(), assetRecordSchema),
  exportSettings: z.object({ fps: z.literal(30), width: z.literal(1280), height: z.literal(720) }).strict(),
}).strict().superRefine((project, context) => {
  for (const [id, asset] of Object.entries(project.assetManifest)) {
    if (id !== asset.id) context.addIssue({ code: "custom", message: "شناسهٔ دارایی ناسازگار است." });
  }
});

export type ProjectDocument = z.infer<typeof projectSchema>;
export type ProjectSummary = Pick<ProjectDocument, "id" | "title" | "createdAt" | "updatedAt" | "revision">;

export const createInputSchema = z.object({ title: projectNameSchema }).strict();
export const saveInputSchema = z.object({ title: projectNameSchema, expectedRevision: z.number().int().nonnegative() }).strict();
export const deleteInputSchema = z.object({ expectedRevision: z.number().int().nonnegative() }).strict();

export function newProject(id: string, title: string, now = new Date()): ProjectDocument {
  const timestamp = now.toISOString();
  return projectSchema.parse({
    schemaVersion: PROJECT_SCHEMA_VERSION, id, title, createdAt: timestamp, updatedAt: timestamp, revision: 0,
    fps: 30, resolution: { width: 1280, height: 720 }, sceneOrder: [], scenes: {}, characters: {}, speakers: {},
    audioClips: {}, tracks: {}, events: {}, assetManifest: {}, exportSettings: { fps: 30, width: 1280, height: 720 },
  });
}
