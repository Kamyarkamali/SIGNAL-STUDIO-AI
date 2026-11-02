import type { SpeakerRegion } from "./audio-schema.ts";

export function splitSpeakerRegion(
  region: SpeakerRegion,
  secondId: string,
): { first: SpeakerRegion; second: SpeakerRegion } | null {
  if (!secondId || region.endSeconds - region.startSeconds < 0.02) return null;
  const middle = (region.startSeconds + region.endSeconds) / 2;
  return {
    first: { ...region, endSeconds: middle },
    second: { ...region, id: secondId, startSeconds: middle },
  };
}

export function mergeAdjacentSpeakerRegions(
  previous: SpeakerRegion,
  current: SpeakerRegion,
): SpeakerRegion | null {
  if (
    previous.audioClipId !== current.audioClipId ||
    Math.abs(previous.endSeconds - current.startSeconds) > 0.001 ||
    previous.speakerId !== current.speakerId ||
    previous.status !== current.status
  )
    return null;
  return { ...previous, endSeconds: current.endSeconds };
}
