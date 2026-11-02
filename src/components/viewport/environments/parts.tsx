import type { Vec3 } from "@/lib/environments/environment-registry";
import { RoundedBox } from "@react-three/drei";

type Finish = {
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

export function BoxPart({
  name,
  size,
  position,
  rotation,
  finish,
}: {
  name?: string;
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
  finish: Finish;
}) {
  return (
    <mesh name={name} position={position} rotation={rotation}>
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

export function RoundedBoxPart({
  size, position, rotation, finish, radius = 0.04,
}: {
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
  finish: Finish;
  radius?: number;
}) {
  return <RoundedBox args={size} radius={radius} smoothness={2} position={position} rotation={rotation}>
    <meshStandardMaterial {...finish} />
  </RoundedBox>;
}
