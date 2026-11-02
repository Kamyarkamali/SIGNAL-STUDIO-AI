import type { Vec3 } from "./environment-registry.ts";

// Local-space dimensions; the persisted laptop origin and its default transform stay unchanged.
export const laptopVisualSpec: {
  baseSize: Vec3;
  hingeZ: number;
  screenFrameSize: Vec3;
  screenSurfaceSize: [number, number];
  screenCenter: Vec3;
  screenTilt: number;
  keyboardCenterZ: number;
} = {
  baseSize: [0.93, 0.045, 0.62],
  hingeZ: -0.29,
  screenFrameSize: [0.9, 0.47, 0.035],
  screenSurfaceSize: [0.81, 0.382],
  screenCenter: [0, 0.235, 0.022],
  screenTilt: -0.16,
  keyboardCenterZ: 0.075,
};

// Keep chair render geometry and character placement anchors on the same seat plane.
export const studioChairVisualSpec = {
  seatCenterY: 0.59,
  seatThickness: 0.16,
  get seatSurfaceY() { return this.seatCenterY + this.seatThickness / 2; },
};
