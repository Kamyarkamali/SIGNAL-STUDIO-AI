"use client";

import { useEffect, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import type { Group } from "three";
import { characterModelRegistry } from "@/lib/characters/character-registry";
import type { CharacterProjectData, CharacterState } from "@/lib/characters/character-schema";
import { clampCharacterScale } from "@/lib/characters/character-operations";
import { CharacterModelRenderer } from "./character-renderers";

function CharacterInstanceView({ id, data, selected, mode, onSelect, onCommit }: {
  id: string; data: CharacterProjectData; selected: boolean; mode: "translate" | "rotate" | "scale";
  onSelect: (id: string | null) => void; onCommit: (id: string, state: CharacterState) => void;
}) {
  const group = useRef<Group>(null!);
  const dragging = useRef(false);
  const instance = data.characterInstances[id];
  const state = data.characterStates[id];
  const identity = instance && data.characterIdentities[instance.characterId];
  const model = identity && characterModelRegistry.get(identity.modelId);
  useEffect(() => {
    if (!group.current || dragging.current || !state) return;
    group.current.position.set(...state.transform.position);
    group.current.rotation.set(...state.transform.rotation);
    group.current.scale.set(...state.transform.scale);
  }, [state]);
  if (!instance || !identity || !state || !state.visible) return null;
  const commit = () => {
    dragging.current = false;
    if (!group.current) return;
    const { position, rotation, scale } = group.current;
    const safeScale = clampCharacterScale([scale.x, scale.y, scale.z]);
    onCommit(id, { ...state, transform: { position: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z], scale: safeScale } });
  };
  return <>
    <group ref={group} name={`character-instance:${id}`} position={state.transform.position} rotation={state.transform.rotation} scale={state.transform.scale}
      onClick={(event) => { event.stopPropagation(); onSelect(id); }}>
      <CharacterModelRenderer model={model} onSelect={() => onSelect(id)} />
      {selected && <mesh position={[0, 0.79, 0]} raycast={() => null}>
        <boxGeometry args={[0.72, 1.75, 0.64]} /><meshBasicMaterial color="#5ee0ce" wireframe depthTest={false} transparent opacity={0.78} />
      </mesh>}
    </group>
    {selected && <TransformControls object={group} mode={mode} size={0.72}
      onMouseDown={() => { dragging.current = true; }} onMouseUp={commit} />}
  </>;
}

export function CharacterLayer({ data, selectedId, mode, onSelect, onCommit }: {
  data: CharacterProjectData; selectedId: string | null; mode: "translate" | "rotate" | "scale";
  onSelect: (id: string | null) => void; onCommit: (id: string, state: CharacterState) => void;
}) {
  return <group name="project-character-instances">
    {Object.keys(data.characterInstances).map((id) => <CharacterInstanceView key={id} id={id} data={data}
      selected={selectedId === id} mode={mode} onSelect={onSelect} onCommit={onCommit} />)}
  </group>;
}
