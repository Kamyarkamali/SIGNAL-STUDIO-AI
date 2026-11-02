"use client";

import { useEffect, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, Quaternion, Vector3, type Group, type Object3D } from "three";
import { characterModelRegistry } from "@/lib/characters/character-registry";
import type { CharacterProjectData, CharacterState } from "@/lib/characters/character-schema";
import { clampCharacterScale } from "@/lib/characters/character-operations";
import { evaluateCharacterPreviewPose, getPreviewExpression, type CharacterPreviewActionId, type CharacterPreviewPlaybackPose, type PreviewSettings } from "@/lib/characters/animation-preview";
import { CharacterModelRenderer } from "./character-renderers";
import { composeGazeHeadRotation, defaultGazeCapability, gazePoseAt, neutralGazePose, supportedGazeCapability, type GazePreview } from "@/lib/characters/gaze-preview";

export type CharacterPreviewPlayback = { actionId: CharacterPreviewActionId; startedAtMs: number; durationSeconds: number; fromPose?: CharacterPreviewPlaybackPose; settings?: Partial<PreviewSettings> };

function visibleInScene(object: Object3D | null | undefined): object is Object3D {
  if (!object) return false;
  for (let current: Object3D | null = object; current; current = current.parent) if (!current.visible) return false;
  return true;
}

function resolveGazeTarget(preview: GazePreview, root: Group, scene: Object3D, camera: Object3D): Vector3 | undefined {
  if (preview.mode === "point" && preview.point?.every(Number.isFinite)) return new Vector3(...preview.point);
  if (preview.mode === "direction") {
    const horizontal = preview.horizontal ?? 0, vertical = preview.vertical ?? 0;
    const head = root.getObjectByName("head-pivot");
    const localOrigin = head ? root.worldToLocal(head.getWorldPosition(new Vector3())) : new Vector3();
    return root.localToWorld(localOrigin.add(new Vector3(Math.sin(horizontal), Math.sin(vertical), Math.cos(horizontal))));
  }
  const mode = preview.mode === "attention" ? preview.attentionTargetKind : preview.mode;
  if (mode === "camera") return camera.getWorldPosition(new Vector3());
  if (mode === "character" && preview.targetId) {
    const target = scene.getObjectByName(`character-instance:${preview.targetId}`);
    if (!visibleInScene(target)) return undefined;
    const head = target.getObjectByName("head-pivot");
    if (!head) return undefined;
    head.updateWorldMatrix(true, false);
    return head.localToWorld(new Vector3(0, 0.035, 0.13));
  }
  if (mode === "prop" && preview.targetId) {
    const target = scene.getObjectByName(preview.targetId);
    if (!visibleInScene(target)) return undefined;
    target.updateWorldMatrix(true, true);
    const display = target.getObjectByName("display-surface");
    if (display) return display.getWorldPosition(new Vector3());
    const bounds = new Box3().setFromObject(target);
    if (bounds.isEmpty()) return undefined;
    return bounds.getCenter(new Vector3());
  }
  return undefined;
}

function CharacterInstanceView({ id, data, selected, mode, onSelect, onCommit, preview, gaze, onPreviewComplete, showEditorHelpers }: {
  id: string; data: CharacterProjectData; selected: boolean; mode: "translate" | "rotate" | "scale";
  onSelect: (id: string | null) => void; onCommit: (id: string, state: CharacterState) => void;
  preview?: CharacterPreviewPlayback; onPreviewComplete: (id: string, startedAtMs: number) => void;
  gaze?: GazePreview;
  showEditorHelpers: boolean;
}) {
  const group = useRef<Group>(null!);
  const dragging = useRef(false);
  const baseRotations = useRef(new WeakMap<Object3D, [number, number, number]>());
  const basePositions = useRef(new WeakMap<Object3D, [number, number, number]>());
  const currentGazePose = useRef(neutralGazePose);
  const fromGazePose = useRef(neutralGazePose);
  const { invalidate, scene, camera } = useThree();
  const instance = data.characterInstances[id];
  const state = data.characterStates[id];
  const identity = instance && data.characterIdentities[instance.characterId];
  const model = identity && characterModelRegistry.get(identity.modelId);
  useEffect(() => { fromGazePose.current = currentGazePose.current; }, [gaze?.startedAtMs]);
  useFrame(() => {
    if (!group.current || !model) return;
    const capabilities = model.glb ? [] : model.capabilities.animationCapabilities.filter((capability): capability is "head-rotation" | "arm-gesture" | "facial-expression" => capability === "head-rotation" || capability === "arm-gesture" || capability === "facial-expression");
    const elapsed = preview ? (performance.now() - preview.startedAtMs) / 1000 : 0;
    const pose = preview ? evaluateCharacterPreviewPose({
      actionId: preview.actionId,
      sourceTimeSeconds: elapsed,
      durationSeconds: preview.durationSeconds,
      capabilities,
      fromPose: preview.fromPose,
      settings: preview.settings,
    }) : evaluateCharacterPreviewPose({ actionId: "neutral", sourceTimeSeconds: 0, durationSeconds: 1, capabilities });
    const gazeCapability = model ? supportedGazeCapability(model) : null;
    let gazePose = neutralGazePose;
    if (gaze && gazeCapability) {
      const head = group.current.getObjectByName("head-pivot");
      const origin = (head ?? group.current).getWorldPosition(new Vector3());
      const rotation = group.current.getWorldQuaternion(new Quaternion());
      const target = resolveGazeTarget(gaze, group.current, scene, camera);
      gazePose = gazePoseAt(gaze, performance.now() / 1000, gazeCapability, target?.toArray(), origin.toArray(), [group.current.rotation.x, group.current.rotation.y, group.current.rotation.z], rotation.toArray(), fromGazePose.current);
    }
    currentGazePose.current = gazePose;
    const apply = (name: string, offset: [number, number, number]) => {
      const target = group.current.getObjectByName(name);
      if (!target) return;
      let base = baseRotations.current.get(target);
      if (!base) {
        base = [target.rotation.x, target.rotation.y, target.rotation.z];
        baseRotations.current.set(target, base);
      }
      target.rotation.set(base[0] + offset[0], base[1] + offset[1], base[2] + offset[2]);
    };
    const limits = model ? supportedGazeCapability(model) : null;
    const headPose = composeGazeHeadRotation(pose.headRotation, gazePose, limits ?? { ...defaultGazeCapability, maxPitch: 0.5, maxYaw: 0.85, maxRoll: 0.25 });
    apply("head-pivot", headPose);
    apply("left-arm-pivot", pose.leftArmRotation);
    apply("right-arm-pivot", pose.rightArmRotation);
    if (limits?.torso) apply("torso-pivot", [0, gazePose.torsoYaw, 0]);
    for (const name of ["left-iris-gaze", "right-iris-gaze"]) {
      const iris = group.current.getObjectByName(name);
      if (!iris) continue;
      let base = basePositions.current.get(iris);
      if (!base) { base = [iris.position.x, iris.position.y, iris.position.z]; basePositions.current.set(iris, base); }
      iris.position.set(base[0] + gazePose.eyeOffset[0], base[1] + gazePose.eyeOffset[1], base[2]);
    }
  });
  useEffect(() => {
    invalidate();
    const gazeDuration = gaze ? gaze.mode === "attention" ? gaze.durationSeconds : gaze.transitionSeconds : 0;
    const animationDuration = preview?.durationSeconds ?? 0;
    if (!gazeDuration && !animationDuration) return;
    let frame = 0;
    let disposed = false;
    const tick = () => {
      if (disposed) return;
      invalidate();
      const now = performance.now();
      const animationDone = !preview || (now - preview.startedAtMs) / 1000 >= preview.durationSeconds;
      const gazeDone = !gaze || (now - gaze.startedAtMs) / 1000 >= gazeDuration;
      if (animationDone && gazeDone) {
        if (preview) onPreviewComplete(id, preview.startedAtMs);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { disposed = true; cancelAnimationFrame(frame); };
  }, [id, preview, gaze, invalidate, onPreviewComplete]);
  useEffect(() => {
    if (!group.current || dragging.current || !state) return;
    group.current.position.set(...state.transform.position);
    group.current.rotation.set(...state.transform.rotation);
    group.current.scale.set(...state.transform.scale);
  }, [state]);
  if (!instance || !identity || !state || !state.visible) return null;
  const animationCapabilities = model && !model.glb ? model.capabilities.animationCapabilities.filter((capability): capability is "head-rotation" | "arm-gesture" | "facial-expression" => capability === "head-rotation" || capability === "arm-gesture" || capability === "facial-expression") : [];
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
      <CharacterModelRenderer model={model} customization={identity.customization as Record<string, string>}
        previewExpression={preview ? getPreviewExpression(preview.actionId, animationCapabilities) : undefined} />
      {showEditorHelpers && selected && <mesh position={[0, 0.79, 0]} raycast={() => null}>
        <boxGeometry args={[0.72, 1.75, 0.64]} /><meshBasicMaterial color="#5ee0ce" wireframe depthTest={false} transparent opacity={0.78} />
      </mesh>}
    </group>
    {showEditorHelpers && selected && <TransformControls object={group} mode={mode} size={0.72}
      onMouseDown={() => { dragging.current = true; }} onMouseUp={commit} />}
  </>;
}

export function CharacterLayer({ data, selectedId, mode, onSelect, onCommit, previews = {}, gazes = {}, onPreviewComplete, showEditorHelpers = true }: {
  data: CharacterProjectData; selectedId: string | null; mode: "translate" | "rotate" | "scale";
  onSelect: (id: string | null) => void; onCommit: (id: string, state: CharacterState) => void;
  previews?: Record<string, CharacterPreviewPlayback>; gazes?: Record<string, GazePreview>; onPreviewComplete: (id: string, startedAtMs: number) => void;
  showEditorHelpers?: boolean;
}) {
  return <group name="project-character-instances">
    {Object.keys(data.characterInstances).map((id) => <CharacterInstanceView key={id} id={id} data={data}
      selected={selectedId === id} mode={mode} onSelect={onSelect} onCommit={onCommit}
      preview={previews[id]} gaze={gazes[id]} onPreviewComplete={onPreviewComplete} showEditorHelpers={showEditorHelpers} />)}
  </group>;
}
