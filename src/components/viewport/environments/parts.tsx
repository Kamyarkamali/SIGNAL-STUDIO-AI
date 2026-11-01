import type { Vec3 } from "@/lib/environments/environment-registry";

type Finish = {
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

export function BoxPart({
  size,
  position,
  rotation,
  finish,
}: {
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
  finish: Finish;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial {...finish} />
    </mesh>
  );
}

export function CylinderPart({
  radiusTop,
  radiusBottom = radiusTop,
  height,
  position,
  rotation,
  finish,
  segments = 12,
}: {
  radiusTop: number;
  radiusBottom?: number;
  height: number;
  position: Vec3;
  rotation?: Vec3;
  finish: Finish;
  segments?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, segments]} />
      <meshStandardMaterial {...finish} />
    </mesh>
  );
}
