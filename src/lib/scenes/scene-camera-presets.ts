import type { SceneCameraConfig, SceneDefinition } from "./scene-schema.ts";
import type { EnvironmentArrangement } from "../environments/arrangement.ts";
import type { CharacterProjectData } from "../characters/character-schema.ts";
import { environmentRegistry } from "../environments/registry.ts";
import { getLaptopInspectionPose } from "../environments/laptop-view.ts";
import { STUDIO_01_ID } from "../environments/studio-01.ts";

export const SCENE_CAMERA_PRESETS = ["wide", "medium", "character-close-up", "two-character", "group", "laptop-focused"] as const;
export type SceneCameraPresetId = (typeof SCENE_CAMERA_PRESETS)[number];

const closeByAnchor: Record<string, string> = {
  "studio-01:host-seat": "seat-left-close",
  "studio-01:cohost-seat": "seat-right-close",
  "studio-01:guest-seat": "seat-guest-close",
};

export function applySceneCameraPreset(
  scene: SceneDefinition,
  preset: SceneCameraPresetId,
  arrangement: EnvironmentArrangement,
  characterData: CharacterProjectData,
): SceneCameraConfig {
  const visibleCharacters = Object.entries(scene.characters).filter(([id, member]) => member.visible && characterData.characterInstances[id]);
  if (preset === "two-character" && visibleCharacters.length < 2 || preset === "group" && visibleCharacters.length < 3 || preset === "character-close-up" && !visibleCharacters.length) return scene.productionCamera;
  const environment = environmentRegistry.get(scene.environmentId ?? arrangement.environmentId);
  if (!environment || environment.id !== STUDIO_01_ID) return scene.productionCamera;
  let camera = scene.productionCamera;
  if (preset === "laptop-focused") {
    const laptop = arrangement.props.find((prop) => prop.id === "studio-01:laptop" && prop.visible);
    if (!laptop) return camera;
    const pose = getLaptopInspectionPose(laptop.transform);
    return { ...camera, position: pose.position, target: pose.target, fov: 38, zoom: 1,
      orientationMode: "look-at", shotType: "close-up", targetRef: { kind: "laptop", id: laptop.id } };
  }
  const key = preset === "wide" ? "wide" : preset === "medium" ? "front" : preset === "two-character" ? "conversation" : preset === "group" ? "group" : null;
  if (key) {
    const pose = environment.cameraAnchors[key];
    if (!pose) return camera;
    camera = { ...camera, ...pose, zoom: 1, orientationMode: "look-at",
      shotType: preset === "wide" || preset === "group" ? "wide" : "medium", targetRef: undefined };
    return camera;
  }
  const first = visibleCharacters[0];
  const anchorId = first?.[1].placementAnchorId;
  const closeKey = anchorId && closeByAnchor[anchorId] ? closeByAnchor[anchorId] : "seat-left-close";
  const pose = environment.cameraAnchors[closeKey];
  if (!pose) return camera;
  const id = first?.[0];
  return { ...camera, ...pose, zoom: 1, orientationMode: "look-at", shotType: "close-up",
    ...(id ? { targetRef: { kind: "character-instance" as const, id } } : { targetRef: undefined }) };
}
