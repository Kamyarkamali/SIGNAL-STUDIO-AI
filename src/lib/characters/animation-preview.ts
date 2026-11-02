import type { ChatGptExpression } from "./chatgpt-expression-presets";

export const previewActionIds = [
  "neutral", "head-turn", "head-nod", "arm-gesture", "quick-nod", "thoughtful-nod",
  "head-shake", "hand-wave", "explain", "happy", "excited", "surprised", "sad",
  "angry", "worried", "confused", "thinking", "listening", "agreeing", "disagreeing",
  "laughing", "celebrating", "return-idle",
] as const;

export type CharacterPreviewActionId = (typeof previewActionIds)[number];
export type CharacterAnimationCapability = "head-rotation" | "arm-gesture" | "facial-expression";
export type PreviewEasing = "smooth" | "ease-in" | "ease-out" | "ease-in-out";
export type PreviewSettings = { speed: number; intensity: number; transitionSeconds: number; returnSeconds: number; easing: PreviewEasing };
export const defaultPreviewSettings: PreviewSettings = { speed: 1, intensity: 1, transitionSeconds: 0.22, returnSeconds: 0.5, easing: "smooth" };
export const previewSettingLimits = { speed: [0.5, 2] as const, intensity: [0.25, 1.5] as const, transitionSeconds: [0.08, 0.8] as const, returnSeconds: [0.15, 1.5] as const };
export type PreviewPose = {
  headRotation: [number, number, number];
  neckRotation: [number, number, number];
  torsoRotation: [number, number, number];
  leftArmRotation: [number, number, number];
  rightArmRotation: [number, number, number];
  leftElbowRotation: [number, number, number]; rightElbowRotation: [number, number, number];
  leftWristRotation: [number, number, number]; rightWristRotation: [number, number, number];
  leftHandRotation: [number, number, number]; rightHandRotation: [number, number, number];
};
export type CharacterPreviewPlaybackPose = PreviewPose;
const supportedFacialExpressions: readonly ChatGptExpression[] = ["neutral", "happy", "sad", "angry", "surprised", "worried", "confused", "thinking", "listening", "excited", "laughing"];

type ActionDefinition = { label: string; duration: number; channels: readonly CharacterAnimationCapability[]; expression?: ChatGptExpression; requiredJoints?: readonly string[]; preset?: "thinking" | "laughing" };
const actionDefinitions: Record<CharacterPreviewActionId, ActionDefinition> = {
  neutral: { label: "حالت خنثی", duration: 1.2, channels: ["facial-expression"], expression: "neutral" },
  "head-turn": { label: "چرخش آرام سر", duration: 2.4, channels: ["head-rotation"] },
  "head-nod": { label: "تکان آرام سر", duration: 2.2, channels: ["head-rotation"] },
  "arm-gesture": { label: "حرکت کوچک دست", duration: 2, channels: ["arm-gesture"] },
  "quick-nod": { label: "تکان سریع سر", duration: 0.9, channels: ["head-rotation"] },
  "thoughtful-nod": { label: "تکان متفکرانه", duration: 2.8, channels: ["head-rotation"] },
  "head-shake": { label: "تکان نه‌گفتن", duration: 1.35, channels: ["head-rotation"] },
  "hand-wave": { label: "دست‌تکان‌دادن", duration: 1.6, channels: ["arm-gesture"] },
  explain: { label: "توضیح با دست", duration: 2.3, channels: ["arm-gesture"] },
  happy: { label: "خوشحال", duration: 1.8, channels: ["head-rotation", "arm-gesture", "facial-expression"], expression: "happy" },
  excited: { label: "هیجان‌زده", duration: 1.25, channels: ["head-rotation", "arm-gesture", "facial-expression"], expression: "excited" },
  surprised: { label: "متعجب", duration: 0.85, channels: ["head-rotation", "arm-gesture", "facial-expression"], expression: "surprised" },
  sad: { label: "غمگین", duration: 2.8, channels: ["head-rotation", "facial-expression"], expression: "sad" },
  angry: { label: "عصبانی", duration: 1.5, channels: ["head-rotation", "arm-gesture", "facial-expression"], expression: "angry" },
  worried: { label: "نگران", duration: 2.5, channels: ["head-rotation", "facial-expression"], expression: "worried" },
  confused: { label: "گیج", duration: 2, channels: ["head-rotation", "facial-expression"], expression: "confused" },
  thinking: { label: "در حال فکر", duration: 2.6, channels: ["head-rotation", "arm-gesture", "facial-expression"], expression: "thinking", requiredJoints: ["right-arm-pivot", "right-elbow-pivot", "right-wrist-pivot", "right-hand-pivot"], preset: "thinking" },
  listening: { label: "در حال گوش‌دادن", duration: 2.4, channels: ["head-rotation", "facial-expression"], expression: "listening" },
  agreeing: { label: "موافقت", duration: 1.45, channels: ["head-rotation"] },
  disagreeing: { label: "مخالفت", duration: 1.45, channels: ["head-rotation"] },
  laughing: { label: "خندیدن", duration: 1.8, channels: ["head-rotation", "arm-gesture", "facial-expression"], expression: "laughing", preset: "laughing" },
  celebrating: { label: "جشن‌گرفتن", duration: 1.3, channels: ["arm-gesture", "facial-expression"], expression: "excited" },
  "return-idle": { label: "بازگشت به حالت خنثی", duration: 0.5, channels: [] },
};
export const previewActionLabels = Object.fromEntries(previewActionIds.map((id) => [id, actionDefinitions[id].label])) as Record<CharacterPreviewActionId, string>;
export function clampPreviewSettings(settings: Partial<PreviewSettings> = {}): PreviewSettings {
  const bounded = (key: "speed" | "intensity" | "transitionSeconds" | "returnSeconds") => {
    const [min, max] = previewSettingLimits[key]; const value = settings[key] ?? defaultPreviewSettings[key];
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : defaultPreviewSettings[key];
  };
  const easing = settings.easing;
  return { speed: bounded("speed"), intensity: bounded("intensity"), transitionSeconds: bounded("transitionSeconds"), returnSeconds: bounded("returnSeconds"), easing: easing === "ease-in" || easing === "ease-out" || easing === "ease-in-out" ? easing : "smooth" };
}
export function getPreviewExpression(actionId: CharacterPreviewActionId, capabilities: readonly CharacterAnimationCapability[]): ChatGptExpression | undefined {
  const expression = actionDefinitions[actionId].expression;
  return expression && capabilities.includes("facial-expression") && supportedFacialExpressions.includes(expression) ? expression : undefined;
}
export function getPreviewActionChannels(actionId: CharacterPreviewActionId): readonly CharacterAnimationCapability[] {
  return actionDefinitions[actionId].channels;
}
export function isPreviewActionSupported(actionId: CharacterPreviewActionId, capabilities: readonly CharacterAnimationCapability[], attachmentPoints: readonly string[] = []): boolean {
  if (actionId === "return-idle") return true;
  const required = actionDefinitions[actionId].requiredJoints;
  if (required && required.some((joint) => !attachmentPoints.includes(joint))) return false;
  return actionDefinitions[actionId].channels.some((channel) => capabilities.includes(channel));
}
export function getPreviewActionAvailability(capabilities: readonly CharacterAnimationCapability[], attachmentPoints: readonly string[] = []) {
  return previewActionIds.map((id) => ({ id, label: previewActionLabels[id], supported: isPreviewActionSupported(id, capabilities, attachmentPoints) }));
}
export function getPreviewDuration(actionId: CharacterPreviewActionId, settings: Partial<PreviewSettings> = {}): number {
  const normalized = clampPreviewSettings(settings);
  return actionId === "return-idle" ? normalized.returnSeconds : (actionDefinitions[actionId].duration || 1) / normalized.speed;
}
/** Deterministic attack/release envelope for actual renderer facial controls. */
export function evaluateFacialExpressionWeight(actionId: CharacterPreviewActionId, sourceTimeSeconds: number, durationSeconds: number, settings: Partial<PreviewSettings> = {}): number {
  const normalized = clampPreviewSettings(settings);
  if (!actionDefinitions[actionId].expression || !Number.isFinite(sourceTimeSeconds) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  const progress = Math.max(0, Math.min(1, sourceTimeSeconds / durationSeconds));
  const edgeSeconds = actionId === "surprised" ? 0.11 : actionId === "excited" || actionId === "celebrating" ? 0.18 : normalized.transitionSeconds;
  return pulse(progress, Math.min(0.48, edgeSeconds / durationSeconds), normalized.easing) * Math.min(1, normalized.intensity);
}
const zeroPose = (): PreviewPose => Object.fromEntries(["headRotation", "neckRotation", "torsoRotation", "leftArmRotation", "rightArmRotation", "leftElbowRotation", "rightElbowRotation", "leftWristRotation", "rightWristRotation", "leftHandRotation", "rightHandRotation"].map((key) => [key, [0, 0, 0]])) as PreviewPose;
const emotionMotionPresets = {
  thinking: { head: [0.045, -0.16, -0.08], shoulder: 0.62, elbow: -1.82, wrist: -0.26, hand: 0.12, torso: -0.035 },
  laughing: { head: [0.14, 0, 0], shoulder: 0.12, elbow: -0.18, wrist: 0, hand: 0, torso: 0.055 },
} as const;
function samplePreset(progress: number, easing: PreviewEasing, preset: "thinking" | "laughing"): PreviewPose {
  const pose = zeroPose(); const values = emotionMotionPresets[preset];
  const attack = ease(Math.min(1, progress / 0.22), easing), release = ease(Math.min(1, (1 - progress) / 0.2), easing);
  const hold = attack * release;
  if (preset === "thinking") {
    pose.headRotation = values.head.map((v) => v * hold) as PreviewPose["headRotation"];
    pose.rightArmRotation[2] = values.shoulder * hold; pose.rightElbowRotation[2] = values.elbow * hold;
    pose.rightWristRotation[2] = values.wrist * hold; pose.rightHandRotation[2] = values.hand * hold;
    pose.torsoRotation[0] = values.torso * hold;
  } else {
    const rhythm = Math.sin(progress * Math.PI * 6) * hold;
    pose.headRotation[0] = values.head[0] * rhythm; pose.torsoRotation[0] = values.torso * rhythm;
    pose.leftArmRotation[2] = -values.shoulder * rhythm; pose.rightArmRotation[2] = values.shoulder * rhythm;
    pose.leftElbowRotation[2] = values.elbow * rhythm; pose.rightElbowRotation[2] = -values.elbow * rhythm;
  }
  return pose;
}
function ease(value: number, easing: PreviewEasing): number {
  const t = Math.max(0, Math.min(1, value));
  if (easing === "ease-in") return t * t;
  if (easing === "ease-out") return 1 - (1 - t) * (1 - t);
  if (easing === "ease-in-out") return t * t * (3 - 2 * t);
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}
function pulse(progress: number, transition: number, easing: PreviewEasing): number {
  const edge = Math.max(0.06, Math.min(0.48, transition));
  return ease(progress / edge, easing) * ease((1 - progress) / edge, easing);
}

/** Pure arbitrary-time evaluator. Preview speed/intensity never affect the saved world transform. */
export function evaluateCharacterPreviewPose(input: {
  actionId: CharacterPreviewActionId; sourceTimeSeconds: number; durationSeconds?: number;
  capabilities: readonly CharacterAnimationCapability[]; attachmentPoints?: readonly string[]; fromPose?: PreviewPose; settings?: Partial<PreviewSettings>;
}): PreviewPose {
  const { actionId, sourceTimeSeconds, capabilities } = input;
  const settings = clampPreviewSettings(input.settings);
  if (!Number.isFinite(sourceTimeSeconds)) return zeroPose();
  const baseDuration = actionDefinitions[actionId].duration || input.durationSeconds || 1;
  const duration = input.durationSeconds && input.durationSeconds > 0 ? input.durationSeconds : baseDuration / settings.speed;
  if (!Number.isFinite(duration) || duration <= 0) return zeroPose();
  const progress = Math.max(0, Math.min(1, sourceTimeSeconds / duration));
  if (actionId === "return-idle") {
    if (progress === 1) return zeroPose();
    const remaining = 1 - ease(progress, settings.easing);
    const from = input.fromPose ?? zeroPose();
    return Object.fromEntries(Object.keys(from).map((key) => [key, from[key as keyof PreviewPose].map((v) => v * remaining)])) as PreviewPose;
  }
  if (!isPreviewActionSupported(actionId, capabilities, input.attachmentPoints) || progress === 0 || progress === 1) return zeroPose();
  const preset = actionDefinitions[actionId].preset;
  if (preset) return samplePreset(progress, settings.easing, preset);
  const t = progress;
  // Surprise has a short, sharp attack; excitement builds quickly, then eases
  // out. Calm reactions retain the user's configured transition envelope.
  const reactionEdge = actionId === "surprised" ? 0.11 / duration
    : actionId === "excited" || actionId === "celebrating" ? 0.18 / duration
      : settings.transitionSeconds / duration;
  const envelope = pulse(t, Math.min(0.48, reactionEdge), settings.easing) * settings.intensity;
  const pose = zeroPose();
  if (capabilities.includes("head-rotation")) {
    if (actionId === "head-turn") pose.headRotation[1] = 0.3 * envelope * Math.sin(Math.PI * t);
    else if (actionId === "head-nod" || actionId === "thoughtful-nod" || actionId === "listening") pose.headRotation[0] = 0.12 * envelope * Math.sin(2 * Math.PI * t);
    else if (actionId === "quick-nod" || actionId === "agreeing" || actionId === "happy") pose.headRotation[0] = 0.17 * envelope * Math.sin(4 * Math.PI * t);
    else if (actionId === "head-shake" || actionId === "disagreeing" || actionId === "angry") pose.headRotation[1] = 0.15 * envelope * Math.sin(4 * Math.PI * t);
    else if (actionId === "confused") pose.headRotation[2] = 0.15 * envelope;
    else if (actionId === "worried") { pose.headRotation[2] = 0.08 * envelope; pose.headRotation[0] = 0.06 * envelope; }
    else if (actionId === "thinking") pose.headRotation[1] = 0.08 * envelope * Math.sin(2 * Math.PI * t);
    else if (actionId === "sad") pose.headRotation[0] = 0.09 * envelope;
    else if (actionId === "surprised") pose.headRotation[0] = -0.24 * envelope * (1 - t);
    else if (actionId === "excited") pose.headRotation[0] = -0.2 * envelope * Math.sin(2 * Math.PI * t);
    else if (actionId === "laughing") pose.headRotation[0] = 0.14 * envelope * Math.sin(6 * Math.PI * t);
  }
  if (capabilities.includes("arm-gesture")) {
    if (actionId === "arm-gesture" || actionId === "explain") { pose.leftArmRotation[2] = -0.22 * envelope; pose.rightArmRotation[2] = 0.22 * envelope; }
    else if (actionId === "hand-wave") pose.rightArmRotation[2] = 0.3 * envelope * Math.sin(5 * Math.PI * t);
    else if (actionId === "excited" || actionId === "surprised" || actionId === "celebrating" || actionId === "happy") {
      const lift = actionId === "happy" ? 0.2 : actionId === "surprised" ? 0.36 : 0.34;
      const rhythm = actionId === "excited" || actionId === "celebrating" ? 0.9 + 0.1 * Math.sin(2 * Math.PI * t) : 1;
      pose.leftArmRotation[2] = -lift * envelope * rhythm; pose.rightArmRotation[2] = lift * envelope * rhythm;
    }
    else if (actionId === "angry") { pose.leftArmRotation[2] = -0.14 * envelope; pose.rightArmRotation[2] = 0.14 * envelope; }
    else if (actionId === "laughing") { pose.leftArmRotation[2] = -0.12 * envelope * Math.sin(6 * Math.PI * t); pose.rightArmRotation[2] = 0.12 * envelope * Math.sin(6 * Math.PI * t); }
  }
  return pose;
}

/** Resolves overlaps per pose channel; the highest priority wins, ties use stable input order. */
export function blendPreviewPoseLayers(layers: readonly { pose: PreviewPose; channels: readonly (keyof PreviewPose)[]; priority: number }[]): PreviewPose {
  const result = zeroPose();
  for (const channel of Object.keys(result) as (keyof PreviewPose)[]) {
    const candidate = layers.find((layer) => layer.channels.includes(channel) && layer.priority === Math.max(-Infinity, ...layers.filter((entry) => entry.channels.includes(channel)).map((entry) => entry.priority)));
    if (candidate) result[channel] = [...candidate.pose[channel]] as PreviewPose[typeof channel];
  }
  return result;
}
