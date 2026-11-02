import type { AudioClip, SpeakerRegion } from "@/lib/audio/audio-schema";

export type FrameRange = { startFrame: number; endFrame: number };

export function audioClipFrameRange(clip: AudioClip, fps: number): FrameRange {
  const durationFrames = Math.max(1, Math.round((clip.sourceEndSeconds - clip.sourceStartSeconds) * fps));
  return { startFrame: clip.startFrame, endFrame: clip.startFrame + durationFrames };
}

/** Maps project-frame playback to the clip's original source seconds, with a half-open clip range. */
export function audioSourceTimeAtProjectFrame(clip: AudioClip, frame: number, fps: number): number | null {
  if (!Number.isSafeInteger(frame) || !Number.isFinite(fps) || fps <= 0) return null;
  const range = audioClipFrameRange(clip, fps);
  if (frame < range.startFrame || frame >= range.endFrame) return null;
  return clip.sourceStartSeconds + (frame - clip.startFrame) / fps;
}

export function speakerRegionFrameRange(clip: AudioClip, region: SpeakerRegion, fps: number): FrameRange {
  const startFrame = clip.startFrame + Math.round((region.startSeconds - clip.sourceStartSeconds) * fps);
  const durationFrames = Math.max(1, Math.round((region.endSeconds - region.startSeconds) * fps));
  return { startFrame, endFrame: startFrame + durationFrames };
}

export function speakerRegionsAtFrame(clips: readonly AudioClip[], regions: readonly SpeakerRegion[], frame: number, fps: number) {
  const clipById = new Map(clips.map((clip) => [clip.id, clip]));
  return regions.flatMap((region) => {
    const clip = clipById.get(region.audioClipId);
    if (!clip) return [];
    const range = speakerRegionFrameRange(clip, region, fps);
    return frame >= range.startFrame && frame < range.endFrame ? [{ clip, region, range }] : [];
  }).sort((a, b) => a.range.startFrame - b.range.startFrame || a.region.id.localeCompare(b.region.id));
}
