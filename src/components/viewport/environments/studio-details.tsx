import { BoxPart, CylinderPart, RoundedBoxPart } from "./parts";
import { laptopVisualSpec } from "@/lib/environments/studio-visual-spec";
import { DisplaySurface } from "./display-surface";
import type { ProjectDocument } from "@/lib/projects/project-schema";

const graphite = { color: "#1b252b", roughness: 0.56, metalness: 0.45 };

export function Laptop({ assignment, url, playing = true }: {
  assignment?: ProjectDocument["displayAssignments"][string]; url?: string; playing?: boolean;
}) {
  return <group>
    <RoundedBoxPart size={laptopVisualSpec.baseSize} position={[0, 0.045, 0.03]} radius={0.017}
      finish={{ color: "#68777d", roughness: 0.39, metalness: 0.62 }} />
    <RoundedBoxPart size={[0.88, 0.009, 0.42]} position={[0, 0.072, 0.075]} radius={0.004}
      finish={{ color: "#253036", roughness: 0.7 }} />
    {Array.from({ length: 5 }, (_, row) => <BoxPart key={row} size={[0.78, 0.004, 0.052]}
      position={[0, 0.079, laptopVisualSpec.keyboardCenterZ - 0.162 + row * 0.07]} finish={{ color: "#3d4a50", roughness: 0.72 }} />)}
    {Array.from({ length: 10 }, (_, column) => <BoxPart key={`key-gap-${column}`} size={[0.004, 0.005, 0.34]}
      position={[-0.317 + column * 0.07, 0.082, laptopVisualSpec.keyboardCenterZ - 0.022]} finish={{ color: "#253036", roughness: 0.75 }} />)}
    <RoundedBoxPart size={[0.24, 0.004, 0.12]} position={[0, 0.079, 0.27]} radius={0.002}
      finish={{ color: "#89979a", roughness: 0.47, metalness: 0.42 }} />
    <CylinderPart radiusTop={0.014} height={0.84} position={[0, 0.09, laptopVisualSpec.hingeZ + 0.005]} rotation={[0, 0, Math.PI / 2]}
      finish={{ color: "#404c52", roughness: 0.4, metalness: 0.75 }} />
    <group position={[0, 0.11, laptopVisualSpec.hingeZ]} rotation={[laptopVisualSpec.screenTilt, 0, 0]}>
      <RoundedBoxPart size={laptopVisualSpec.screenFrameSize} position={[0, laptopVisualSpec.screenCenter[1], 0]} radius={0.014}
        finish={{ color: "#36434a", roughness: 0.42, metalness: 0.5 }} />
      {/* The display is on local +Z, facing the seated user after the laptop's 180° turn. */}
      <mesh name="display-surface" position={laptopVisualSpec.screenCenter}>
        <planeGeometry args={laptopVisualSpec.screenSurfaceSize} />
        <meshStandardMaterial color={!assignment || assignment.state === "off" ? "#050709" : "#122a34"}
          emissive={!assignment || assignment.state === "off" ? "#000000" : "#17414a"}
          emissiveIntensity={assignment?.state === "off" ? 0 : 0.12} roughness={0.47} metalness={0.08} />
      </mesh>
      <DisplaySurface assignment={assignment} url={url} playing={playing} />
      <CylinderPart radiusTop={0.006} height={0.003} position={[0, 0.453, 0.023]} rotation={[Math.PI / 2, 0, 0]}
        finish={{ color: "#687b81", roughness: 0.48 }} />
    </group>
  </group>;
}

export function PodcastMicrophone() {
  return <group>
    <CylinderPart radiusTop={0.14} height={0.035} position={[0, 0.025, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.025} height={0.4} position={[0, 0.23, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.036} height={0.045} position={[0, 0.42, 0]} finish={{ color: "#889b9d", roughness: 0.36, metalness: 0.7 }} />
    <CylinderPart radiusTop={0.024} height={0.5} position={[0, 0.43, -0.23]} rotation={[Math.PI / 2, 0, 0]} finish={graphite} />
    <CylinderPart radiusTop={0.09} radiusBottom={0.075} height={0.24} position={[0, 0.43, -0.49]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#36434a", roughness: 0.73, metalness: 0.35 }} />
    <CylinderPart radiusTop={0.095} height={0.035} position={[0, 0.43, -0.61]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#a0a9a4", roughness: 0.4, metalness: 0.6 }} />
    <CylinderPart radiusTop={0.077} height={0.006} position={[0, 0.43, -0.635]} rotation={[Math.PI / 2, 0, 0]}
      finish={{ color: "#202d32", roughness: 0.85 }} />
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
      <pointLight position={[x, 3.46, -1.7]} color="#ffca88" intensity={0.48} distance={3.5} decay={2} />
    </group>)}
    <BoxPart size={[2.7, 0.05, 0.12]} position={[0, 4.23, -4.12]}
      finish={{ color: "#a9dad2", emissive: "#479e9b", emissiveIntensity: 0.8 }} />
  </group>;
}

export function Plant() {
  return <group>
    <CylinderPart radiusTop={0.31} radiusBottom={0.24} height={0.55} position={[0, 0.3, 0]}
      finish={{ color: "#9b8977", roughness: 0.95 }} />
    <CylinderPart radiusTop={0.285} height={0.045} position={[0, 0.55, 0]}
      finish={{ color: "#b1a08a", roughness: 0.78 }} />
    <CylinderPart radiusTop={0.045} height={1.0} position={[0, 0.92, 0]} finish={{ color: "#3f5b3b", roughness: 1 }} />
    {[-1.2, -0.6, 0, 0.6, 1.2].map((angle, index) => <group key={index} rotation={[0, angle, 0]}>
      <mesh position={[0.24, 1.06 + index * 0.095, 0]} rotation={[0, 0, -0.58]}>
        <coneGeometry args={[0.22, 0.7, 5]} />
        <meshStandardMaterial color={index % 2 ? "#4d7963" : "#426c58"} roughness={1} side={2} />
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
