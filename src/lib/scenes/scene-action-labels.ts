import type { SceneActionEvent } from "./scene-schema.ts";

export const sceneActionLabels: Record<SceneActionEvent["action"], string> = {
  "head-turn": "چرخش سر",
  "head-nod": "تکان سر",
  "quick-nod": "تکان سریع سر",
  "head-shake": "تکان سر برای مخالفت",
  "arm-gesture": "حرکت دست",
  "hand-wave": "دست تکان دادن",
  explain: "توضیح با دست",
  happy: "خوشحالی",
  excited: "هیجان‌زدگی",
  surprised: "تعجب",
  sad: "غمگینی",
  angry: "عصبانیت",
  worried: "نگرانی",
  confused: "سردرگمی",
  thinking: "فکر کردن",
  listening: "گوش دادن",
  agreeing: "موافقت",
  disagreeing: "مخالفت",
  laughing: "خندیدن",
  celebrating: "جشن گرفتن",
  "return-idle": "بازگشت به حالت خنثی",
  "gaze-character": "نگاه به شخصیت",
  "gaze-prop": "نگاه به وسیله",
};

export function sceneActionCategory(action: SceneActionEvent["action"]): "head" | "gesture" | "expression" | "gaze" {
  if (action.startsWith("gaze-")) return "gaze";
  if (["arm-gesture", "hand-wave", "explain", "celebrating"].includes(action)) return "gesture";
  if (["happy", "excited", "surprised", "sad", "angry", "worried", "confused", "thinking", "listening", "laughing"].includes(action)) return "expression";
  return "head";
}
