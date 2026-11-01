import type { PropDefinition } from "@/lib/environments/environment-registry";
import { BoxPart, CylinderPart } from "./parts";

const darkMetal = { color: "#141d23", roughness: 0.46, metalness: 0.75 };
const leather = { color: "#334048", roughness: 0.84 };
const wood = { color: "#81543b", roughness: 0.64 };

export function PodcastDesk({ material }: { material?: PropDefinition["material"] }) {
  const deskWood = material ?? wood;
  return <group>
    <BoxPart size={[4.65, 0.16, 1.55]} position={[0, 1.1, 0]} finish={deskWood} />
    <BoxPart size={[4.55, 0.04, 1.48]} position={[0, 1.2, 0]} finish={{ color: "#a6724c", roughness: 0.57 }} />
    <BoxPart size={[4.42, 0.62, 0.11]} position={[0, 0.66, 0.67]} finish={{ color: "#4b3129", roughness: 0.7 }} />
    {[-1.88, -1.25, -0.62, 0, 0.62, 1.25, 1.88].map((x) => <BoxPart key={x} size={[0.028, 0.56, 0.12]}
      position={[x, 0.66, 0.75]} finish={{ color: "#9f7050", roughness: 0.65 }} />)}
    <BoxPart size={[4.4, 0.035, 0.13]} position={[0, 0.89, 0.77]}
      finish={{ color: "#5eaaab", emissive: "#2a7f83", emissiveIntensity: 0.5 }} />
    {[-1.98, 1.98].map((x) => <group key={x}>
      <BoxPart size={[0.1, 0.93, 1.35]} position={[x, 0.53, -0.06]} finish={darkMetal} />
      <BoxPart size={[0.45, 0.08, 1.45]} position={[x, 0.12, -0.06]} finish={darkMetal} />
    </group>)}
  </group>;
}

export function StudioChair() {
  return <group>
    <CylinderPart radiusTop={0.29} radiusBottom={0.34} height={0.06} position={[0, 0.08, 0]} finish={darkMetal} />
    <CylinderPart radiusTop={0.055} height={0.44} position={[0, 0.3, 0]} finish={darkMetal} />
    <BoxPart size={[0.82, 0.15, 0.78]} position={[0, 0.59, 0]} finish={leather} />
    <BoxPart size={[0.9, 0.1, 0.84]} position={[0, 0.52, 0]} finish={{ color: "#1d282e", roughness: 0.85 }} />
    <BoxPart size={[0.78, 0.98, 0.16]} position={[0, 1.13, -0.34]} rotation={[-0.1, 0, 0]} finish={leather} />
    <BoxPart size={[0.52, 0.2, 0.19]} position={[0, 1.62, -0.38]} finish={{ color: "#29383f", roughness: 0.8 }} />
    {[-0.44, 0.44].map((x) => <group key={x}>
      <BoxPart size={[0.06, 0.3, 0.06]} position={[x, 0.78, 0.03]} finish={darkMetal} />
      <BoxPart size={[0.13, 0.08, 0.57]} position={[x, 0.94, 0.02]} finish={leather} />
    </group>)}
  </group>;
}

export function SideTable() {
  return <group>
    <BoxPart size={[0.68, 0.07, 0.72]} position={[0, 1, 0]} finish={wood} />
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
    {Array.from({ length: 16 }, (_, index) => {
      const shelf = index % 4;
      const column = Math.floor(index / 4);
      const bookHeight = 0.36 + (index % 4) * 0.04;
      return <BoxPart key={index} size={[0.18 + (index % 3) * 0.03, bookHeight, 0.35]}
        position={[-0.67 + column * 0.43, 0.48 + shelf * 0.64 + 0.05 + bookHeight / 2, 0.15]}
        finish={{ color: ["#b98562", "#5a8290", "#d4bc87", "#82927b"][index % 4], roughness: 0.89 }} />;
    })}
    <BoxPart size={[1.65, 0.035, 0.12]} position={[0, 2.62, 0.3]}
      finish={{ color: "#d6a46c", emissive: "#d89955", emissiveIntensity: 0.9 }} />
  </group>;
}
