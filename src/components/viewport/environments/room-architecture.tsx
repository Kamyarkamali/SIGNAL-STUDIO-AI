import { BoxPart, CylinderPart } from "./parts";

const wall = { color: "#242b32", roughness: 0.92 };
const walnut = { color: "#634836", roughness: 0.78 };
const trim = { color: "#101b22", roughness: 0.64, metalness: 0.3 };

export function RoomShell() {
  return <group>
    <BoxPart size={[11.2, 0.18, 8.9]} position={[0, -0.12, 0]} finish={{ color: "#17252b", roughness: 0.95 }} />
    {Array.from({ length: 11 }, (_, index) => <BoxPart key={index} size={[0.995, 0.025, 8.72]}
      position={[-5.0 + index, -0.015, 0]} finish={{ color: index % 3 === 0 ? "#59493c" : "#6c5543", roughness: 0.83 }} />)}
    <BoxPart size={[11.2, 4.8, 0.18]} position={[0, 2.35, -4.43]} finish={wall} />
    <BoxPart size={[0.18, 4.8, 8.9]} position={[-5.58, 2.35, 0]} finish={wall} />
    {[-3.35, -2.25, -1.15, -0.05, 1.05, 2.15, 3.25].map((z) => <BoxPart key={z}
      size={[0.09, 2.95, 0.25]} position={[-5.44, 2.35, z]} finish={walnut} />)}
    <BoxPart size={[11.2, 0.13, 0.24]} position={[0, 0.13, -4.27]} finish={trim} />
    <BoxPart size={[11.2, 0.14, 0.26]} position={[0, 4.68, -4.25]} finish={trim} />
    <BoxPart size={[0.22, 4.7, 0.22]} position={[-5.44, 2.35, -4.26]} finish={trim} />
    <BoxPart size={[0.22, 4.7, 0.22]} position={[5.44, 2.35, -4.26]} finish={trim} />
  </group>;
}

export function AcousticWall() {
  return <group>
    <BoxPart size={[5.8, 3.65, 0.1]} position={[0, 2.55, -4.3]} finish={{ color: "#17262c", roughness: 0.98 }} />
    {Array.from({ length: 19 }, (_, index) => <BoxPart key={index} size={[0.12, 3.42, 0.095]}
      position={[-2.65 + index * 0.295, 2.52, -4.2]} finish={walnut} />)}
    <BoxPart size={[5.95, 0.08, 0.15]} position={[0, 4.43, -4.17]} finish={trim} />
    <BoxPart size={[5.95, 0.06, 0.16]} position={[0, 0.68, -4.17]}
      finish={{ color: "#53acaa", emissive: "#238783", emissiveIntensity: 0.8, roughness: 0.6 }} />
    <mesh position={[0, 3.08, -4.06]}>
      <torusGeometry args={[0.64, 0.035, 8, 40]} />
      <meshStandardMaterial color="#80d9d3" emissive="#2ca8a2" emissiveIntensity={0.95} roughness={0.45} />
    </mesh>
    <CylinderPart radiusTop={0.065} height={0.54} position={[-0.2, 3.08, -4.03]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#a5e5df", emissive: "#2c9d98", emissiveIntensity: 0.7 }} />
    <CylinderPart radiusTop={0.065} height={0.36} position={[0.08, 3.08, -4.03]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#a5e5df", emissive: "#2c9d98", emissiveIntensity: 0.7 }} />
  </group>;
}

export function Rug() {
  return <group>
    <BoxPart size={[6.4, 0.035, 4.05]} position={[0, 0.055, -0.55]} finish={{ color: "#243b42", roughness: 1 }} />
    <BoxPart size={[6.12, 0.039, 3.77]} position={[0, 0.058, -0.55]} finish={{ color: "#304a50", roughness: 1 }} />
    <BoxPart size={[5.86, 0.042, 3.5]} position={[0, 0.061, -0.55]} finish={{ color: "#263a40", roughness: 1 }} />
  </group>;
}
