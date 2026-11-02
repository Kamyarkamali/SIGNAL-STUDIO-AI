import { CapsuleGeometry, ConeGeometry, MeshStandardMaterial, SphereGeometry } from "three";
import type { CharacterModelDefinition } from "@/lib/characters/character-registry";

// Shared immutable, deliberately minimal development geometry. The preview renderer is replaceable by key.
const bodyGeometry = new CapsuleGeometry(0.25, 0.52, 3, 6);
const headGeometry = new SphereGeometry(0.22, 10, 8);
const frontMarkerGeometry = new ConeGeometry(0.07, 0.16, 6);
const bodyMaterial = new MeshStandardMaterial({ color: "#627b88", roughness: 0.78 });
const headMaterial = new MeshStandardMaterial({ color: "#aebec3", roughness: 0.7 });
const frontMarkerMaterial = new MeshStandardMaterial({ color: "#5ee0ce", roughness: 0.5 });
const missingMaterial = new MeshStandardMaterial({ color: "#d4779d", wireframe: true });

export function CharacterModelRenderer({ model, onSelect }: { model: CharacterModelDefinition | undefined; onSelect: () => void }) {
  if (!model || model.rendererKey !== "development-humanoid") return <mesh onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    <boxGeometry args={[0.6, 1.2, 0.45]} /><primitive object={missingMaterial} attach="material" />
  </mesh>;
  return <group dispose={null} name="development-placeholder-front-positive-z" onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    <mesh geometry={bodyGeometry} material={bodyMaterial} position={[0, 0.66, 0]} />
    <mesh geometry={headGeometry} material={headMaterial} position={[0, 1.28, 0]} />
    <mesh geometry={frontMarkerGeometry} material={frontMarkerMaterial} position={[0, 1.28, 0.205]} rotation={[Math.PI / 2, 0, 0]} />
  </group>;
}
