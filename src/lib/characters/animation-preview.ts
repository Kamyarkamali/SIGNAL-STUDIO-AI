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
  leftArmRotation: [number, number, number];
  rightArmRotation: [number, number, number];
};
export type CharacterPreviewPlaybackPose = PreviewPose;
const supportedFacialExpressions: readonly ChatGptExpression[] = ["happy", "sad", "angry", "surprised", "worried", "confused", "thinking", "listening", "excited"];

type ActionDefinition = { label: string; duration: number; channels: readonly CharacterAnimationCapability[]; expression?: ChatGptExpression };
const actionDefinitions: Record<CharacterPreviewActionId, ActionDefinition> = {
  neutral: { label: "حالت خنثی", duration: 0, channels: [] },
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
  thinking: { label: "در حال فکر", duration: 2.6, channels: ["head-rotation", "facial-expression"], expression: "thinking" },
  listening: { label: "در حال گوش‌دادن", duration: 2.4, channels: ["head-rotation", "facial-expression"], expression: "listening" },
  agreeing: { label: "موافقت", duration: 1.45, channels: ["head-rotation"] },
  disagreeing: { label: "مخالفت", duration: 1.45, channels: ["head-rotation"] },
  laughing: { label: "خندیدن", duration: 1.8, channels: ["head-rotation", "arm-gesture", "facial-expression"], expression: "happy" },
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
export function isPreviewActionSupported(actionId: CharacterPreviewActionId, capabilities: readonly CharacterAnimationCapability[]): boolean {
  if (actionId === "neutral" || actionId === "return-idle") return true;
  return actionDefinitions[actionId].channels.some((channel) => capabilities.includes(channel));
}
export function getPreviewActionAvailability(capabilities: readonly CharacterAnimationCapability[]) {
  return previewActionIds.map((id) => ({ id, label: previewActionLabels[id], supported: isPreviewActionSupported(id, capabilities) }));
}
export function getPreviewDuration(actionId: CharacterPreviewActionId, settings: Partial<PreviewSettings> = {}): number {
  const normalized = clampPreviewSettings(settings);
  return actionId === "return-idle" ? normalized.returnSeconds : (actionDefinitions[actionId].duration || 1) / normalized.speed;
}
const zeroPose = (): PreviewPose => ({ headRotation: [0, 0, 0], leftArmRotation: [0, 0, 0], rightArmRotation: [0, 0, 0] });
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
  capabilities: readonly CharacterAnimationCapability[]; fromPose?: PreviewPose; settings?: Partial<PreviewSettings>;
}): PreviewPose {
  const { actionId, sourceTimeSeconds, capabilities } = input;
  const settings = clampPreviewSettings(input.settings);
  if (!Number.isFinite(sourceTimeSeconds)) return zeroPose();
  if (actionId === "neutral") return zeroPose();
  const baseDuration = actionDefinitions[actionId].duration || input.durationSeconds || 1;
  const duration = input.durationSeconds && input.durationSeconds > 0 ? input.durationSeconds : baseDuration / settings.speed;
  if (!Number.isFinite(duration) || duration <= 0) return zeroPose();
  const progress = Math.max(0, Math.min(1, sourceTimeSeconds / duration));
  if (actionId === "return-idle") {
    if (progress === 1) return zeroPose();
    const remaining = 1 - ease(progress, settings.easing);
    const from = input.fromPose ?? zeroPose();
    return { headRotation: from.headRotation.map((v) => v * remaining) as PreviewPose["headRotation"], leftArmRotation: from.leftArmRotation.map((v) => v * remaining) as PreviewPose["leftArmRotation"], rightArmRotation: from.rightArmRotation.map((v) => v * remaining) as PreviewPose["rightArmRotation"] };
  }
  if (!isPreviewActionSupported(actionId, capabilities) || progress === 0 || progress === 1) return zeroPose();
  const t = progress;
  const envelope = pulse(t, Math.min(0.48, settings.transitionSeconds / duration), settings.easing) * settings.intensity;
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
    else if (actionId === "surprised" || actionId === "excited") pose.headRotation[0] = -0.12 * envelope * Math.sin(Math.PI * t);
    else if (actionId === "laughing") pose.headRotation[0] = 0.14 * envelope * Math.sin(6 * Math.PI * t);
  }
  if (capabilities.includes("arm-gesture")) {
    if (actionId === "arm-gesture" || actionId === "explain") { pose.leftArmRotation[2] = -0.22 * envelope; pose.rightArmRotation[2] = 0.22 * envelope; }
    else if (actionId === "hand-wave") pose.rightArmRotation[2] = 0.3 * envelope * Math.sin(5 * Math.PI * t);
    else if (actionId === "excited" || actionId === "surprised" || actionId === "celebrating" || actionId === "happy") {
      const lift = actionId === "happy" ? 0.2 : actionId === "surprised" ? 0.3 : 0.36;
      const rhythm = actionId === "excited" || actionId === "celebrating" ? 0.82 + 0.18 * Math.sin(4 * Math.PI * t) : 1;
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
  for (const channel of ["headRotation", "leftArmRotation", "rightArmRotation"] as const) {
    const candidate = layers.find((layer) => layer.channels.includes(channel) && layer.priority === Math.max(-Infinity, ...layers.filter((entry) => entry.channels.includes(channel)).map((entry) => entry.priority)));
    if (candidate) result[channel] = [...candidate.pose[channel]] as PreviewPose[typeof channel];
  }
  return result;
}
