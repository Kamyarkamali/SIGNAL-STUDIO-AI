export type GazeMode = "neutral" | "character" | "prop" | "camera" | "point" | "direction" | "attention";
export type GazeAttention = "listening" | "observe" | "curious" | "thinking" | "eye-contact" | "return-partner";
export type GazePreview = {
  mode: GazeMode;
  targetId?: string;
  point?: [number, number, number];
  horizontal?: number;
  vertical?: number;
  attention?: GazeAttention;
  attentionTargetKind?: "character" | "prop" | "camera";
  startedAtMs: number;
  durationSeconds: number;
  transitionSeconds: number;
};
export type GazeCapability = { head: boolean; eyes: boolean; torso: boolean; maxYaw: number; maxPitch: number; maxRoll: number; maxEyeOffset: number };
export type GazePose = { headRotation: [number, number, number]; eyeOffset: [number, number]; torsoYaw: number; reachable: boolean };
export const neutralGazePose: GazePose = { headRotation: [0, 0, 0], eyeOffset: [0, 0], torsoYaw: 0, reachable: true };
export const defaultGazeCapability: GazeCapability = { head: true, eyes: false, torso: false, maxYaw: 0.72, maxPitch: 0.38, maxRoll: 0.2, maxEyeOffset: 0.045 };
const clamp = (n: number, lo: number, hi: number) => Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : 0;
const smooth = (n: number) => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };
const sub = (a: readonly number[], b: readonly number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]] as [number, number, number];

/** Quaternion vector rotation matching Three.js XYZ Euler composition. */
export function rotateVectorByEulerXYZ(v: readonly number[], e: readonly number[]): [number, number, number] {
  const [x, y, z] = e.map((n) => n * 0.5);
  const c1 = Math.cos(x), c2 = Math.cos(y), c3 = Math.cos(z), s1 = Math.sin(x), s2 = Math.sin(y), s3 = Math.sin(z);
  const qx = s1 * c2 * c3 + c1 * s2 * s3, qy = c1 * s2 * c3 - s1 * c2 * s3;
  const qz = c1 * c2 * s3 + s1 * s2 * c3, qw = c1 * c2 * c3 - s1 * s2 * s3;
  const tx = 2 * (qy * v[2] - qz * v[1]), ty = 2 * (qz * v[0] - qx * v[2]), tz = 2 * (qx * v[1] - qy * v[0]);
  return [v[0] + qw * tx + (qy * tz - qz * ty), v[1] + qw * ty + (qz * tx - qx * tz), v[2] + qw * tz + (qx * ty - qy * tx)];
}

export type GazeTransform = { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number]; parent?: GazeTransform };
/** Applies local point, scale, rotation, translation and each parent transform in order. */
export function transformGazePoint(localPoint: readonly number[], transform: GazeTransform): [number, number, number] {
  const scaled = [localPoint[0] * transform.scale[0], localPoint[1] * transform.scale[1], localPoint[2] * transform.scale[2]] as [number, number, number];
  const rotated = rotateVectorByEulerXYZ(scaled, transform.rotation);
  const inParent = [rotated[0] + transform.position[0], rotated[1] + transform.position[1], rotated[2] + transform.position[2]] as [number, number, number];
  return transform.parent ? transformGazePoint(inParent, transform.parent) : inParent;
}

export function evaluateGazePose(input: {
  mode: GazeMode; sourceTimeSeconds: number; durationSeconds: number; transitionSeconds: number; capability: GazeCapability;
  origin: readonly number[]; rotation: readonly number[]; worldQuaternion?: readonly number[]; target?: readonly number[]; horizontal?: number; vertical?: number;
  attention?: GazeAttention; attentionTargetKind?: GazePreview["attentionTargetKind"]; fromPose?: GazePose;
}): GazePose {
  const { mode, sourceTimeSeconds, durationSeconds, transitionSeconds, capability } = input;
  if (!Number.isFinite(sourceTimeSeconds) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return { ...neutralGazePose, headRotation: [...neutralGazePose.headRotation] };
  const targetMode = mode === "character" || mode === "prop" || mode === "camera" || mode === "point" || (mode === "attention" && Boolean(input.attentionTargetKind));
  const attentionHasTarget = mode === "attention" && Boolean(input.target);
  if ((targetMode && !input.target) || (targetMode || attentionHasTarget) && (!input.target || input.target.length !== 3 || input.target.some((n) => !Number.isFinite(n)))) return { ...neutralGazePose, reachable: false };
  if (mode === "attention" && sourceTimeSeconds >= durationSeconds) return { ...neutralGazePose, headRotation: [...neutralGazePose.headRotation] };
  const progress = smooth(sourceTimeSeconds / Math.max(0.001, transitionSeconds));
  let yaw = 0, pitch = 0, roll = 0;
  if (mode === "direction") { yaw = clamp(input.horizontal ?? 0, -Math.PI, Math.PI); pitch = -clamp(input.vertical ?? 0, -Math.PI / 2, Math.PI / 2); }
  else if (mode === "attention" && attentionHasTarget) {
    const delta = sub(input.target!, input.origin);
    const q = input.worldQuaternion;
    const local = q && q.length === 4 ? rotateVectorByQuaternion(delta, [-q[0], -q[1], -q[2], q[3]]) : rotateVectorByEulerXYZ(delta, [-input.rotation[0], -input.rotation[1], -input.rotation[2]]);
    const horizontal = Math.hypot(local[0], local[2]);
    if (Math.hypot(...local) < 1e-5) return { ...neutralGazePose, reachable: true };
    yaw = Math.atan2(local[0], local[2]); pitch = -Math.atan2(local[1], Math.max(horizontal, 1e-5));
  }
  else if (mode === "attention") {
    const glance: Record<GazeAttention, [number, number, number]> = {
      listening: [0.035, 0.015, 0], observe: [0.015, 0, 0], curious: [0.2, 0.08, -0.04],
      thinking: [-0.42, 0.22, 0.06], "eye-contact": [0, -0.025, 0], "return-partner": [0.12, 0, 0],
    };
    [yaw, pitch, roll] = glance[input.attention ?? "listening"];
  } else if (targetMode) {
    const delta = sub(input.target!, input.origin);
    const q = input.worldQuaternion;
    const local = q && q.length === 4 ? rotateVectorByQuaternion(delta, [-q[0], -q[1], -q[2], q[3]]) : rotateVectorByEulerXYZ(delta, [-input.rotation[0], -input.rotation[1], -input.rotation[2]]);
    const horizontal = Math.hypot(local[0], local[2]);
    if (Math.hypot(...local) < 1e-5) return { ...neutralGazePose, reachable: true };
    yaw = Math.atan2(local[0], local[2]); pitch = -Math.atan2(local[1], Math.max(horizontal, 1e-5));
  }
  const requestedYaw = yaw, requestedPitch = pitch;
  const eyeYaw = capability.eyes ? clamp(requestedYaw, -0.28, 0.28) : 0;
  const eyePitch = capability.eyes ? clamp(requestedPitch, -0.2, 0.2) : 0;
  const headYawRequest = requestedYaw - eyeYaw, headPitchRequest = requestedPitch - eyePitch;
  yaw = clamp(headYawRequest, -capability.maxYaw, capability.maxYaw); pitch = clamp(headPitchRequest, -capability.maxPitch, capability.maxPitch); roll = clamp(roll, -capability.maxRoll, capability.maxRoll);
  let returnWeight = 1;
  if (mode === "attention") {
    const returnStart = Math.max(0, durationSeconds - Math.max(transitionSeconds, 0.1));
    if (sourceTimeSeconds > returnStart) returnWeight = 1 - smooth((sourceTimeSeconds - returnStart) / Math.max(0.1, durationSeconds - returnStart));
  }
  const from = input.fromPose ?? neutralGazePose;
  const lerp = (a: number, b: number) => (a + (b - a) * progress) * returnWeight;
  const torsoTarget = capability.torso ? clamp(requestedYaw - yaw - eyeYaw, -0.8, 0.8) : 0;
  const eyeX = capability.eyes ? eyeYaw / 0.28 * capability.maxEyeOffset : 0;
  const eyeY = capability.eyes ? eyePitch / 0.2 * capability.maxEyeOffset : 0;
  return {
    headRotation: capability.head ? [lerp(from.headRotation[0], pitch), lerp(from.headRotation[1], yaw), lerp(from.headRotation[2], roll)] : [0, 0, 0],
    eyeOffset: [lerp(from.eyeOffset[0], eyeX), lerp(from.eyeOffset[1], eyeY)], torsoYaw: lerp(from.torsoYaw, torsoTarget),
    reachable: Math.abs(requestedYaw - (yaw + eyeYaw + torsoTarget)) < 0.02 && Math.abs(requestedPitch - (pitch + eyePitch)) < 0.02,
  };
}

export function rotateVectorByQuaternion(v: readonly number[], q: readonly number[]): [number, number, number] {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}

export function gazePoseAt(preview: GazePreview, sourceTimeSeconds: number, capability: GazeCapability, resolvedTarget?: readonly number[], origin: readonly number[] = [0, 0, 0], rotation: readonly number[] = [0, 0, 0], worldQuaternion?: readonly number[], fromPose?: GazePose): GazePose {
  const elapsed = Math.max(0, sourceTimeSeconds - preview.startedAtMs / 1000);
  return evaluateGazePose({ ...preview, sourceTimeSeconds: elapsed, target: resolvedTarget, origin, rotation, worldQuaternion, capability, fromPose });
}

/** Gaze and gesture share the head pivot additively, while remaining under the model's safe local limits. */
export function composeGazeHeadRotation(previewRotation: readonly number[], gaze: GazePose, capability: GazeCapability): [number, number, number] {
  return [
    clamp((previewRotation[0] ?? 0) + gaze.headRotation[0], -capability.maxPitch, capability.maxPitch),
    clamp((previewRotation[1] ?? 0) + gaze.headRotation[1], -capability.maxYaw, capability.maxYaw),
    clamp((previewRotation[2] ?? 0) + gaze.headRotation[2], -capability.maxRoll, capability.maxRoll),
  ];
}

export function supportedGazeCapability(model: { glb?: unknown; capabilities: { animationCapabilities: readonly string[]; gaze?: GazeCapability }; attachmentPoints: readonly string[] }): GazeCapability | null {
  if (model.glb) return null;
  const head = model.capabilities.animationCapabilities.includes("head-rotation") && model.attachmentPoints.includes("head-pivot");
  const eyes = model.capabilities.animationCapabilities.includes("eyes") && model.attachmentPoints.includes("left-iris-gaze") && model.attachmentPoints.includes("right-iris-gaze");
  const torso = model.capabilities.animationCapabilities.includes("body") && model.attachmentPoints.includes("torso-pivot");
  const declared = model.capabilities.gaze;
  if (!declared || (declared.head && !head) || (declared.eyes && !eyes) || (declared.torso && !torso)) return null;
  return { ...declared, head: declared.head && head, eyes: declared.eyes && eyes, torso: declared.torso && torso };
}
