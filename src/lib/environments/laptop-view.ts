import { Euler, Vector3 } from "three";
import type { TransformConfig } from "./environment-registry";
import { laptopVisualSpec } from "./studio-visual-spec.ts";

export type LaptopInspectionPose = { position: [number, number, number]; target: [number, number, number]; up: [number, number, number] };

/** Screen-forward viewing pose, widened to retain the bezel and laptop base in the frame. */
export function getLaptopInspectionPose(transform: TransformConfig): LaptopInspectionPose {
  const tilt = new Euler(laptopVisualSpec.screenTilt, 0, 0);
  const rotation = new Euler(...transform.rotation);
  const scale = new Vector3(...transform.scale);
  const center = new Vector3(0, 0.11 + laptopVisualSpec.screenCenter[1], laptopVisualSpec.hingeZ + laptopVisualSpec.screenCenter[2]);
  center.applyEuler(tilt).multiply(scale).applyEuler(rotation).add(new Vector3(...transform.position));
  const normal = new Vector3(0, 0, 1).applyEuler(tilt).applyEuler(rotation).normalize();
  const screenUp = new Vector3(0, 1, 0).applyEuler(tilt).applyEuler(rotation).normalize();
  const camera = center.clone().addScaledVector(normal, 1.22).addScaledVector(screenUp, 0.3);
  return { position: camera.toArray(), target: center.toArray(), up: screenUp.toArray() };
}
