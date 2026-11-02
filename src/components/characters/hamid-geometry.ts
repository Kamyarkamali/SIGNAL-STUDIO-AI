import { BufferGeometry, SphereGeometry } from "three";

/** Broad, softly tapered lower face, authored independently of Kamyar's head mesh. */
export function createHamidHeadGeometry() {
  const geometry = new SphereGeometry(1, 40, 28);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const lowerFace = Math.exp(-Math.pow((y + 0.34) / 0.42, 2));
    const temple = Math.exp(-Math.pow((y - 0.2) / 0.48, 2));
    positions.setXYZ(
      index,
      x * 0.232 * (1 + 0.105 * lowerFace - 0.035 * temple),
      y * 0.284,
      z * 0.207 * (1 + 0.035 * lowerFace),
    );
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

/**
 * A single continuous shirt/torso surface. The fuller abdomen is shaped into
 * the profile itself, avoiding a separate belly sphere under the clothing.
 */
export function createHamidTorsoGeometry(fullness: number) {
  const safeFullness = clamp(fullness, 0, 1);
  const geometry = new SphereGeometry(1, 40, 28);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const belly = Math.exp(-Math.pow((y - 0.02) / 0.48, 2));
    const shoulder = Math.exp(-Math.pow((y - 0.64) / 0.27, 2));
    const hip = Math.exp(-Math.pow((y + 0.7) / 0.35, 2));
    const width =
      0.305 + 0.018 * shoulder - 0.012 * hip + safeFullness * 0.047 * belly;
    const depth = 0.205 + 0.018 * shoulder + safeFullness * 0.085 * belly;
    const frontRound = Math.max(0, z);
    positions.setXYZ(
      index,
      x * width,
      0.895 + y * 0.385,
      z * depth + safeFullness * 0.035 * belly * frontRound,
    );
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export type HamidBellyProfile = "natural" | "fuller" | "full";

export const hamidBellyFullness: Record<HamidBellyProfile, number> = {
  natural: 0.15,
  fuller: 0.62,
  full: 1,
};

/** Exported shape signature keeps model tests independent from WebGL rendering. */
export function geometryPositionSignature(geometry: BufferGeometry) {
  const values = geometry.getAttribute("position").array as Float32Array;
  return Array.from(values).join(",");
}

export function createHamidBodyProfile(fullness: number) {
  return createHamidTorsoGeometry(fullness);
}
