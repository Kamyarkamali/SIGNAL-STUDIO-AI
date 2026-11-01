"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Euler, Vector3 } from "three";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { TransformConfig } from "@/lib/environments/environment-registry";
import type { TransformMode } from "@/components/layout/properties-panel";
import { EDITOR_CAMERA } from "./camera-config";
import { watchContextLoss } from "./webgl-support";
import { StudioEnvironment } from "./environments/studio-environment";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { laptopVisualSpec } from "@/lib/environments/studio-visual-spec";

function EditorCameraControls() {
  return <OrbitControls makeDefault target={EDITOR_CAMERA.target} minDistance={EDITOR_CAMERA.minDistance}
    maxDistance={EDITOR_CAMERA.maxDistance} maxPolarAngle={Math.PI / 2.03}
    enablePan={false} enableDamping={false} />;
}

function InspectionCamera({ arrangement, propId }: { arrangement: EnvironmentArrangement; propId: string | null }) {
  const { camera, controls, invalidate } = useThree();
  const saved = useRef<{ position: Vector3; quaternion: typeof camera.quaternion; target: Vector3 } | null>(null);
  const prop = arrangement.props.find((item) => item.id === propId);
  const transformKey = prop ? JSON.stringify(prop.transform) : "";
  useEffect(() => {
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void }) | null;
    if (prop && orbit?.target) {
      if (!saved.current) saved.current = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), target: orbit.target.clone() };
      const tilt = new Euler(laptopVisualSpec.screenTilt, 0, 0);
      const rotation = new Euler(...prop.transform.rotation);
      const localCenter = new Vector3(0, 0.11 + laptopVisualSpec.screenCenter[1], laptopVisualSpec.hingeZ + laptopVisualSpec.screenCenter[2]);
      localCenter.applyEuler(tilt).multiply(new Vector3(...prop.transform.scale)).applyEuler(rotation).add(new Vector3(...prop.transform.position));
      const normal = new Vector3(0, 0, 1).applyEuler(tilt).applyEuler(rotation).normalize();
      camera.position.copy(localCenter).addScaledVector(normal, 0.62).add(new Vector3(0, 0.04, 0));
      camera.up.set(0, 1, 0);
      camera.lookAt(localCenter);
      orbit.target.copy(localCenter); orbit.update?.(); camera.updateProjectionMatrix(); invalidate();
    } else if (saved.current && orbit?.target) {
      camera.position.copy(saved.current.position); camera.quaternion.copy(saved.current.quaternion);
      orbit.target.copy(saved.current.target); orbit.update?.(); camera.updateProjectionMatrix(); invalidate(); saved.current = null;
    }
  }, [propId, transformKey, camera, controls, invalidate, prop]);
  useEffect(() => () => {
    if (!saved.current) return;
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void }) | null;
    camera.position.copy(saved.current.position); camera.quaternion.copy(saved.current.quaternion);
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

export default function SceneCanvas({ onFailure, arrangement, selectedId, onSelect, onCommit, mode, projectId, displayAssignments, mediaPlaying, inspectPropId }: {
  onFailure: () => void; arrangement: EnvironmentArrangement; selectedId: string | null;
  onSelect: (id: string | null) => void; onCommit: (id: string, transform: TransformConfig) => void; mode: TransformMode;
  projectId: string | null; displayAssignments: ProjectDocument["displayAssignments"]; mediaPlaying: boolean; inspectPropId: string | null;
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
    <EditorCameraControls />
    <InspectionCamera arrangement={arrangement} propId={inspectPropId} />
    <StudioEnvironment arrangement={arrangement} selectedId={selectedId} onSelect={onSelect} onCommit={onCommit} mode={mode}
      projectId={projectId} displayAssignments={displayAssignments} playing={mediaPlaying} />
  </Canvas>;
}
