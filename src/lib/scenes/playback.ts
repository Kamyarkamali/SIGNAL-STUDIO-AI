import { clampFrame } from "./scene-time.ts";

export type PlaybackStatus = "stopped" | "playing" | "paused" | "ended";
export type ScenePlaybackState = { frame: number; status: PlaybackStatus };

export function startPlayback(state: ScenePlaybackState, totalFrames: number): ScenePlaybackState {
  if (!totalFrames) return { frame: 0, status: "stopped" };
  return { frame: state.frame >= totalFrames ? 0 : clampFrame(state.frame, totalFrames), status: "playing" };
}

export function pausePlayback(state: ScenePlaybackState): ScenePlaybackState {
  return state.status === "playing" ? { ...state, status: "paused" } : state;
}

export function stopPlayback(): ScenePlaybackState { return { frame: 0, status: "stopped" }; }

export function seekPlayback(state: ScenePlaybackState, frame: number, totalFrames: number): ScenePlaybackState {
  return { frame: clampFrame(frame, totalFrames), status: state.status === "stopped" ? "stopped" : "paused" };
}

/** Compute from the monotonic start timestamp; no accumulated frame deltas enter timeline truth. */
export function playbackFrameAt(startFrame: number, elapsedMilliseconds: number, fps: number, totalFrames: number): number {
  const elapsed = Number.isFinite(elapsedMilliseconds) ? Math.max(0, elapsedMilliseconds) : 0;
  const frameRate = Number.isFinite(fps) && fps > 0 ? fps : 30;
  return clampFrame(startFrame + Math.floor(elapsed * frameRate / 1000), totalFrames);
}
