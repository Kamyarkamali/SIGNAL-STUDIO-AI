"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { TransformConfig } from "@/lib/environments/environment-registry";
import type { TransformMode } from "@/components/layout/properties-panel";
import { EDITOR_CAMERA } from "./camera-config";
import { watchContextLoss } from "./webgl-support";
import { StudioEnvironment } from "./environments/studio-environment";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { getLaptopInspectionPose } from "@/lib/environments/laptop-view";
import { CharacterLayer } from "@/components/characters/character-layer";
import type { CharacterPreviewPlayback } from "@/components/characters/character-layer";
import type { GazePreview } from "@/lib/characters/gaze-preview";
import type { CharacterProjectData, CharacterState } from "@/lib/characters/character-schema";

function EditorCameraControls({ resetKey }: { resetKey: number }) {
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    if (!resetKey) return;
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void }) | null;
    camera.position.set(...EDITOR_CAMERA.position);
    camera.up.set(0, 1, 0);
    if (orbit?.target) { orbit.target.set(...EDITOR_CAMERA.target); orbit.update?.(); }
    camera.lookAt(...EDITOR_CAMERA.target);
    invalidate();
  }, [resetKey, camera, controls, invalidate]);
  return <OrbitControls makeDefault target={EDITOR_CAMERA.target} minDistance={EDITOR_CAMERA.minDistance}
    maxDistance={EDITOR_CAMERA.maxDistance} minPolarAngle={0.12} maxPolarAngle={Math.PI - 0.12}
    enablePan enableDamping={false} />;
}

function InspectionCamera({ arrangement, propId }: { arrangement: EnvironmentArrangement; propId: string | null }) {
  const { camera, controls, invalidate } = useThree();
  const saved = useRef<{ position: Vector3; quaternion: typeof camera.quaternion; up: Vector3; target: Vector3 } | null>(null);
  const prop = arrangement.props.find((item) => item.id === propId);
  const transformKey = prop ? JSON.stringify(prop.transform) : "";
  useEffect(() => {
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void }) | null;
    if (prop && orbit?.target) {
      if (!saved.current) saved.current = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), up: camera.up.clone(), target: orbit.target.clone() };
      const pose = getLaptopInspectionPose(prop.transform);
      camera.position.set(...pose.position);
      camera.up.set(...pose.up);
      camera.lookAt(...pose.target);
      orbit.target.set(...pose.target); orbit.update?.(); camera.updateProjectionMatrix(); invalidate();
    } else if (saved.current && orbit?.target) {
      camera.position.copy(saved.current.position); camera.quaternion.copy(saved.current.quaternion);
      camera.up.copy(saved.current.up);
      orbit.target.copy(saved.current.target); orbit.update?.(); camera.updateProjectionMatrix(); invalidate(); saved.current = null;
    }
  }, [propId, transformKey, camera, controls, invalidate, prop]);
  useEffect(() => () => {
    if (!saved.current) return;
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void }) | null;
    camera.position.copy(saved.current.position); camera.quaternion.copy(saved.current.quaternion);
    camera.up.copy(saved.current.up);
    if (orbit?.target) { orbit.target.copy(saved.current.target); orbit.update?.(); }
    saved.current = null;
  }, [camera, controls]);
  return null;
}

function ContextLossMonitor({ onFailure }: { onFailure: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => watchContextLoss(canvas, onFailure), [canvas, onFailure]);
  return null;
}

export default function SceneCanvas({ onFailure, arrangement, selectedId, editingId, onSelect, onEnterEdit, onCommit, mode, projectId, displayAssignments, mediaPlaying, inspectPropId, cameraResetKey, showRoomWalls, showEditorHelpers,
  characterData, selectedCharacterId, onCharacterSelect, onCharacterCommit, characterPreviews, characterGazes, onCharacterPreviewComplete }: {
  onFailure: () => void; arrangement: EnvironmentArrangement; selectedId: string | null; editingId: string | null;
  onSelect: (id: string | null) => void; onEnterEdit: (id: string, editable: boolean) => void;
  onCommit: (id: string, transform: TransformConfig) => void; mode: TransformMode;
  projectId: string | null; displayAssignments: ProjectDocument["displayAssignments"]; mediaPlaying: boolean; inspectPropId: string | null;
  cameraResetKey: number;
  showRoomWalls: boolean;
  showEditorHelpers: boolean;
  characterData: CharacterProjectData; selectedCharacterId: string | null;
  onCharacterSelect: (id: string | null) => void; onCharacterCommit: (id: string, state: CharacterState) => void;
  characterPreviews: Record<string, CharacterPreviewPlayback>;
  characterGazes: Record<string, GazePreview>;
  onCharacterPreviewComplete: (id: string, startedAtMs: number) => void;
}) {
  return <Canvas
    frameloop="demand"
    dpr={[1, 1.5]}
    gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "low-power" }}
    camera={{ position: EDITOR_CAMERA.position, fov: EDITOR_CAMERA.fov, near: EDITOR_CAMERA.near, far: EDITOR_CAMERA.far }}
    onCreated={({ gl }) => gl.setClearColor("#14212c")}
    onPointerMissed={() => onSelect(null)}
    aria-label="نمای سه‌بعدی استودیوی پادکست مدرن"
  >
    <ContextLossMonitor onFailure={onFailure} />
    <EditorCameraControls resetKey={cameraResetKey} />
    <InspectionCamera arrangement={arrangement} propId={inspectPropId} />
    <StudioEnvironment arrangement={arrangement} selectedId={selectedId} editingId={editingId} onSelect={onSelect} onEnterEdit={onEnterEdit} onCommit={onCommit} mode={mode}
      projectId={projectId} displayAssignments={displayAssignments} playing={mediaPlaying} showRoomWalls={showRoomWalls} showEditorHelpers={showEditorHelpers} />
    <CharacterLayer data={characterData} selectedId={selectedCharacterId} mode={mode}
      onSelect={onCharacterSelect} onCommit={onCharacterCommit}
      previews={characterPreviews} gazes={characterGazes} onPreviewComplete={onCharacterPreviewComplete} showEditorHelpers={showEditorHelpers} />
  </Canvas>;
}
