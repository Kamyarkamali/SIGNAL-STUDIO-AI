import type { SceneDefinition } from "./scene-schema.ts";

export type SceneTimeEntry = { sceneId: string; startFrame: number; endFrame: number };
export type ResolvedSceneTime = { sceneId: string; sceneIndex: number; startFrame: number; endFrame: number; localFrame: number };

export function clampFrame(frame: number, totalFrames: number): number {
  const total = Number.isSafeInteger(totalFrames) && totalFrames > 0 ? totalFrames : 0;
  if (!Number.isFinite(frame)) return 0;
  return Math.max(0, Math.min(total, Math.floor(frame)));
}

export function computeSceneOffsets(sceneOrder: readonly string[], scenes: Readonly<Record<string, SceneDefinition>>): SceneTimeEntry[] {
  const entries: SceneTimeEntry[] = [];
  let cursor = 0;
  for (const sceneId of sceneOrder) {
    const scene = scenes[sceneId];
    if (!scene) continue;
    const startFrame = cursor;
    cursor += scene.durationFrames;
    if (!Number.isSafeInteger(cursor)) throw new RangeError("Project duration exceeds the safe frame range.");
    entries.push({ sceneId, startFrame, endFrame: cursor });
  }
  return entries;
}

export function totalDurationFrames(sceneOrder: readonly string[], scenes: Readonly<Record<string, SceneDefinition>>): number {
  const offsets = computeSceneOffsets(sceneOrder, scenes);
  return offsets.at(-1)?.endFrame ?? 0;
}

/** Internal boundaries are half-open: an exact boundary belongs to the following scene. The episode end belongs to the last scene. */
export function resolveSceneTime(frame: number, sceneOrder: readonly string[], scenes: Readonly<Record<string, SceneDefinition>>): ResolvedSceneTime | null {
  const offsets = computeSceneOffsets(sceneOrder, scenes);
  if (!offsets.length) return null;
  const total = offsets[offsets.length - 1]!.endFrame;
  const clamped = clampFrame(frame, total);
  if (clamped === total) {
    const last = offsets[offsets.length - 1]!;
    return { ...last, sceneIndex: sceneOrder.indexOf(last.sceneId), localFrame: last.endFrame - last.startFrame };
  }
  const index = offsets.findIndex((entry) => clamped >= entry.startFrame && clamped < entry.endFrame);
  if (index < 0) return null;
  const entry = offsets[index]!;
  return { ...entry, sceneIndex: sceneOrder.indexOf(entry.sceneId), localFrame: clamped - entry.startFrame };
}

export function sceneLocalToGlobalFrame(sceneId: string, localFrame: number, sceneOrder: readonly string[], scenes: Readonly<Record<string, SceneDefinition>>): number {
  const entry = computeSceneOffsets(sceneOrder, scenes).find((item) => item.sceneId === sceneId);
  const scene = scenes[sceneId];
  if (!entry || !scene) return 0;
  return entry.startFrame + Math.max(0, Math.min(scene.durationFrames, Math.floor(Number.isFinite(localFrame) ? localFrame : 0)));
}

export function secondsToFrames(seconds: number, fps: number): number {
  if (!Number.isFinite(seconds) || !Number.isFinite(fps) || fps <= 0) return 0;
  return Math.max(0, Math.round(seconds * fps));
}

export function formatTimecode(frame: number, fps: number): string {
  const safeFps = Number.isInteger(fps) && fps > 0 ? fps : 30;
  const safeFrame = Math.max(0, Math.floor(Number.isFinite(frame) ? frame : 0));
  const frames = safeFrame % safeFps;
  const totalSeconds = Math.floor(safeFrame / safeFps);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}
