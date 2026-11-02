export const chatGptExpressionNames = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "worried",
  "confused",
  "thinking",
  "listening",
  "speaking",
  "excited",
  "laughing",
] as const;

export type ChatGptExpression = (typeof chatGptExpressionNames)[number];
export type ChatGptMouthShape =
  | "line"
  | "smile"
  | "frown"
  | "open"
  | "small-open"
  | "laughing-open"
  | "tilted-line";

type ChatGptExpressionPreset = {
  eyeScaleY: number;
  eyeYOffset: readonly [number, number];
  pupilOffsetX: readonly [number, number];
  browAngle: readonly [number, number];
  browLift: number;
  mouth: ChatGptMouthShape;
  mouthScale: readonly [number, number];
  mouthRotation: number;
};

export const chatGptExpressionPresets: Readonly<
  Record<ChatGptExpression, ChatGptExpressionPreset>
> = {
  neutral: {
    eyeScaleY: 0.84,
    eyeYOffset: [0, 0],
    pupilOffsetX: [0, 0],
    browAngle: [0, 0],
    browLift: 0,
    mouth: "line",
    mouthScale: [1, 0.8],
    mouthRotation: 0,
  },
  happy: {
    eyeScaleY: 0.92,
    eyeYOffset: [0, 0],
    pupilOffsetX: [0, 0],
    browAngle: [0, 0],
    browLift: 0.035,
    mouth: "smile",
    mouthScale: [1.45, 1.05],
    mouthRotation: 0,
  },
  sad: {
    eyeScaleY: 1.12,
    eyeYOffset: [-0.01, -0.01],
    pupilOffsetX: [0, 0],
    browAngle: [0.58, -0.58],
    browLift: 0.045,
    mouth: "frown",
    mouthScale: [1.18, 0.68],
    mouthRotation: Math.PI,
  },
  angry: {
    eyeScaleY: 0.48,
    eyeYOffset: [-0.005, -0.005],
    pupilOffsetX: [0, 0],
    browAngle: [-0.62, 0.62],
    browLift: -0.018,
    mouth: "small-open",
    mouthScale: [0.9, 1.15],
    mouthRotation: 0,
  },
  surprised: {
    eyeScaleY: 1.65,
    eyeYOffset: [0.01, 0.01],
    pupilOffsetX: [0, 0],
    browAngle: [0, 0],
    browLift: 0.12,
    mouth: "open",
    mouthScale: [1.02, 1.45],
    mouthRotation: 0,
  },
  worried: {
    eyeScaleY: 0.94,
    eyeYOffset: [0, 0],
    pupilOffsetX: [0, 0],
    browAngle: [0.3, -0.3],
    browLift: 0.045,
    mouth: "frown",
    mouthScale: [0.82, 0.74],
    mouthRotation: 0,
  },
  confused: {
    eyeScaleY: 0.98,
    eyeYOffset: [0.025, -0.005],
    pupilOffsetX: [-0.012, 0.018],
    browAngle: [0.02, -0.32],
    browLift: 0.025,
    mouth: "tilted-line",
    mouthScale: [1.05, 0.72],
    mouthRotation: -0.16,
  },
  thinking: {
    eyeScaleY: 0.82,
    eyeYOffset: [0, 0],
    pupilOffsetX: [0.024, 0.024],
    browAngle: [0.04, -0.22],
    browLift: 0.028,
    mouth: "tilted-line",
    mouthScale: [0.9, 0.68],
    mouthRotation: 0.12,
  },
  listening: {
    eyeScaleY: 0.96,
    eyeYOffset: [0, 0],
    pupilOffsetX: [0, 0],
    browAngle: [0, 0],
    browLift: 0.025,
    mouth: "smile",
    mouthScale: [1.08, 0.7],
    mouthRotation: Math.PI,
  },
  speaking: {
    eyeScaleY: 0.98,
    eyeYOffset: [0, 0],
    pupilOffsetX: [0, 0],
    browAngle: [0, 0],
    browLift: 0.01,
    mouth: "small-open",
    mouthScale: [0.82, 0.88],
    mouthRotation: 0,
  },
  excited: {
    eyeScaleY: 1.52,
    eyeYOffset: [0.005, 0.005],
    pupilOffsetX: [0, 0],
    browAngle: [0, 0],
    browLift: 0.105,
    mouth: "open",
    mouthScale: [1.6, 1.5],
    mouthRotation: 0,
  },
  laughing: {
    eyeScaleY: 0.7,
    eyeYOffset: [-0.005, -0.005],
    pupilOffsetX: [0, 0],
    browAngle: [0.05, -0.05],
    browLift: 0.018,
    mouth: "laughing-open",
    mouthScale: [1.55, 1.55],
    mouthRotation: 0,
  },
};

/** Stored pre-B2 values are interpreted without requiring a project schema migration. */
export function resolveChatGptExpression(
  value: string | undefined,
): ChatGptExpression {
  if (value && value in chatGptExpressionPresets)
    return value as ChatGptExpression;
  if (value === "friendly") return "happy";
  if (value === "focused") return "thinking";
  if (value === "curious") return "confused";
  return "happy";
}
