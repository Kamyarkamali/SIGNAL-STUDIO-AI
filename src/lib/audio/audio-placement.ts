import type { AudioClip } from "./audio-schema.ts";
import {
  audioClipFrameRange,
  type FrameRange,
} from "../scenes/timeline-projection.ts";

export type SceneClipRelation = "inside" | "spans" | "before" | "after";

/** The upload endpoint has already validated a newly uploaded asset even if the current React render has an older manifest snapshot. */
export function isAudioAssetAvailable(
  assetKind: string | undefined,
  uploadVerified = false,
): boolean {
  return uploadVerified || assetKind === "audio";
}

export function sceneLocalPlacementToGlobalFrame(
  sceneStartFrame: number,
  sceneDurationFrames: number,
  localFrame: number,
): number | null {
  if (
    ![sceneStartFrame, sceneDurationFrames, localFrame].every(
      Number.isSafeInteger,
    )
  )
    return null;
  if (
    sceneStartFrame < 0 ||
    sceneDurationFrames <= 0 ||
    localFrame < 0 ||
    localFrame >= sceneDurationFrames
  )
    return null;
  const globalFrame = sceneStartFrame + localFrame;
  return Number.isSafeInteger(globalFrame) ? globalFrame : null;
}

export function sceneFrameRange(
  sceneStartFrame: number,
  sceneDurationFrames: number,
): FrameRange {
  return {
    startFrame: sceneStartFrame,
    endFrame: sceneStartFrame + sceneDurationFrames,
  };
}

export function clipSceneRelation(
  clip: AudioClip,
  sceneStartFrame: number,
  sceneDurationFrames: number,
  fps: number,
): SceneClipRelation {
  const clipRange = audioClipFrameRange(clip, fps);
  const sceneRange = sceneFrameRange(sceneStartFrame, sceneDurationFrames);
  if (clipRange.endFrame <= sceneRange.startFrame) return "before";
  if (clipRange.startFrame >= sceneRange.endFrame) return "after";
  return clipRange.startFrame >= sceneRange.startFrame &&
    clipRange.endFrame <= sceneRange.endFrame
    ? "inside"
    : "spans";
}

export function clipSourceDurationFrames(
  sourceStartSeconds: number,
  sourceEndSeconds: number,
  fps: number,
): number {
  if (
    ![sourceStartSeconds, sourceEndSeconds, fps].every(Number.isFinite) ||
    fps <= 0 ||
    sourceStartSeconds < 0 ||
    sourceEndSeconds <= sourceStartSeconds
  )
    return 0;
  return Math.max(1, Math.round((sourceEndSeconds - sourceStartSeconds) * fps));
}

/** A direct scene import becomes one persisted clip at the playhead's scene-local frame. */
export function createSceneAudioClip(input: {
  id: string;
  assetId: string;
  sceneStartFrame: number;
  sceneDurationFrames: number;
  localFrame: number;
  sourceDurationSeconds: number;
}): AudioClip | null {
  const startFrame = sceneLocalPlacementToGlobalFrame(
    input.sceneStartFrame,
    input.sceneDurationFrames,
    input.localFrame,
  );
  if (
    startFrame === null ||
    !input.id ||
    !input.assetId ||
    !Number.isFinite(input.sourceDurationSeconds) ||
    input.sourceDurationSeconds <= 0
  )
    return null;
  return {
    id: input.id,
    assetId: input.assetId,
    startFrame,
    sourceStartSeconds: 0,
    sourceEndSeconds: input.sourceDurationSeconds,
    gain: 1,
    muted: false,
  };
}
