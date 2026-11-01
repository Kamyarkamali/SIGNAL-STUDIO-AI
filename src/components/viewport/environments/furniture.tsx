import type { PropDefinition } from "@/lib/environments/environment-registry";
import { BoxPart, CylinderPart, RoundedBoxPart } from "./parts";

const darkMetal = { color: "#141d23", roughness: 0.46, metalness: 0.75 };
const leather = { color: "#344149", roughness: 0.88 };
const wood = { color: "#81543b", roughness: 0.64 };
const warmEdge = { color: "#b1845e", roughness: 0.6 };

export function PodcastDesk({ material }: { material?: PropDefinition["material"] }) {
  const deskWood = material ?? wood;
  return <group>
    <RoundedBoxPart size={[4.65, 0.16, 1.55]} position={[0, 1.1, 0]} radius={0.055} finish={deskWood} />
    <RoundedBoxPart size={[4.52, 0.035, 1.45]} position={[0, 1.196, 0]} radius={0.012} finish={{ color: "#a97851", roughness: 0.58 }} />
    <BoxPart size={[4.42, 0.018, 0.025]} position={[0, 1.02, -0.74]} finish={warmEdge} />
    <BoxPart size={[4.42, 0.62, 0.11]} position={[0, 0.66, 0.67]} finish={{ color: "#4b3129", roughness: 0.7 }} />
    {[-1.88, -1.25, -0.62, 0, 0.62, 1.25, 1.88].map((x) => <BoxPart key={x} size={[0.028, 0.56, 0.12]}
      position={[x, 0.66, 0.75]} finish={{ color: "#9f7050", roughness: 0.65 }} />)}
    <BoxPart size={[4.4, 0.035, 0.13]} position={[0, 0.89, 0.77]}
      finish={{ color: "#5eaaab", emissive: "#2a7f83", emissiveIntensity: 0.5 }} />
    {[-1.98, 1.98].map((x) => <group key={x}>
      <BoxPart size={[0.1, 0.93, 1.35]} position={[x, 0.53, -0.06]} finish={darkMetal} />
      <BoxPart size={[0.45, 0.08, 1.45]} position={[x, 0.12, -0.06]} finish={darkMetal} />
      <BoxPart size={[0.055, 0.8, 0.055]} position={[x + (x > 0 ? -0.12 : 0.12), 0.51, 0.42]} finish={{ color: "#53656a", roughness: 0.48, metalness: 0.7 }} />
    </group>)}
  </group>;
}

export function StudioChair() {
  return <group>
    <CylinderPart radiusTop={0.29} radiusBottom={0.34} height={0.06} position={[0, 0.08, 0]} finish={darkMetal} />
    <CylinderPart radiusTop={0.055} height={0.44} position={[0, 0.3, 0]} finish={darkMetal} />
    <RoundedBoxPart size={[0.84, 0.16, 0.78]} position={[0, 0.59, 0]} radius={0.065} finish={leather} />
    <RoundedBoxPart size={[0.91, 0.09, 0.84]} position={[0, 0.51, 0]} radius={0.035} finish={{ color: "#1d282e", roughness: 0.85 }} />
    <RoundedBoxPart size={[0.79, 0.92, 0.19]} position={[0, 1.13, -0.34]} rotation={[-0.1, 0, 0]} radius={0.07} finish={leather} />
    <RoundedBoxPart size={[0.63, 0.23, 0.2]} position={[0, 1.62, -0.38]} radius={0.08} finish={{ color: "#29383f", roughness: 0.86 }} />
    <BoxPart size={[0.55, 0.62, 0.015]} position={[0, 1.11, -0.233]} rotation={[-0.1, 0, 0]} finish={{ color: "#405058", roughness: 0.95 }} />
    {[-0.44, 0.44].map((x) => <group key={x}>
      <BoxPart size={[0.06, 0.3, 0.06]} position={[x, 0.78, 0.03]} finish={darkMetal} />
      <RoundedBoxPart size={[0.13, 0.08, 0.57]} position={[x, 0.94, 0.02]} radius={0.035} finish={leather} />
    </group>)}
  </group>;
}

export function SideTable() {
  return <group>
    <RoundedBoxPart size={[0.68, 0.07, 0.72]} position={[0, 1, 0]} radius={0.028} finish={wood} />
    <BoxPart size={[0.55, 0.035, 0.59]} position={[0, 1.055, 0]} finish={{ color: "#a6724c", roughness: 0.6 }} />
    <CylinderPart radiusTop={0.055} height={0.88} position={[0, 0.53, 0]} finish={darkMetal} />
    <CylinderPart radiusTop={0.27} height={0.065} position={[0, 0.075, 0]} finish={darkMetal} />
  </group>;
}

export function Bookshelf() {
  return <group>
    <BoxPart size={[2.05, 3.05, 0.55]} position={[0, 1.54, 0]} finish={{ color: "#2d2523", roughness: 0.8 }} />
    <BoxPart size={[1.8, 2.78, 0.59]} position={[0, 1.53, 0.03]} finish={{ color: "#17252b", roughness: 0.9 }} />
    {[-0.93, 0.93].map((x) => <BoxPart key={x} size={[0.14, 3.1, 0.64]} position={[x, 1.54, 0.08]} finish={wood} />)}
    {[0.48, 1.12, 1.76, 2.4].map((y) => <BoxPart key={y} size={[1.94, 0.1, 0.63]} position={[0, y, 0.09]} finish={wood} />)}
    {[0.44, 1.08, 1.72, 2.36].map((y) => <BoxPart key={`lip-${y}`} size={[1.84, 0.025, 0.025]}
      position={[0, y + 0.072, 0.395]} finish={warmEdge} />)}
    {Array.from({ length: 16 }, (_, index) => {
      const shelf = Math.floor(index / 4);
      const column = index % 4;
      const bookHeight = 0.34 + ((index * 3) % 4) * 0.055;
      const x = -0.65 + column * 0.43;
      const y = 0.53 + shelf * 0.64 + bookHeight / 2;
      return <group key={index}>
        <BoxPart size={[0.19 + (index % 3) * 0.025, bookHeight, 0.34]} position={[x, y, 0.14]}
          finish={{ color: ["#b98562", "#5a8290", "#d4bc87", "#82927b"][index % 4], roughness: 0.88 }} />
        <BoxPart size={[0.026, bookHeight * 0.72, 0.012]} position={[x - 0.055, y, 0.317]}
          finish={{ color: "#dfcda5", roughness: 0.7 }} />
      </group>;
    })}
    <BoxPart size={[1.65, 0.035, 0.12]} position={[0, 2.62, 0.3]}
      finish={{ color: "#d6a46c", emissive: "#d89955", emissiveIntensity: 0.9 }} />
  </group>;
}
