export { DEFAULT_PRODUCTION_CAMERA, productionCameraSchema } from "../../lib/camera/production-camera.ts";
export type { ProductionCameraConfig } from "../../lib/camera/production-camera.ts";

export const EDITOR_CAMERA = {
  position: [6.8, 3.55, 8.2] as [number, number, number],
  target: [0, 1.6, -0.9] as [number, number, number],
  fov: 48,
  near: 0.1,
  far: 100,
  minDistance: 2,
  maxDistance: 24,
};
