import { z } from "zod";

const frame = z.number().int().nonnegative().safe();
const seconds = z.number().finite().min(0).max(86_400);

export const speakerSchema = z.discriminatedUnion("kind", [
  z
    .object({
      id: z.uuid(),
      kind: z.literal("character"),
      characterId: z.uuid(),
      name: z.string().trim().min(1).max(80),
    })
    .strict(),
  z
    .object({
      id: z.uuid(),
      kind: z.literal("audio-only"),
      name: z.string().trim().min(1).max(80),
    })
    .strict(),
]);

export const audioClipSchema = z
  .object({
    id: z.uuid(),
    assetId: z.uuid(),
    startFrame: frame,
    sourceStartSeconds: seconds,
    sourceEndSeconds: seconds.min(Number.MIN_VALUE),
    gain: z.number().finite().min(0).max(2),
    muted: z.boolean(),
  })
  .strict()
  .refine(
    (clip) => clip.sourceEndSeconds > clip.sourceStartSeconds,
    "بازهٔ برش صدا باید بزرگ‌تر از صفر باشد.",
  );

export const speakerRegionSchema = z
  .object({
    id: z.uuid(),
    audioClipId: z.uuid(),
    startSeconds: seconds,
    endSeconds: seconds.min(Number.MIN_VALUE),
    speakerId: z.uuid().nullable(),
    status: z.enum(["assigned", "unknown", "silence"]),
    text: z.string().max(1000).optional(),
  })
  .strict()
  .refine(
    (region) => region.endSeconds > region.startSeconds,
    "پایان بازه باید بعد از شروع آن باشد.",
  )
  .refine(
    (region) => region.status !== "assigned" || region.speakerId !== null,
    "برای بازهٔ گوینده، یک هویت گوینده انتخاب کنید.",
  )
  .refine(
    (region) => region.status === "assigned" || region.speakerId === null,
    "بازهٔ نامشخص یا سکوت نباید گوینده داشته باشد.",
  );

export const audioProjectCollectionsSchema = z.object({
  speakers: z.record(z.uuid(), speakerSchema),
  audioClips: z.record(z.uuid(), audioClipSchema),
  speakerRegions: z.record(z.uuid(), speakerRegionSchema),
});

export type Speaker = z.infer<typeof speakerSchema>;
export type AudioClip = z.infer<typeof audioClipSchema>;
export type SpeakerRegion = z.infer<typeof speakerRegionSchema>;
export type AudioProjectCollections = z.infer<
  typeof audioProjectCollectionsSchema
>;

export function validateAudioCollections(
  collections: AudioProjectCollections,
  audioAssets: Readonly<Record<string, { audioDurationSeconds?: number }>>,
  characterIds: ReadonlySet<string>,
) {
  const issues: string[] = [];
  for (const [id, speaker] of Object.entries(collections.speakers)) {
    if (speaker.id !== id) issues.push("شناسهٔ گوینده با کلید آن یکسان نیست.");
    if (speaker.kind === "character" && !characterIds.has(speaker.characterId))
      issues.push("گوینده به هویت شخصیتی ناموجود ارجاع می‌دهد.");
  }
  for (const [id, clip] of Object.entries(collections.audioClips)) {
    if (clip.id !== id) issues.push("شناسهٔ کلیپ صوتی با کلید آن یکسان نیست.");
    const duration = audioAssets[clip.assetId]?.audioDurationSeconds;
    if (duration === undefined)
      issues.push("کلیپ به فایل صوتی موجود در همین پروژه ارجاع نمی‌دهد.");
    else if (clip.sourceEndSeconds > duration)
      issues.push("پایان برش کلیپ از مدت فایل صوتی بیشتر است.");
  }
  const byClip = new Map<string, SpeakerRegion[]>();
  for (const [id, region] of Object.entries(collections.speakerRegions)) {
    if (region.id !== id)
      issues.push("شناسهٔ بازهٔ گوینده با کلید آن یکسان نیست.");
    const clip = collections.audioClips[region.audioClipId];
    if (!clip) {
      issues.push("بازهٔ گوینده به کلیپ موجود ارجاع نمی‌دهد.");
      continue;
    }
    if (
      region.startSeconds < clip.sourceStartSeconds ||
      region.endSeconds > clip.sourceEndSeconds
    )
      issues.push("بازهٔ گوینده باید داخل محدودهٔ کلیپ باشد.");
    if (region.speakerId && !collections.speakers[region.speakerId])
      issues.push("بازه به گویندهٔ موجود ارجاع نمی‌دهد.");
    const list = byClip.get(region.audioClipId) ?? [];
    list.push(region);
    byClip.set(region.audioClipId, list);
  }
  for (const regions of byClip.values()) {
    regions.sort(
      (a, b) => a.startSeconds - b.startSeconds || a.id.localeCompare(b.id),
    );
    for (let index = 1; index < regions.length; index++)
      if (regions[index]!.startSeconds < regions[index - 1]!.endSeconds) {
        issues.push("بازه‌های یک فایل ترکیبی نباید هم‌پوشانی داشته باشند.");
        break;
      }
  }
  return issues;
}
