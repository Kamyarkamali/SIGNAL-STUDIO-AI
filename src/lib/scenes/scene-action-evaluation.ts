import {
  blendPreviewPoseLayers,
  evaluateCharacterPreviewPose,
  evaluateFacialExpressionWeight,
  getPreviewActionChannels,
  getPreviewExpression,
  isPreviewActionSupported,
  type CharacterAnimationCapability,
  type CharacterPreviewActionId,
  type PreviewPose,
} from "../characters/animation-preview.ts";
import type { ChatGptExpression } from "../characters/chatgpt-expression-presets.ts";
import type { GazePreview } from "../characters/gaze-preview.ts";
import type { SceneActionEvent, SceneDefinition } from "./scene-schema.ts";

export type EvaluatedCharacterActions = {
  /** True when a supported pose/expression event owns a channel at this frame. */
  poseActive: boolean;
  pose: PreviewPose;
  expression?: ChatGptExpression;
  expressionWeight: number;
  gaze?: GazePreview;
};

const gazeActions = new Set<SceneActionEvent["action"]>(["gaze-character", "gaze-prop"]);
const defaultCapabilities: readonly CharacterAnimationCapability[] = [];

/** Resolves the scene's enabled events at one local integer frame without reading a clock. */
export function evaluateSceneCharacterActions(
  scene: SceneDefinition,
  localFrame: number,
  fps: number,
  capabilitiesByInstance: Readonly<Record<string, readonly CharacterAnimationCapability[]>>,
  gazeCapableInstances: ReadonlySet<string> = new Set(),
  jointsByInstance: Readonly<Record<string, readonly string[]>> = {},
): Record<string, EvaluatedCharacterActions> {
  const frame = Number.isSafeInteger(localFrame) ? Math.max(0, Math.min(scene.durationFrames, localFrame)) : 0;
  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : 30;
  const result: Record<string, EvaluatedCharacterActions> = {};
  const poseLayersByInstance: Record<string, { pose: PreviewPose; channels: readonly (keyof PreviewPose)[]; priority: number }[]> = {};
  const expressionClaimed = new Set<string>();
  const candidates = scene.actionEvents
    .filter((event) => {
      if (!event.enabled || frame < event.startFrame) return false;
      const endFrame = event.startFrame + event.durationFrames;
      const isGaze = gazeActions.has(event.action);
      const releaseFrames = isGaze ? Math.ceil(Math.min(0.45, event.durationFrames / safeFps * 0.25) * safeFps) : 0;
      return frame < endFrame || isGaze && frame <= endFrame + releaseFrames;
    })
    .sort((a, b) => b.priority - a.priority || a.startFrame - b.startFrame || a.id.localeCompare(b.id));

  for (const event of candidates) {
    const capabilities = capabilitiesByInstance[event.characterInstanceId] ?? defaultCapabilities;
    const target = result[event.characterInstanceId] ??= { poseActive: false, pose: { headRotation: [0, 0, 0], neckRotation: [0, 0, 0], torsoRotation: [0, 0, 0], leftArmRotation: [0, 0, 0], rightArmRotation: [0, 0, 0], leftElbowRotation: [0, 0, 0], rightElbowRotation: [0, 0, 0], leftWristRotation: [0, 0, 0], rightWristRotation: [0, 0, 0], leftHandRotation: [0, 0, 0], rightHandRotation: [0, 0, 0] }, expressionWeight: 0 };
    if (gazeActions.has(event.action)) {
      if (!gazeCapableInstances.has(event.characterInstanceId) || target.gaze) continue;
      const gaze: GazePreview = {
        mode: "attention",
        attention: "observe",
        attentionTargetKind: event.action === "gaze-character" ? "character" : "prop",
        targetId: event.targetId,
        startedAtMs: (event.startFrame / safeFps) * 1000,
        durationSeconds: event.durationFrames / safeFps,
        transitionSeconds: Math.min(0.45, event.durationFrames / safeFps * 0.25),
        evaluationTimeSeconds: frame / safeFps,
      };
      target.gaze = gaze;
      continue;
    }

    const action = event.action as CharacterPreviewActionId;
    const joints = jointsByInstance[event.characterInstanceId] ?? [];
    if (!isPreviewActionSupported(action, capabilities, joints)) continue;
    target.poseActive = true;
    const sourceTimeSeconds = (frame - event.startFrame) / safeFps;
    const durationSeconds = event.durationFrames / safeFps;
    const settings = { intensity: event.intensity, speed: event.speed };
    const pose = evaluateCharacterPreviewPose({ actionId: action, sourceTimeSeconds, durationSeconds, capabilities, attachmentPoints: joints, settings });
    const channels = action === "return-idle"
      ? Object.keys(target.pose) as (keyof PreviewPose)[]
      : getPreviewActionChannels(action).flatMap((channel) => channel === "head-rotation" ? ["headRotation" as const, "neckRotation" as const, "torsoRotation" as const] : channel === "arm-gesture" ? ["leftArmRotation" as const, "rightArmRotation" as const, "leftElbowRotation" as const, "rightElbowRotation" as const, "leftWristRotation" as const, "rightWristRotation" as const, "leftHandRotation" as const, "rightHandRotation" as const] : []);
    (poseLayersByInstance[event.characterInstanceId] ??= []).push({ pose, channels, priority: event.priority });
    const expression = getPreviewExpression(action, capabilities);
    if (expression && !expressionClaimed.has(event.characterInstanceId)) {
      expressionClaimed.add(event.characterInstanceId);
      target.expression = expression;
      target.expressionWeight = evaluateFacialExpressionWeight(action, sourceTimeSeconds, durationSeconds, settings);
    }
  }
  for (const [instanceId, layers] of Object.entries(poseLayersByInstance)) result[instanceId]!.pose = blendPreviewPoseLayers(layers);
  return result;
}
