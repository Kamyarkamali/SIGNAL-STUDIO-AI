"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, PerspectiveCamera, Quaternion, Vector3 } from "three";
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
import type { ProductionCameraConfig } from "@/lib/camera/production-camera";
import type { SceneCameraConfig } from "@/lib/scenes/scene-schema";
import { focusCameraPose, freeFlyStep, type Point3 } from "@/lib/camera/editor-navigation";
import { characterModelRegistry } from "@/lib/characters/character-registry";

type OrbitCameraControls = { target?: Vector3; update?: () => void; enabled?: boolean };

function applyProductionCameraPose(camera: PerspectiveCamera, orbit: OrbitCameraControls | null, config: SceneCameraConfig, target: [number, number, number]) {
  camera.position.set(...config.position);
  camera.up.set(0, 1, 0);
  if (config.orientationMode === "rotation") camera.rotation.set(...config.rotation);
  else camera.lookAt(...target);
  camera.fov = Math.max(10, Math.min(100, config.fov / config.zoom));
  if (orbit?.target) {
    if (config.orientationMode === "look-at") { orbit.target.set(...target); orbit.update?.(); }
    orbit.enabled = false;
  }
  camera.updateProjectionMatrix();
}

function resetEditorCameraProjection(camera: PerspectiveCamera) {
  camera.fov = EDITOR_CAMERA.fov;
  camera.updateProjectionMatrix();
}

function EditorCameraControls({ resetKey, navigationDisabled }: { resetKey: number; navigationDisabled: boolean }) {
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    if (!resetKey) return;
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void }) | null;
    camera.position.set(...EDITOR_CAMERA.position);
    camera.up.set(0, 1, 0);
    if (camera instanceof PerspectiveCamera) resetEditorCameraProjection(camera);
    if (orbit?.target) { orbit.target.set(...EDITOR_CAMERA.target); orbit.update?.(); }
    camera.lookAt(...EDITOR_CAMERA.target);
    invalidate();
  }, [resetKey, camera, controls, invalidate]);
  return <OrbitControls makeDefault enabled={!navigationDisabled} target={EDITOR_CAMERA.target} minDistance={0.45}
    maxDistance={40} minPolarAngle={0.12} maxPolarAngle={Math.PI - 0.12}
    enablePan enableDamping dampingFactor={0.08} panSpeed={0.9} zoomSpeed={1.05} />;
}

function FreeFlyControls({ active, speed, onEngagedChange }: { active: boolean; speed: number; onEngagedChange: (engaged: boolean) => void }) {
  const { camera, controls, gl, invalidate } = useThree();
  const keys = useRef(new Set<string>());
  const orbitDistance = useRef(6);
  const orbit = controls as OrbitCameraControls | null;
  useEffect(() => {
    const pressedKeys = keys.current;
    const canvas = gl.domElement;
    const syncLock = () => {
      const engaged = document.pointerLockElement === canvas;
      keys.current.clear();
      onEngagedChange(engaged);
      invalidate();
    };
    const onLockError = () => { onEngagedChange(false); invalidate(); };
    if (!active) {
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      return;
    }
    const isTextEntry = (target: EventTarget | null) => target instanceof HTMLElement &&
      (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextEntry(event.target)) return;
      if (event.code === "Escape" && document.pointerLockElement === canvas) {
        event.preventDefault(); document.exitPointerLock(); return;
      }
      if (document.pointerLockElement !== canvas || !["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ShiftLeft", "ShiftRight"].includes(event.code)) return;
      event.preventDefault(); pressedKeys.add(event.code); invalidate();
    };
    const onKeyUp = (event: KeyboardEvent) => { pressedKeys.delete(event.code); };
    const onBlur = () => pressedKeys.clear();
    const onPointerMove = (event: PointerEvent) => {
      if (document.pointerLockElement !== canvas || isTextEntry(document.activeElement)) return;
      const direction = camera.getWorldDirection(new Vector3());
      const yaw = Math.atan2(-direction.x, -direction.z) - event.movementX * 0.0022;
      let pitch = Math.asin(Math.max(-1, Math.min(1, direction.y))) - event.movementY * 0.0022;
      pitch = Math.max(-Math.PI / 2 + 0.035, Math.min(Math.PI / 2 - 0.035, pitch));
      camera.rotation.order = "YXZ";
      camera.rotation.set(pitch, yaw, 0, "YXZ");
      const look = camera.getWorldDirection(new Vector3());
      if (orbit?.target) orbit.target.copy(camera.position).addScaledVector(look, orbitDistance.current);
      invalidate();
    };
    document.addEventListener("pointerlockchange", syncLock);
    document.addEventListener("pointerlockerror", onLockError);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("pointermove", onPointerMove);
    window.addEventListener("blur", onBlur);
    if (document.pointerLockElement === canvas) syncLock();
    return () => {
      document.removeEventListener("pointerlockchange", syncLock);
      document.removeEventListener("pointerlockerror", onLockError);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onBlur);
      pressedKeys.clear();
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      onEngagedChange(false);
    };
  }, [active, camera, gl, invalidate, onEngagedChange, orbit]);
  useEffect(() => {
    if (active && orbit?.target) orbitDistance.current = Math.max(0.75, Math.min(40, camera.position.distanceTo(orbit.target)));
  }, [active, camera, orbit]);
  useFrame((_, delta) => {
    if (!active || document.pointerLockElement !== gl.domElement || keys.current.size === 0) return;
    const forward = camera.getWorldDirection(new Vector3());
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const position = freeFlyStep({ position: camera.position.toArray() as Point3, forward: forward.toArray() as Point3,
      right: right.toArray() as Point3, keys: keys.current, deltaSeconds: delta, speed,
      fast: keys.current.has("ShiftLeft") || keys.current.has("ShiftRight") });
    const previous = camera.position.clone();
    camera.position.set(...position);
    const shift = camera.position.clone().sub(previous);
    if (orbit?.target) orbit.target.add(shift);
    orbit?.update?.(); invalidate();
  });
  return null;
}

function FocusSelectionController({ request, targetId, characterData, enabled }: { request: number; targetId: string | null; characterData: CharacterProjectData; enabled: boolean }) {
  const { camera, controls, scene, invalidate, size } = useThree();
  const animation = useRef<{ fromPosition: Vector3; toPosition: Vector3; fromTarget: Vector3; toTarget: Vector3; elapsed: number } | null>(null);
  const processedRequest = useRef(0);
  const orbit = controls as OrbitCameraControls | null;
  useEffect(() => {
    if (!request || request === processedRequest.current || !enabled || !targetId || !orbit?.target) return;
    const isCharacter = Boolean(characterData.characterInstances[targetId]);
    const target = scene.getObjectByName(isCharacter ? `character-instance:${targetId}` : targetId);
    if (!target) return;
    processedRequest.current = request;
    target.updateWorldMatrix(true, true);
    const boundsTarget = isCharacter ? target.getObjectByName("head-pivot") ?? target : target;
    boundsTarget.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(boundsTarget);
    if (bounds.isEmpty()) return;
    const center = bounds.getCenter(new Vector3());
    const dimensions = bounds.getSize(new Vector3());
    let preferredFront: Point3 | undefined;
    if (isCharacter) {
      const instance = characterData.characterInstances[targetId];
      const identity = instance && characterData.characterIdentities[instance.characterId];
      const model = identity && characterModelRegistry.get(identity.modelId);
      if (model) {
        const axes: Record<string, [number, number, number]> = { "+Z": [0, 0, 1], "-Z": [0, 0, -1], "+X": [1, 0, 0], "-X": [-1, 0, 0] };
        preferredFront = new Vector3(...axes[model.forwardAxis]).applyQuaternion(target.getWorldQuaternion(new Quaternion())).toArray() as Point3;
      }
    }
    const cameraPose = focusCameraPose({ center: center.toArray() as Point3, size: dimensions.toArray() as Point3,
      currentPosition: camera.position.toArray() as Point3, fovDegrees: "fov" in camera ? camera.fov : EDITOR_CAMERA.fov,
      aspect: size.width / Math.max(1, size.height), preferredFront });
    animation.current = { fromPosition: camera.position.clone(), toPosition: new Vector3(...cameraPose.position),
      fromTarget: orbit.target.clone(), toTarget: new Vector3(...cameraPose.target), elapsed: 0 };
    invalidate();
  }, [request, targetId, characterData, enabled, camera, controls, orbit, scene, size.width, size.height, invalidate]);
  useFrame((_, delta) => {
    const current = animation.current;
    if (!current || !orbit?.target) return;
    current.elapsed += Math.min(delta, 0.05);
    const t = Math.min(1, current.elapsed / 0.7);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(current.fromPosition, current.toPosition, eased);
    orbit.target.lerpVectors(current.fromTarget, current.toTarget, eased);
    camera.lookAt(orbit.target);
    orbit.update?.(); invalidate();
    if (t >= 1) animation.current = null;
  });
  return null;
}

function ProductionCameraController({ config, target, active }: { config: SceneCameraConfig; target: [number, number, number]; active: boolean }) {
  const { camera, controls, invalidate } = useThree();
  const saved = useRef<{ position: Vector3; quaternion: typeof camera.quaternion; up: Vector3; target: Vector3; fov: number; controlsEnabled?: boolean } | null>(null);
  useEffect(() => {
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void; enabled?: boolean }) | null;
    if (!active) return;
    if (!saved.current) saved.current = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), up: camera.up.clone(), target: orbit?.target?.clone() ?? new Vector3(...EDITOR_CAMERA.target), fov: "fov" in camera ? camera.fov : EDITOR_CAMERA.fov, controlsEnabled: orbit?.enabled };
    return () => {
      if (!saved.current) return;
      const currentOrbit = controls as (typeof controls & { target?: Vector3; update?: () => void; enabled?: boolean }) | null;
      camera.position.copy(saved.current.position); camera.quaternion.copy(saved.current.quaternion); camera.up.copy(saved.current.up);
      if ("fov" in camera) camera.fov = saved.current.fov;
      if (currentOrbit?.target) { currentOrbit.target.copy(saved.current.target); currentOrbit.enabled = saved.current.controlsEnabled ?? true; currentOrbit.update?.(); }
      camera.updateProjectionMatrix(); invalidate(); saved.current = null;
    };
  }, [active, camera, controls, invalidate]);
  useEffect(() => {
    if (!active) return;
    const orbit = controls as (typeof controls & { target?: Vector3; update?: () => void; enabled?: boolean }) | null;
    applyProductionCameraPose(camera as PerspectiveCamera, orbit, config, target);
    invalidate();
  }, [active, config, target, camera, controls, invalidate]);
  return null;
}

function CameraCaptureBridge({ onReady }: { onReady: (capture: () => ProductionCameraConfig) => void }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    onReady(() => {
      const orbit = controls as (typeof controls & { target?: Vector3 }) | null;
      const direction = camera.getWorldDirection(new Vector3());
      const fallbackTarget = camera.position.clone().add(direction.multiplyScalar(5));
      return { position: [camera.position.x, camera.position.y, camera.position.z],
        target: orbit?.target ? [orbit.target.x, orbit.target.y, orbit.target.z] : [fallbackTarget.x, fallbackTarget.y, fallbackTarget.z],
        fov: "fov" in camera ? camera.fov : EDITOR_CAMERA.fov, near: camera.near, far: camera.far };
    });
  }, [camera, controls, onReady]);
  return null;
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
  characterData, selectedCharacterId, onCharacterSelect, onCharacterCommit, characterPreviews, characterGazes, onCharacterPreviewComplete, productionCamera, productionCameraTarget, productionCameraPreview, onCameraCaptureReady,
  freeFlyActive, navigationSpeed, focusRequest, focusTargetId, onFreeFlyEngagedChange }: {
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
  productionCamera: SceneCameraConfig; productionCameraTarget: [number, number, number]; productionCameraPreview: boolean;
  onCameraCaptureReady: (capture: () => ProductionCameraConfig) => void;
  freeFlyActive: boolean; navigationSpeed: number; focusRequest: number; focusTargetId: string | null; onFreeFlyEngagedChange: (engaged: boolean) => void;
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
    <EditorCameraControls resetKey={cameraResetKey} navigationDisabled={freeFlyActive || productionCameraPreview || Boolean(inspectPropId)} />
    <FreeFlyControls active={freeFlyActive && !productionCameraPreview && !inspectPropId} speed={navigationSpeed} onEngagedChange={onFreeFlyEngagedChange} />
    <FocusSelectionController request={focusRequest} targetId={focusTargetId} characterData={characterData} enabled={!freeFlyActive && !productionCameraPreview && !inspectPropId} />
    <CameraCaptureBridge onReady={onCameraCaptureReady} />
    <InspectionCamera arrangement={arrangement} propId={productionCameraPreview ? null : inspectPropId} />
    <ProductionCameraController config={productionCamera} target={productionCameraTarget} active={productionCameraPreview} />
    <StudioEnvironment arrangement={arrangement} selectedId={selectedId} editingId={editingId} onSelect={onSelect} onEnterEdit={onEnterEdit} onCommit={onCommit} mode={mode}
      projectId={projectId} displayAssignments={displayAssignments} playing={mediaPlaying} showRoomWalls={showRoomWalls} showEditorHelpers={showEditorHelpers} />
    <CharacterLayer data={characterData} selectedId={selectedCharacterId} mode={mode}
      onSelect={onCharacterSelect} onCommit={onCharacterCommit}
      previews={characterPreviews} gazes={characterGazes} onPreviewComplete={onCharacterPreviewComplete} showEditorHelpers={showEditorHelpers} />
  </Canvas>;
}
