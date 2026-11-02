import type { ProductionCameraConfig } from "../camera/production-camera.ts";
import type { SceneCameraConfig } from "./scene-schema";

/** The editor's FOV is already the effective FOV; a previous scene zoom must not apply twice. */
export function captureSceneCamera(current: SceneCameraConfig, editor: ProductionCameraConfig): SceneCameraConfig {
  return { ...current, ...editor, zoom: 1, orientationMode: "look-at", targetRef: undefined };
}
