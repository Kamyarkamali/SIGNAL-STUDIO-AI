import type { Object3D } from "three";
import type { GazeCapability, GazePose } from "./gaze-preview.ts";
import { composeGazeHeadRotation, defaultGazeCapability } from "./gaze-preview.ts";
import type { PreviewPose } from "./animation-preview.ts";

export type RotationBaselineMap = WeakMap<Object3D, [number, number, number]>;

/** Applies deterministic local animation channels to the renderer's named pivots. */
export function applyCharacterActionPose(
  root: Object3D,
  pose: PreviewPose,
  gazePose: GazePose,
  capability: GazeCapability | null,
  baselines: RotationBaselineMap,
): void {
  const apply = (name: string, offset: [number, number, number]) => {
    const target = root.getObjectByName(name);
    if (!target) return;
    let base = baselines.get(target);
    if (!base) {
      base = [target.rotation.x, target.rotation.y, target.rotation.z];
      baselines.set(target, base);
    }
    target.rotation.set(base[0] + offset[0], base[1] + offset[1], base[2] + offset[2]);
  };

  const headRotation = composeGazeHeadRotation(pose.headRotation, gazePose, capability ?? {
    ...defaultGazeCapability, maxPitch: 0.5, maxYaw: 0.85, maxRoll: 0.25,
  });
  apply("head-pivot", headRotation);
  apply("left-arm-pivot", pose.leftArmRotation);
  apply("right-arm-pivot", pose.rightArmRotation);
  if (capability?.torso) apply("torso-pivot", [0, gazePose.torsoYaw, 0]);
}
