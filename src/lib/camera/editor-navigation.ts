export type Point3 = [number, number, number];

export function focusCameraPose(input: {
  center: Point3;
  size: Point3;
  currentPosition: Point3;
  fovDegrees: number;
  aspect: number;
  preferredFront?: Point3;
  minimumDistance?: number;
}): { position: Point3; target: Point3 } {
  const aspect = Math.max(0.2, Number.isFinite(input.aspect) ? input.aspect : 1);
  const fov = Math.max(10, Math.min(100, input.fovDegrees)) * Math.PI / 180;
  const halfWidth = Math.max(0.05, input.size[0] / 2);
  const halfHeight = Math.max(0.05, input.size[1] / 2);
  const radius = Math.hypot(halfWidth, halfHeight, Math.max(0.05, input.size[2] / 2));
  const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const distance = Math.max(input.minimumDistance ?? 0.75, radius + 0.45,
    halfHeight / Math.tan(fov / 2), halfWidth / Math.tan(horizontalFov / 2)) * 1.2;
  const preferred = input.preferredFront;
  const fallback = [input.currentPosition[0] - input.center[0], 0, input.currentPosition[2] - input.center[2]] as Point3;
  const direction = normalize(preferred && length(preferred) > 0.001 ? preferred : fallback, [0, 0, 1]);
  return {
    target: [...input.center],
    position: [input.center[0] + direction[0] * distance, input.center[1] + direction[1] * distance, input.center[2] + direction[2] * distance],
  };
}

export function freeFlyStep(input: {
  position: Point3;
  forward: Point3;
  right: Point3;
  keys: ReadonlySet<string>;
  deltaSeconds: number;
  speed: number;
  fast?: boolean;
}): Point3 {
  const delta = Math.max(0, Math.min(0.05, input.deltaSeconds)) * Math.max(0.1, Math.min(20, input.speed)) * (input.fast ? 3 : 1);
  const forward = normalize([input.forward[0], 0, input.forward[2]], [0, 0, -1]);
  const right = normalize([input.right[0], 0, input.right[2]], [1, 0, 0]);
  const next: Point3 = [...input.position];
  if (input.keys.has("KeyW")) addScaled(next, forward, delta);
  if (input.keys.has("KeyS")) addScaled(next, forward, -delta);
  if (input.keys.has("KeyD")) addScaled(next, right, delta);
  if (input.keys.has("KeyA")) addScaled(next, right, -delta);
  if (input.keys.has("KeyE")) next[1] += delta;
  if (input.keys.has("KeyQ")) next[1] -= delta;
  return next;
}

function length(value: Point3) { return Math.hypot(...value); }
function normalize(value: Point3, fallback: Point3): Point3 {
  const magnitude = length(value);
  return magnitude > 0.001 ? [value[0] / magnitude, value[1] / magnitude, value[2] / magnitude] : fallback;
}
function addScaled(target: Point3, value: Point3, scale: number) {
  target[0] += value[0] * scale; target[1] += value[1] * scale; target[2] += value[2] * scale;
}
