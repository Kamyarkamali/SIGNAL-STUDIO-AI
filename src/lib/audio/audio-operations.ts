import type { AudioProjectCollections, SpeakerRegion } from "./audio-schema.ts";

export function updateSpeakerRegion(
  current: AudioProjectCollections,
  regionId: string,
  change: Partial<SpeakerRegion>,
  identities: Readonly<Record<string, { id: string; name: string }>>,
  newSpeakerId: () => string,
): AudioProjectCollections {
  const region = current.speakerRegions[regionId];
  if (!region) return current;
  const requestedId = change.speakerId === undefined ? region.speakerId : change.speakerId;
  const identity = requestedId ? identities[requestedId] : undefined;
  const existing = identity ? Object.values(current.speakers).find((speaker) => speaker.kind === "character" && speaker.characterId === identity.id) : undefined;
  const speaker = identity && !existing ? { id: newSpeakerId(), kind: "character" as const, characterId: identity.id, name: identity.name } : undefined;
  const status = change.status ?? region.status;
  const speakerId = status === "assigned" ? speaker?.id ?? existing?.id ?? requestedId : null;
  return {
    ...current,
    speakers: speaker ? { ...current.speakers, [speaker.id]: speaker } : current.speakers,
    speakerRegions: { ...current.speakerRegions, [regionId]: { ...region, ...change, status, speakerId } },
  };
}

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
