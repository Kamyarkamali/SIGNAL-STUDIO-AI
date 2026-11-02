import { chatGptExpressionPresets, type ChatGptExpression } from "./chatgpt-expression-presets.ts";

type MutableVector = { x: number; y: number; z: number };
export type FacialNode = {
  name?: string;
  position: MutableVector;
  rotation: MutableVector;
  scale: MutableVector;
  visible?: boolean;
  getObjectByName(name: string): FacialNode | undefined;
};

const modelRest = {
  "chatgpt-robot": { eyeY: 0.025, browY: 0.115, eyeScaleY: 0.84, mouthScale: [1, 0.8] as const },
  "claude-terracotta-mascot": { eyeY: 0.045, browY: 0.16, eyeScaleY: 1, mouthScale: [1, 0.8] as const },
  "kamyar-stylized": { eyeY: 0.018, browY: 0.074, eyeScaleY: 1, mouthScale: [1, 1] as const },
  "hamid-stylized": { eyeY: 0.02, browY: 0.078, eyeScaleY: 1, mouthScale: [1, 1] as const },
} as const;

/** Applies serializable expression values only to private, named per-instance face nodes. */
export function applyFacialExpressionPose(root: FacialNode, modelKey: keyof typeof modelRest, expression: ChatGptExpression, weight: number, blinkWeight = 0): void {
  const target = chatGptExpressionPresets[expression];
  const rest = modelRest[modelKey];
  const human = modelKey === "kamyar-stylized" || modelKey === "hamid-stylized";
  const humanEyeScale: Record<ChatGptExpression, number> = {
    neutral: 1, happy: 1.08, sad: 0.92, angry: 0.78, surprised: 1.24, worried: 0.9,
    confused: 0.96, thinking: 0.94, listening: 1.02, speaking: 1.02, excited: 1.18, laughing: 0.72,
  };
  const humanMouthScale: Record<ChatGptExpression, readonly [number, number]> = {
    neutral: [1, 1], happy: [1.25, 1.18], sad: [1.1, 0.88], angry: [0.9, 1.28],
    surprised: [0.9, 1.5], worried: [0.86, 0.88], confused: [1.05, 0.92],
    thinking: [0.9, 0.86], listening: [1.08, 1.08], speaking: [0.9, 1.18],
    excited: [1.3, 1.4], laughing: [1.35, 1.5],
  };
  const amount = Number.isFinite(weight) ? Math.max(0, Math.min(1, weight)) : 0;
  const blink = Number.isFinite(blinkWeight) ? Math.max(0, Math.min(1, blinkWeight)) : 0;
  const mix = (a: number, b: number) => a + (b - a) * amount;
  for (const [index, side] of [-1, 1].entries()) {
    const eye = root.getObjectByName(side < 0 ? "left-eye" : "right-eye");
    if (!eye) continue;
    eye.position.y = mix(rest.eyeY, rest.eyeY + target.eyeYOffset[index] * (human ? 0.32 : 1));
    const shape = eye.getObjectByName("eye-shape");
    const targetEyeScale = human ? humanEyeScale[expression] : target.eyeScaleY;
    const eyeScale = mix(rest.eyeScaleY, targetEyeScale) * (1 - 0.94 * blink);
    if (shape) shape.scale.y = eyeScale;
    else eye.scale.y = eyeScale;
    const brow = eye.getObjectByName("eyebrow") ?? root.getObjectByName(side < 0 ? "left-eyebrow" : "right-eyebrow");
    if (brow) {
      brow.position.y = mix(rest.browY, rest.browY + target.browLift * (human ? 0.28 : 1));
      brow.rotation.z = mix(0, target.browAngle[index] * (human ? 0.68 : 1));
    }
  }
  const mouth = root.getObjectByName("mouth-display") ?? root.getObjectByName("mouth");
  if (mouth) {
    const mouthScale = human ? humanMouthScale[expression] : target.mouthScale;
    mouth.scale.x = mix(rest.mouthScale[0], mouthScale[0]);
    mouth.scale.y = mix(rest.mouthScale[1], mouthScale[1]);
    mouth.rotation.z = mix(0, target.mouthRotation);
    for (const shape of ["neutral", "smile", "frown", "open", "small-open", "laughing-open", "tilted-line"]) {
      const variant = mouth.getObjectByName(`mouth-${shape}`);
      if (variant) variant.visible = amount > 0.02 && shapeForExpression(expression) === shape;
    }
  }
}

function shapeForExpression(expression: ChatGptExpression): string {
  const mouth = chatGptExpressionPresets[expression].mouth;
  if (mouth === "line") return "neutral";
  if (mouth === "tilted-line") return "tilted-line";
  if (mouth === "laughing-open") return "laughing-open";
  if (mouth === "small-open") return "small-open";
  return mouth;
}

/** Deterministic brief blink pulse; per-instance phase avoids synchronized copies. */
export function evaluatePreviewBlinkWeight(timeSeconds: number, phaseSeconds = 0): number {
  if (!Number.isFinite(timeSeconds) || !Number.isFinite(phaseSeconds)) return 0;
  const cycle = 2.35;
  const local = ((timeSeconds + phaseSeconds) % cycle + cycle) % cycle;
  const t = local / 0.14;
  if (t >= 1) return 0;
  return t < 0.5 ? t * 2 : (1 - t) * 2;
}
