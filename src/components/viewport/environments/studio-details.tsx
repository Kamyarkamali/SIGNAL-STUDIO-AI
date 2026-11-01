import { BoxPart, CylinderPart } from "./parts";

const graphite = { color: "#1b252b", roughness: 0.56, metalness: 0.45 };

export function Laptop() {
  return <group>
    <BoxPart size={[0.93, 0.045, 0.62]} position={[0, 0.045, 0.03]} finish={{ color: "#65747a", roughness: 0.42, metalness: 0.55 }} />
    <BoxPart size={[0.86, 0.009, 0.4]} position={[0, 0.072, 0.08]} finish={{ color: "#293339", roughness: 0.63 }} />
    <BoxPart size={[0.24, 0.008, 0.12]} position={[0, 0.078, 0.27]} finish={{ color: "#819095", roughness: 0.5 }} />
    <group position={[0, 0.11, -0.29]} rotation={[-0.16, 0, 0]}>
      <BoxPart size={[0.9, 0.44, 0.035]} position={[0, 0.22, 0]}
        finish={{ color: "#37444a", roughness: 0.45, metalness: 0.4 }} />
      {/* The display is on local +Z, facing the seated user after the laptop's 180° turn. */}
      <BoxPart size={[0.8, 0.35, 0.007]} position={[0, 0.22, 0.022]}
        finish={{ color: "#182e39", emissive: "#173f4b", emissiveIntensity: 0.32, roughness: 0.5 }} />
      <BoxPart size={[0.5, 0.025, 0.008]} position={[0, 0.27, 0.027]}
        finish={{ color: "#65ada9", emissive: "#2b7f7c", emissiveIntensity: 0.7 }} />
      <BoxPart size={[0.3, 0.018, 0.008]} position={[-0.1, 0.18, 0.027]}
        finish={{ color: "#b4bbb2", roughness: 0.7 }} />
    </group>
  </group>;
}

export function PodcastMicrophone() {
  return <group>
    <CylinderPart radiusTop={0.14} height={0.035} position={[0, 0.025, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.025} height={0.4} position={[0, 0.23, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.024} height={0.5} position={[0, 0.43, -0.23]} rotation={[Math.PI / 2, 0, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.09} radiusBottom={0.075} height={0.24} position={[0, 0.43, -0.49]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#36434a", roughness: 0.73, metalness: 0.35 }} />
    <CylinderPart radiusTop={0.095} height={0.035} position={[0, 0.43, -0.61]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#a0a9a4", roughness: 0.4, metalness: 0.6 }} />
  </group>;
}

export function PracticalLights() {
  return <group>
    {[-2.75, 2.75].map((x) => <group key={x}>
      <CylinderPart radiusTop={0.017} height={0.77} position={[x, 4.35, -1.7]} finish={graphite} />
      <CylinderPart radiusTop={0.24} radiusBottom={0.38} height={0.31} position={[x, 3.78, -1.7]}
        finish={{ color: "#6f513d", roughness: 0.6, metalness: 0.22 }} />
      <CylinderPart radiusTop={0.245} height={0.035} position={[x, 3.61, -1.7]}
        finish={{ color: "#e1ad70", emissive: "#d68d43", emissiveIntensity: 1.2, roughness: 0.5 }} />
      <pointLight position={[x, 3.46, -1.7]} color="#ffca88" intensity={0.7} distance={4} decay={2} />
    </group>)}
    <BoxPart size={[2.7, 0.05, 0.12]} position={[0, 4.23, -4.12]}
      finish={{ color: "#a9dad2", emissive: "#479e9b", emissiveIntensity: 0.8 }} />
  </group>;
}

export function Plant() {
  return <group>
    <CylinderPart radiusTop={0.31} radiusBottom={0.24} height={0.55} position={[0, 0.3, 0]}
      finish={{ color: "#9b8977", roughness: 0.95 }} />
    <CylinderPart radiusTop={0.045} height={1.0} position={[0, 0.92, 0]} finish={{ color: "#3f5b3b", roughness: 1 }} />
    {[-0.65, 0, 0.65].map((angle, index) => <group key={index} rotation={[0, angle, 0]}>
      <mesh position={[0.22, 1.25 + index * 0.13, 0]} rotation={[0, 0, -0.42]}>
        <coneGeometry args={[0.31, 0.8, 6]} />
        <meshStandardMaterial color={index === 1 ? "#4d7963" : "#426c58"} roughness={1} />
      </mesh>
    </group>)}
  </group>;
}

export function WallArt() {
  return <group>
    {[3.5, 4.65].map((x, index) => <group key={index}>
      <BoxPart size={[0.88, 1.18, 0.09]} position={[x, 2.8, -4.24]}
        finish={{ color: "#8e7157", roughness: 0.65 }} />
      <BoxPart size={[0.71, 1.0, 0.095]} position={[x, 2.8, -4.18]}
        finish={{ color: index === 0 ? "#26444b" : "#4e4940", roughness: 0.9 }} />
      <BoxPart size={[0.34, 0.5, 0.01]} position={[x + 0.09, 2.73, -4.12]} rotation={[0, 0, index === 0 ? 0.35 : -0.3]}
        finish={{ color: index === 0 ? "#72aaa6" : "#c39c6d", roughness: 0.8 }} />
    </group>)}
  </group>;
}
