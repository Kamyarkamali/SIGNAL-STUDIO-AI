import type {
  AudioClip,
  AudioProjectCollections,
  SpeakerRegion,
} from "./audio-schema.ts";
import { audioClipFrameRange } from "../scenes/timeline-projection.ts";

export function timelineClientXToFrame(
  clientX: number,
  contentLeft: number,
  contentWidth: number,
  totalFrames: number,
): number | null {
  if (
    ![clientX, contentLeft, contentWidth, totalFrames].every(Number.isFinite) ||
    contentWidth <= 0 ||
    totalFrames < 0
  )
    return null;
  const fraction = Math.max(
    0,
    Math.min(1, (clientX - contentLeft) / contentWidth),
  );
  return Math.max(
    0,
    Math.min(Math.floor(totalFrames), Math.round(fraction * totalFrames)),
  );
}

export function snapTimelineFrame(
  frame: number,
  targets: readonly number[],
  thresholdFrames = 5,
): number {
  const nearest = targets
    .filter(Number.isSafeInteger)
    .reduce<
      number | null
    >((best, target) => (best === null || Math.abs(target - frame) < Math.abs(best - frame) ? target : best), null);
  return nearest !== null && Math.abs(nearest - frame) <= thresholdFrames
    ? nearest
    : frame;
}

export function moveAudioClip(
  audio: AudioProjectCollections,
  clipId: string,
  startFrame: number,
): AudioProjectCollections {
  const clip = audio.audioClips[clipId];
  if (!clip || !Number.isSafeInteger(startFrame) || startFrame < 0)
    return audio;
  return {
    ...audio,
    audioClips: { ...audio.audioClips, [clipId]: { ...clip, startFrame } },
  };
}

export function trimAudioClip(
  audio: AudioProjectCollections,
  clipId: string,
  edge: "start" | "end",
  frame: number,
  fps: number,
): AudioProjectCollections {
  const clip = audio.audioClips[clipId];
  if (
    !clip ||
    !Number.isSafeInteger(frame) ||
    frame < 0 ||
    !Number.isFinite(fps) ||
    fps <= 0
  )
    return audio;
  const range = audioClipFrameRange(clip, fps);
  if (edge === "start") {
    if (frame <= clip.startFrame || frame >= range.endFrame - 1) return audio;
    const delta = (frame - clip.startFrame) / fps;
    const sourceStartSeconds = clip.sourceStartSeconds + delta;
    const speakerRegions = { ...audio.speakerRegions };
    for (const [id, region] of Object.entries(speakerRegions))
      if (region.audioClipId === clipId) {
        if (region.endSeconds <= sourceStartSeconds) delete speakerRegions[id];
        else if (region.startSeconds < sourceStartSeconds)
          speakerRegions[id] = { ...region, startSeconds: sourceStartSeconds };
      }
    return {
      ...audio,
      audioClips: {
        ...audio.audioClips,
        [clipId]: { ...clip, startFrame: frame, sourceStartSeconds },
      },
      speakerRegions,
    };
  }
  if (frame <= range.startFrame || frame >= range.endFrame) return audio;
  const sourceEndSeconds =
    clip.sourceStartSeconds + (frame - clip.startFrame) / fps;
  const speakerRegions = { ...audio.speakerRegions };
  for (const [id, region] of Object.entries(speakerRegions))
    if (region.audioClipId === clipId) {
      if (region.startSeconds >= sourceEndSeconds) delete speakerRegions[id];
      else if (region.endSeconds > sourceEndSeconds)
        speakerRegions[id] = { ...region, endSeconds: sourceEndSeconds };
    }
  return {
    ...audio,
    audioClips: {
      ...audio.audioClips,
      [clipId]: { ...clip, sourceEndSeconds },
    },
    speakerRegions,
  };
}

export function splitAudioClip(
  audio: AudioProjectCollections,
  clipId: string,
  frame: number,
  fps: number,
  createId: () => string,
): AudioProjectCollections {
  const clip = audio.audioClips[clipId];
  if (
    !clip ||
    !Number.isSafeInteger(frame) ||
    !Number.isFinite(fps) ||
    fps <= 0
  )
    return audio;
  const range = audioClipFrameRange(clip, fps);
  if (frame <= range.startFrame || frame >= range.endFrame) return audio;
  const splitSeconds =
    clip.sourceStartSeconds + (frame - clip.startFrame) / fps;
  const rightId = createId();
  const rightClip: AudioClip = {
    ...clip,
    id: rightId,
    startFrame: frame,
    sourceStartSeconds: splitSeconds,
  };
  const audioClips = {
    ...audio.audioClips,
    [rightId]: rightClip,
    [clipId]: { ...clip, sourceEndSeconds: splitSeconds },
  };
  const speakerRegions = { ...audio.speakerRegions };
  for (const [id, region] of Object.entries(speakerRegions))
    if (region.audioClipId === clipId) {
      if (region.startSeconds >= splitSeconds)
        speakerRegions[id] = { ...region, audioClipId: rightId };
      else if (region.endSeconds > splitSeconds) {
        const rightRegion: SpeakerRegion = {
          ...region,
          id: createId(),
          audioClipId: rightId,
          startSeconds: splitSeconds,
        };
        speakerRegions[id] = { ...region, endSeconds: splitSeconds };
        speakerRegions[rightRegion.id] = rightRegion;
      }
    }
  return { ...audio, audioClips, speakerRegions };
}

export function canMergeAudioClips(
  first: AudioClip,
  second: AudioClip,
  fps: number,
): boolean {
  if (
    first.assetId !== second.assetId ||
    first.muted !== second.muted ||
    first.gain !== second.gain ||
    !Number.isFinite(fps) ||
    fps <= 0
  )
    return false;
  const [left, right] = [first, second].sort(
    (a, b) => a.startFrame - b.startFrame,
  );
  const leftEndFrame = audioClipFrameRange(left, fps).endFrame;
  return (
    leftEndFrame === right.startFrame &&
    Math.abs(left.sourceEndSeconds - right.sourceStartSeconds) <= 1 / fps
  );
}

export function mergeAudioClips(
  audio: AudioProjectCollections,
  firstId: string,
  secondId: string,
  fps: number,
  speakerChoice: "preserve" | "unknown",
  createId: () => string,
): AudioProjectCollections {
  const first = audio.audioClips[firstId],
    second = audio.audioClips[secondId];
  if (
    !first ||
    !second ||
    firstId === secondId ||
    !canMergeAudioClips(first, second, fps)
  )
    return audio;
  const [left, right] = [first, second].sort(
    (a, b) => a.startFrame - b.startFrame,
  );
  const merged: AudioClip = {
    ...left,
    sourceEndSeconds: right.sourceEndSeconds,
  };
  const audioClips = { ...audio.audioClips, [left.id]: merged };
  delete audioClips[right.id];
  const speakerRegions = { ...audio.speakerRegions };
  const regions = Object.values(speakerRegions).filter(
    (region) =>
      region.audioClipId === left.id || region.audioClipId === right.id,
  );
  for (const region of regions) {
    if (region.audioClipId === right.id)
      speakerRegions[region.id] = { ...region, audioClipId: left.id };
  }
  if (
    speakerChoice === "unknown" &&
    regions.some((region) => region.status === "assigned")
  ) {
    for (const region of regions) delete speakerRegions[region.id];
    const unknown: SpeakerRegion = {
      id: createId(),
      audioClipId: left.id,
      startSeconds: left.sourceStartSeconds,
      endSeconds: right.sourceEndSeconds,
      speakerId: null,
      status: "unknown",
    };
    speakerRegions[unknown.id] = unknown;
  }
  return { ...audio, audioClips, speakerRegions };
}
