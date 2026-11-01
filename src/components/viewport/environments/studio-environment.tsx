"use client";

import { useEffect, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { Group } from "three";
import type { EnvironmentDefinition, PropDefinition, PropRendererKey, TransformConfig } from "@/lib/environments/environment-registry";
import { environmentRegistry } from "@/lib/environments/registry";
import { STUDIO_01_ID } from "@/lib/environments/studio-01";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { TransformMode } from "@/components/layout/properties-panel";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { AcousticWall, RoomShell, Rug } from "./room-architecture";
import { Bookshelf, PodcastDesk, SideTable, StudioChair } from "./furniture";
import { Laptop, Plant, PodcastMicrophone, PracticalLights, WallArt } from "./studio-details";

function StudioLighting() {
  return <>
    <ambientLight intensity={0.55} />
    <hemisphereLight args={["#b9d9d4", "#4e3f36", 0.86]} />
    <directionalLight position={[1, 5, 5]} intensity={1.65} color="#fff1d8" />
    <directionalLight position={[-4, 3.2, 0]} intensity={0.55} color="#9bd5d5" />
    <directionalLight position={[1.5, 3.8, -3.5]} intensity={0.34} color="#a9d5ce" />
  </>;
}

function PropVisual({ rendererKey, definition, assignment, projectId, playing }: {
  rendererKey: PropRendererKey; definition: PropDefinition;
  assignment?: ProjectDocument["displayAssignments"][string]; projectId: string | null; playing: boolean;
}) {
  switch (rendererKey) {
    case "room-shell": return <RoomShell />;
    case "acoustic-wall": return <AcousticWall />;
    case "desk": return <PodcastDesk material={definition.material} />;
    case "chair": return <StudioChair />;
    case "bookshelf": return <Bookshelf />;
    case "laptop": {
      const assetId = assignment?.state === "image" ? assignment.imageAssetId : assignment?.state === "video" ? assignment.videoAssetId : undefined;
      const url = projectId && assetId ? `/api/projects/${projectId}/display-assets/${assetId}` : undefined;
      return <Laptop assignment={assignment} url={url} playing={playing} />;
    }
    case "microphone": return <PodcastMicrophone />;
    case "side-table": return <SideTable />;
    case "practical-lights": return <PracticalLights />;
    case "plant": return <Plant />;
    case "rug": return <Rug />;
    case "wall-art": return <WallArt />;
    default: return rendererKey satisfies never;
  }
}

const outlineSize: Partial<Record<PropRendererKey, { size: [number, number, number]; y: number }>> = {
  desk: { size: [4.8, 1.3, 1.7], y: 0.65 }, chair: { size: [1, 1.8, 1], y: 0.9 },
  bookshelf: { size: [2.15, 3.15, 0.7], y: 1.55 }, laptop: { size: [1, 0.55, 0.75], y: 0.28 },
  microphone: { size: [0.35, 0.8, 0.85], y: 0.4 }, "side-table": { size: [0.8, 1.2, 0.85], y: 0.6 },
  plant: { size: [1.2, 2, 1.2], y: 1 }, rug: { size: [6.5, 0.12, 4.2], y: 0.06 },
  "practical-lights": { size: [6.2, 4.8, 3], y: 2.4 }, "wall-art": { size: [5.6, 1.4, 0.3], y: 2.8 },
};

function PropInstance({ instance, definition, selected, onSelect, onCommit, mode, assignment, projectId, playing }: {
  instance: EnvironmentArrangement["props"][number]; definition: PropDefinition; selected: boolean;
  onSelect: (id: string | null) => void; onCommit: (id: string, transform: TransformConfig) => void; mode: TransformMode;
  assignment?: ProjectDocument["displayAssignments"][string]; projectId: string | null; playing: boolean;
}) {
  const group = useRef<Group>(null!);
  const dragging = useRef(false);
  const orbit = useThree((state) => state.controls);
  useEffect(() => () => {
    const controls = orbit as (typeof orbit & { enabled?: boolean }) | null;
    if (dragging.current && controls) controls.enabled = true;
  }, [orbit]);
  useEffect(() => { if (group.current && !dragging.current) {
    group.current.position.set(...instance.transform.position);
    group.current.rotation.set(...instance.transform.rotation);
    group.current.scale.set(...instance.transform.scale);
  } }, [instance.transform]);
  const commit = () => {
    dragging.current = false;
    if (!group.current) return;
    const { position, rotation, scale } = group.current;
    try { onCommit(instance.id, { position: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z], scale: [scale.x, scale.y, scale.z] }); }
    catch {
      group.current.position.set(...instance.transform.position);
      group.current.rotation.set(...instance.transform.rotation);
      group.current.scale.set(...instance.transform.scale);
    }
  };
  if (!instance.visible) return null;
  const outline = outlineSize[definition.rendererKey];
  return <>
    <group ref={group} name={instance.id} position={instance.transform.position} rotation={instance.transform.rotation} scale={instance.transform.scale}
      onClick={(event) => { event.stopPropagation(); onSelect(definition.editable === false ? null : instance.id); }}>
      <PropVisual rendererKey={definition.rendererKey} definition={definition} assignment={assignment} projectId={projectId} playing={playing} />
      {selected && outline && <mesh position={[0, outline.y, 0]} raycast={() => null}><boxGeometry args={outline.size} /><meshBasicMaterial color="#5ee0ce" wireframe depthTest={false} transparent opacity={0.8} /></mesh>}
    </group>
    {selected && definition.editable !== false && <TransformControls object={group} mode={mode} size={0.75}
      onMouseDown={() => { dragging.current = true; }} onMouseUp={commit} />}
  </>;
}

export function StudioEnvironment({ environmentId = STUDIO_01_ID, arrangement, selectedId, onSelect, onCommit, mode, projectId, displayAssignments, playing }: {
  environmentId?: string; arrangement: EnvironmentArrangement; selectedId: string | null;
  onSelect: (id: string | null) => void; onCommit: (id: string, transform: TransformConfig) => void; mode: TransformMode;
  projectId: string | null; displayAssignments: ProjectDocument["displayAssignments"]; playing: boolean;
}) {
  const environment: EnvironmentDefinition | undefined = environmentRegistry.get(environmentId);
  if (!environment) throw new Error(`Environment is not registered: ${environmentId}`);
  const propDefinitions = new Map(environment.propDefinitions.map((definition) => [definition.id, definition]));

  return <group name={environment.id}>
    <StudioLighting />
    {arrangement.props.map((instance) => {
      const definition = propDefinitions.get(instance.definitionId);
      if (!definition) throw new Error(`Prop definition is missing: ${instance.definitionId}`);
      const assignment = displayAssignments[instance.id];
      return <PropInstance key={instance.id} instance={instance} definition={definition} selected={selectedId === instance.id}
        onSelect={onSelect} onCommit={onCommit} mode={mode} assignment={assignment} projectId={projectId} playing={playing} />;
    })}
  </group>;
}
