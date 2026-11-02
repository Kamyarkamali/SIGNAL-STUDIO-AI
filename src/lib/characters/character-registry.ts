import { z } from "zod";
import {
  chatGptExpressionNames,
  resolveChatGptExpression,
} from "./chatgpt-expression-presets.ts";

const vector = z.tuple([
  z.number().finite().min(-100).max(100),
  z.number().finite().min(-100).max(100),
  z.number().finite().min(-100).max(100),
]);
const positiveVector = z.tuple([
  z.number().finite().min(0.05).max(20),
  z.number().finite().min(0.05).max(20),
  z.number().finite().min(0.05).max(20),
]);
const transformSchema = z
  .object({ position: vector, rotation: vector, scale: positiveVector })
  .strict();
const selectFieldSchema = z
  .object({
    key: z.string().regex(/^[a-z][A-Za-z0-9]*$/),
    label: z.string().min(1),
    kind: z.literal("select"),
    defaultValue: z.string(),
    options: z
      .array(z.object({ value: z.string(), label: z.string().min(1) }).strict())
      .min(1),
  })
  .strict()
  .superRefine((field, context) => {
    const values = field.options.map((option) => option.value);
    if (new Set(values).size !== values.length)
      context.addIssue({
        code: "custom",
        message: "Customization options must be unique.",
      });
    if (!values.includes(field.defaultValue))
      context.addIssue({
        code: "custom",
        message: "Default customization must be an available option.",
      });
  });
const customizationFieldSchema = z.union([
  z
    .object({
      key: z.string().regex(/^[a-z][A-Za-z0-9]*$/),
      label: z.string().min(1),
      kind: z.literal("color"),
      defaultValue: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .strict(),
  selectFieldSchema,
]);
const glbAssetSchema = z
  .object({
    /** Bundled, reviewed asset path. Project-owned import URLs need a separate validated resolver. */
    url: z
      .string()
      .regex(
        /^(?:\/character-assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.glb|\/api\/projects\/[0-9a-f-]{36}\/character-assets\/[0-9a-f-]{36})$/,
      ),
    /** Optional measured height in GLB meters; checked before the authored model is displayed. */
    heightRangeMeters: z
      .tuple([z.number().finite().positive(), z.number().finite().positive()])
      .refine(([min, max]) => min <= max)
      .optional(),
    /** Named material slots and mesh variants must cover every visible customization control. */
    materialColors: z
      .record(z.string(), z.array(z.string().min(1)).min(1))
      .default({}),
    meshVariants: z
      .record(z.string(), z.record(z.string(), z.array(z.string().min(1))))
      .default({}),
    floorOffsetY: z.number().finite().min(-20).max(20).optional(),
    orientationRadians: z
      .number()
      .finite()
      .min(-Math.PI)
      .max(Math.PI)
      .optional(),
    inspection: z
      .object({
        bounds: z
          .object({
            min: z.tuple([z.number(), z.number(), z.number()]),
            max: z.tuple([z.number(), z.number(), z.number()]),
            size: z.tuple([z.number(), z.number(), z.number()]),
          })
          .strict(),
        nodeNames: z.array(z.string().max(120)).max(500),
        meshNames: z.array(z.string().max(120)).max(250),
        materialNames: z.array(z.string().max(120)).max(250),
        colorableMaterialNames: z.array(z.string().max(120)).max(250),
        skeletonCount: z.number().int().min(0).max(100),
        morphTargetNames: z.array(z.string().max(120)).max(500),
        animationNames: z.array(z.string().max(120)).max(100),
      })
      .strict()
      .optional(),
  })
  .strict();

export const characterModelDefinitionSchema = z
  .object({
    id: z.string().regex(/^character-model:[a-z0-9-]+$/),
    displayName: z.string().min(1).max(120),
    description: z.string().min(1).max(240),
    modelType: z.enum(["human", "robot", "mascot", "imported"]),
    source: z.enum(["asset", "procedural", "development-placeholder"]),
    rendererKey: z.string().min(1).max(100),
    assetId: z.uuid().optional(),
    glb: glbAssetSchema.optional(),
    forwardAxis: z.enum(["+Z", "-Z", "+X", "-X"]),
    defaultTransform: transformSchema,
    /** Model-local lowest support/contact point that rests on a chair surface. */
    seatContactY: z.number().finite().min(-100).max(100),
    /** Fine seating correction in model-local coordinates, rotated into the studio by the seat yaw. */
    seatPositionOffset: z.tuple([
      z.number().finite().min(-10).max(10),
      z.number().finite().min(-10).max(10),
      z.number().finite().min(-10).max(10),
    ]),
    /** Model-specific yaw correction in radians, added to the anchor orientation. */
    seatYawOffsetRadians: z.number().finite().min(-Math.PI).max(Math.PI),
    /** Surface types supported by this model; defaults to legacy chair placement. */
    placementKinds: z
      .array(z.enum(["seat", "tabletop", "platform"]))
      .min(1)
      .default(["seat"]),
    placementContactY: z.number().finite().min(-100).max(100).optional(),
    placementPositionOffset: z
      .tuple([
        z.number().finite().min(-10).max(10),
        z.number().finite().min(-10).max(10),
        z.number().finite().min(-10).max(10),
      ])
      .optional(),
    placementYawOffsetRadians: z
      .number()
      .finite()
      .min(-Math.PI)
      .max(Math.PI)
      .optional(),
    placementRadius: z.number().finite().positive().max(10),
    customizationFields: z.array(customizationFieldSchema),
    attachmentPoints: z.array(z.string().min(1).max(80)),
    capabilities: z
      .object({
        customizationKeys: z.array(z.string().min(1)),
        gaze: z.object({
          head: z.boolean(), eyes: z.boolean(), torso: z.boolean(),
          maxYaw: z.number().finite().positive().max(1.2),
          maxPitch: z.number().finite().positive().max(0.8),
          maxRoll: z.number().finite().positive().max(0.5),
          maxEyeOffset: z.number().finite().min(0).max(0.08),
        }).strict().optional(),
        animationCapabilities: z.array(
          z.enum([
            "mouth",
            "eyes",
            "head-gaze",
            "facial-expression",
            "body",
            "hands",
            "head-rotation",
            "arm-gesture",
          ]),
        ),
        facialRig: z.enum([
          "none",
          "morph-targets",
          "bones",
          "digital-face",
          "procedural",
        ]),
        bodyRig: z.enum(["none", "compatible", "custom"]),
      })
      .strict(),
  })
  .strict()
  .superRefine((model, context) => {
    if (model.source === "asset" && !model.glb)
      context.addIssue({
        code: "custom",
        message: "Asset-backed character models require a GLB reference.",
      });
    if (model.source === "development-placeholder" && model.glb)
      context.addIssue({
        code: "custom",
        message: "Development placeholders cannot reference production assets.",
      });
    if (model.source !== "asset" && model.assetId)
      context.addIssue({
        code: "custom",
        message:
          "Only asset-backed character models may reference an asset ID.",
      });
    const keys = model.customizationFields.map((field) => field.key);
    if (new Set(keys).size !== keys.length)
      context.addIssue({
        code: "custom",
        message: "Customization field keys must be unique.",
      });
    if (
      keys.length !== model.capabilities.customizationKeys.length ||
      keys.some((key) => !model.capabilities.customizationKeys.includes(key))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Customization capability keys must match the supported fields.",
      });
    }
    const gaze = model.capabilities.gaze;
    const unsupportedGazeChannel =
      gaze &&
      ((gaze.head &&
        (!model.attachmentPoints.includes("head-pivot") ||
          !model.capabilities.animationCapabilities.includes("head-rotation"))) ||
        (gaze.eyes &&
          (!model.attachmentPoints.includes("left-iris-gaze") ||
            !model.attachmentPoints.includes("right-iris-gaze") ||
            !model.capabilities.animationCapabilities.includes("eyes"))) ||
        (gaze.torso &&
          (!model.attachmentPoints.includes("torso-pivot") ||
            !model.capabilities.animationCapabilities.includes("body"))));
    if (unsupportedGazeChannel) {
      context.addIssue({ code: "custom", message: "Gaze capabilities must be backed by declared animation channels and named pivots." });
    }
    if (model.glb)
      for (const field of model.customizationFields) {
        if (field.kind === "color" && !model.glb.materialColors[field.key])
          context.addIssue({
            code: "custom",
            message: `GLB material binding is missing for ${field.key}.`,
          });
        if (
          field.kind === "select" &&
          field.options.some(
            (option) =>
              !(option.value in (model.glb?.meshVariants[field.key] ?? {})),
          )
        ) {
          context.addIssue({
            code: "custom",
            message: `GLB mesh variants are incomplete for ${field.key}.`,
          });
        }
      }
  });

export type CharacterModelDefinition = z.infer<
  typeof characterModelDefinitionSchema
>;
export type CharacterCustomization = Record<string, string>;

export function createImportedCharacterModel(input: {
  assetId: string;
  projectId: string;
  displayName: string;
  heightMeters: number;
  rotationRadians: number;
  seatingOffsetY: number;
  inspection: NonNullable<z.infer<typeof glbAssetSchema>["inspection"]>;
}) {
  const materialNames = input.inspection.colorableMaterialNames.slice(0, 12);
  const customizationFields = materialNames.map((name, index) => ({
    key: `material${index + 1}`,
    label: name || `Material ${index + 1}`,
    kind: "color" as const,
    defaultValue: "#ffffff",
  }));
  const materialColors = Object.fromEntries(
    materialNames.map((name, index) => [`material${index + 1}`, [name]]),
  );
  const measuredHeight = input.inspection.bounds.size[1];
  const modelId = `character-model:imported-${input.assetId}`;
  return characterModelDefinitionSchema.parse({
    id: modelId,
    displayName: input.displayName,
    description: "مدل سه‌بعدی واردشده به همین پروژه.",
    modelType: "imported",
    source: "asset",
    rendererKey: "glb-character",
    assetId: input.assetId,
    glb: {
      url: `/api/projects/${input.projectId}/character-assets/${input.assetId}`,
      heightRangeMeters: [measuredHeight * 0.99, measuredHeight * 1.01],
      materialColors,
      meshVariants: {},
      floorOffsetY: -input.inspection.bounds.min[1],
      orientationRadians: input.rotationRadians,
      inspection: input.inspection,
    },
    forwardAxis: "+Z",
    defaultTransform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [
        input.heightMeters / measuredHeight,
        input.heightMeters / measuredHeight,
        input.heightMeters / measuredHeight,
      ],
    },
    seatContactY: 0,
    seatPositionOffset: [0, input.seatingOffsetY, 0],
    seatYawOffsetRadians: 0,
    placementKinds: ["seat", "platform"],
    placementContactY: 0,
    placementPositionOffset: [0, input.seatingOffsetY, 0],
    placementYawOffsetRadians: 0,
    placementRadius: Math.max(
      0.25,
      Math.max(
        input.inspection.bounds.size[0],
        input.inspection.bounds.size[2],
      ) / 2,
    ),
    customizationFields,
    attachmentPoints: [],
    capabilities: {
      customizationKeys: customizationFields.map((field) => field.key),
      animationCapabilities: [],
      facialRig: "none",
      bodyRig: "none",
    },
  });
}

const fa = {
  kamyar: "\u06a9\u0627\u0645\u06cc\u0627\u0631",
  hamid: "\u062d\u0627\u0645\u06cc\u062f",
  chatgpt: "ChatGPT",
  claude: "Claude",
  hairColor: "\u0631\u0646\u06af \u0645\u0648",
  hairStyle: "\u0645\u062f\u0644 \u0645\u0648",
  skinTone: "\u0631\u0646\u06af \u067e\u0648\u0633\u062a",
  eyeColor: "\u0631\u0646\u06af \u0686\u0634\u0645",
  beardColor: "\u0631\u0646\u06af \u0631\u06cc\u0634",
  beardStyle: "\u0645\u062f\u0644 \u0631\u06cc\u0634",
  clothingColor: "\u0631\u0646\u06af \u0644\u0628\u0627\u0633",
  bodyColor: "\u0631\u0646\u06af \u0628\u062f\u0646\u0647",
  accentColor:
    "\u0631\u0646\u06af \u0646\u0648\u0627\u0631 \u0646\u0648\u0631\u06cc",
  faceStyle:
    "\u0686\u0647\u0631\u0647\u0654 \u0646\u0645\u0627\u06cc\u0634\u06af\u0631",
  accessory: "\u0647\u062f\u0633\u062a \u0631\u0628\u0627\u062a",
  neutral: "\u062e\u0646\u062b\u06cc",
  happy: "\u0634\u0627\u062f",
  sad: "\u063a\u0645\u06af\u06cc\u0646",
  angry: "\u0639\u0635\u0628\u0627\u0646\u06cc",
  surprised: "\u0645\u062a\u0639\u062c\u0628",
  worried: "\u0646\u06af\u0631\u0627\u0646",
  confused: "\u06af\u06cc\u062c",
  thinking: "\u0645\u062a\u0641\u06a9\u0631",
  listening:
    "\u062f\u0631 \u062d\u0627\u0644 \u06af\u0648\u0634\u200c\u062f\u0627\u062f\u0646",
  speaking: "\u062f\u0631 \u062d\u0627\u0644 \u0635\u062d\u0628\u062a",
  excited: "\u0647\u06cc\u062c\u0627\u0646\u200c\u0632\u062f\u0647",
  laughing: "\u062e\u0646\u062f\u0627\u0646",
  furColor: "\u0631\u0646\u06af \u0628\u062f\u0646\u0647",
  chestColor: "\u0631\u0646\u06af \u067e\u062f \u0647\u062f\u0633\u062a",
  earStyle: "\u0641\u0631\u0645 \u067e\u062f \u0647\u062f\u0633\u062a",
  short: "\u06a9\u0648\u062a\u0627\u0647",
  parted: "\u0645\u0631\u062a\u0628\u0627\u0632 \u06a9\u0646\u0627\u0631",
  textured: "\u062e\u0644\u0648\u062a\u06a9",
  stubble: "\u062a\u0647\u200c\u0631\u06cc\u0634",
  friendly: "\u062f\u0648\u0633\u062a\u0627\u0646\u0647",
  focused: "\u0645\u062a\u0645\u0631\u06a9\u0632",
  curious: "\u06a9\u0646\u062c\u06a9\u0627\u0648",
  none: "\u0628\u062f\u0648\u0646 \u0647\u062f\u0633\u062a",
  headset: "\u0647\u062f\u0633\u062a \u0633\u0627\u062f\u0647",
  pointed: "\u0645\u06a9\u0639\u0628\u06cc",
  rounded: "\u0644\u0628\u0647\u200c\u06af\u0631\u062f",
  glasses: "\u0639\u06a9\u0633\u06a9",
  noGlasses: "\u0628\u062f\u0648\u0646 \u0639\u06a9\u0633\u06a9",
  classicHair:
    "\u06a9\u0644\u0627\u0633\u06cc\u06a9 \u06a9\u0648\u062a\u0627\u0647",
  texturedHair:
    "\u062e\u0644\u0648\u062a\u06a9 \u0648 \u067e\u0631\u062d\u062c\u0645",
  wavyHair:
    "\u0645\u0648\u062c\u200c\u062f\u0627\u0631 \u0645\u0644\u0627\u06cc\u0645",
  curlyHair: "\u0641\u0631 \u06a9\u0648\u062a\u0627\u0647",
  longerStyled:
    "\u0645\u0648\u06cc \u06a9\u0645\u06cc \u0628\u0644\u0646\u062f \u0648 \u0645\u0631\u062a\u0628",
  buzzCut: "\u0646\u0645\u0632\u062f\u0647",
  bald: "\u0628\u062f\u0648\u0646 \u0645\u0648",
  cleanShaven: "\u0628\u062f\u0648\u0646 \u0631\u06cc\u0634",
  shortBeard: "\u0631\u06cc\u0634 \u06a9\u0648\u062a\u0627\u0647",
  fullBeard: "\u0631\u06cc\u0634 \u067e\u0631 \u0648 \u0645\u0631\u062a\u0628",
  moustacheLight:
    "\u0633\u06cc\u0628\u06cc\u0644 \u0645\u0644\u0627\u06cc\u0645",
  goatee: "\u0631\u06cc\u0634 \u067e\u0631\u0648\u0641\u0633\u0648\u0631\u06cc",
  lightStubble:
    "\u062a\u0647\u200c\u0631\u06cc\u0634 \u0645\u0644\u0627\u06cc\u0645",
  beardVisibility: "\u0646\u0645\u0627\u06cc\u0634 \u0631\u06cc\u0634",
  visible: "\u0646\u0645\u0627\u06cc\u0627\u0646",
  hidden: "\u067e\u0646\u0647\u0627\u0646",
  sidePart: "\u0641\u0631\u0642 \u0627\u0632 \u06a9\u0646\u0627\u0631",
  modernQuiff: "\u06a9\u0648\u06cc\u0641 \u0628\u0627\u0641\u062a\u200c\u062f\u0627\u0631",
  mediumWavy: "\u0645\u0648\u06cc \u0645\u0648\u062c\u200c\u062f\u0627\u0631 \u0645\u062a\u0648\u0633\u0637",
  slickedBack: "\u0645\u0648\u06cc \u0634\u0627\u0646\u0647\u200c\u0634\u062f\u0647 \u0628\u0647 \u0639\u0642\u0628",
  shortFade: "\u0641\u06cc\u062f \u06a9\u0648\u062a\u0627\u0647",
  crewCut: "\u06a9\u0631\u06cc\u0648\u06a9\u0627\u062a",
  mediumStubble: "\u062a\u0647\u200c\u0631\u06cc\u0634 \u0645\u062a\u0648\u0633\u0637",
  boxedBeard: "\u0631\u06cc\u0634 \u06a9\u0627\u062f\u0631\u06cc \u06a9\u0648\u062a\u0627\u0647",
  trimmedBeard: "\u0631\u06cc\u0634 \u067e\u0631 \u0645\u0631\u062a\u0628",
  mustache: "\u0633\u06cc\u0628\u06cc\u0644",
  mustacheStubble: "\u0633\u06cc\u0628\u06cc\u0644 \u0648 \u062a\u0647\u200c\u0631\u06cc\u0634",
};
const color = (key: string, label: string, defaultValue: string) => ({
  key,
  label,
  kind: "color" as const,
  defaultValue,
});
const select = (
  key: string,
  label: string,
  defaultValue: string,
  options: { value: string; label: string }[],
) => ({ key, label, kind: "select" as const, defaultValue, options });
const option = (value: string, label: string) => ({ value, label });

const modelDefinitions: readonly CharacterModelDefinition[] = [
  {
    id: "character-model:kamyar",
    displayName: fa.kamyar,
    description:
      "\u0627\u0646\u0633\u0627\u0646 \u0633\u0628\u06a9\u200c\u0633\u0628\u06a9 \u0628\u0627 \u0647\u0648\u062f\u06cc \u062a\u06cc\u0631\u0647\u060c \u0645\u0648\u06cc \u062a\u06cc\u0631\u0647 \u0648 \u0631\u06cc\u0634 \u06a9\u0648\u062a\u0627\u0647.",
    modelType: "human",
    source: "procedural",
    rendererKey: "kamyar-stylized",
    forwardAxis: "+Z",
    defaultTransform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.72, 0.72, 0.72],
    },
    seatContactY: -0.145,
    seatPositionOffset: [0, 0, 0],
    seatYawOffsetRadians: 0,
    placementKinds: ["seat", "platform"],
    placementContactY: 0.035,
    placementPositionOffset: [0, 0, 0],
    placementYawOffsetRadians: 0,
    placementRadius: 0.46,
    customizationFields: [
      color("hairColor", fa.hairColor, "#211d1d"),
      select("hairStyle", fa.hairStyle, "side-part", [
        option("modern-textured-quiff", fa.modernQuiff),
        option("side-part", fa.sidePart),
        option("curly-short", fa.curlyHair),
        option("medium-wavy", fa.mediumWavy),
        option("slicked-back", fa.slickedBack),
        option("short-fade", fa.shortFade),
        option("crew-cut", fa.crewCut),
        option("buzz-cut", fa.buzzCut),
        option("bald", fa.bald),
      ]),
      color("skinTone", fa.skinTone, "#c98f70"),
      color("eyeColor", fa.eyeColor, "#39281e"),
      color("beardColor", fa.beardColor, "#302521"),
      select("beardStyle", fa.beardStyle, "short-boxed-beard", [
        option("clean-shaven", fa.cleanShaven),
        option("light-stubble", fa.lightStubble),
        option("medium-stubble", fa.mediumStubble),
        option("short-boxed-beard", fa.boxedBeard),
        option("full-trimmed-beard", fa.trimmedBeard),
        option("goatee", fa.goatee),
        option("mustache", fa.mustache),
        option("mustache-light-stubble", fa.mustacheStubble),
      ]),
      select("beardVisibility", fa.beardVisibility, "visible", [
        option("visible", fa.visible),
        option("hidden", fa.hidden),
      ]),
      color("clothingColor", fa.clothingColor, "#171b21"),
      select("accessory", fa.glasses, "none", [
        option("none", fa.noGlasses),
        option("glasses", fa.glasses),
      ]),
    ],
    attachmentPoints: [
      "body-root",
      "head-pivot",
      "left-eyebrow",
      "right-eyebrow",
      "left-eye",
      "right-eye",
      "facial-hair-pivot",
      "mouth",
      "glasses-accessory",
      "left-arm-pivot",
      "right-arm-pivot",
      "left-elbow-pivot",
      "right-elbow-pivot",
      "left-wrist-pivot",
      "right-wrist-pivot",
      "left-hand-pivot",
      "right-hand-pivot",
    ],
    capabilities: {
      customizationKeys: [
        "hairColor",
        "hairStyle",
        "skinTone",
        "eyeColor",
        "beardColor",
        "beardStyle",
        "beardVisibility",
        "clothingColor",
        "accessory",
      ],
      animationCapabilities: ["head-rotation", "arm-gesture", "facial-expression"],
      gaze: { head: true, eyes: false, torso: false, maxYaw: 0.64, maxPitch: 0.32, maxRoll: 0.16, maxEyeOffset: 0 },
      facialRig: "none",
      bodyRig: "none",
    },
  },
  {
    id: "character-model:chatgpt-robot",
    displayName: fa.chatgpt,
    description:
      "\u0631\u0628\u0627\u062a \u06a9\u0648\u0686\u06a9 \u0633\u0641\u06cc\u062f \u0628\u0627 \u0635\u0641\u062d\u0647\u0654 \u0686\u0647\u0631\u0647\u0654 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u0648 \u0645\u0648\u062c\u06a9 \u06a9\u0648\u0686\u06a9.",
    modelType: "robot",
    source: "procedural",
    rendererKey: "chatgpt-robot",
    forwardAxis: "+Z",
    defaultTransform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.48, 0.48, 0.48],
    },
    seatContactY: -0.14,
    seatPositionOffset: [0, 0, 0],
    seatYawOffsetRadians: 0,
    placementKinds: ["seat", "tabletop", "platform"],
    placementContactY: 0.01,
    placementPositionOffset: [0, 0, 0],
    placementYawOffsetRadians: 0,
    placementRadius: 0.34,
    customizationFields: [
      color("bodyColor", fa.bodyColor, "#edf2f4"),
      color("accentColor", fa.accentColor, "#52d7ca"),
      color("eyeColor", fa.eyeColor, "#8cfff0"),
      select(
        "faceStyle",
        fa.faceStyle,
        "happy",
        chatGptExpressionNames.map((expression) =>
          option(expression, fa[expression]),
        ),
      ),
      select("accessory", fa.accessory, "none", [
        option("none", fa.none),
        option("headset", fa.headset),
      ]),
    ],
    attachmentPoints: [
      "body-root",
      "head-pivot",
      "face-display",
      "left-eye",
      "right-eye",
      "left-iris-gaze",
      "right-iris-gaze",
      "mouth-display",
      "left-arm-pivot",
      "right-arm-pivot",
      "left-elbow-pivot",
      "right-elbow-pivot",
      "left-wrist-pivot",
      "right-wrist-pivot",
      "left-hand-pivot",
      "right-hand-pivot",
    ],
    capabilities: {
      customizationKeys: [
        "bodyColor",
        "accentColor",
        "eyeColor",
        "faceStyle",
        "accessory",
      ],
      animationCapabilities: ["head-rotation", "arm-gesture", "facial-expression", "eyes"],
      gaze: { head: true, eyes: true, torso: false, maxYaw: 0.82, maxPitch: 0.48, maxRoll: 0.2, maxEyeOffset: 0.045 },
      facialRig: "none",
      bodyRig: "none",
    },
  },
  {
    id: "character-model:claude-mascot",
    displayName: fa.claude,
    description:
      "\u0645\u0627\u0633\u06a9\u0627\u062a \u0645\u06a9\u0639\u0628\u06cc \u0646\u0627\u0631\u0646\u062c\u06cc \u0628\u0627 \u0686\u0634\u0645\u200c\u0647\u0627\u06cc \u0645\u0633\u062a\u0637\u06cc\u0644\u06cc\u060c \u062f\u0647\u0627\u0646 \u06a9\u0648\u0686\u06a9 \u0648 \u0647\u062f\u0633\u062a \u0628\u0644\u0648\u06a9\u06cc.",
    modelType: "mascot",
    source: "procedural",
    rendererKey: "claude-terracotta-mascot",
    forwardAxis: "+Z",
    defaultTransform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.58, 0.58, 0.58],
    },
    seatContactY: 0,
    seatPositionOffset: [0, 0, 0],
    seatYawOffsetRadians: 0,
    placementKinds: ["seat", "tabletop", "platform"],
    placementContactY: 0,
    placementPositionOffset: [0, 0, 0],
    placementYawOffsetRadians: 0,
    placementRadius: 0.49,
    customizationFields: [
      color("furColor", fa.furColor, "#f47920"),
      color("chestColor", fa.chestColor, "#d9d2c8"),
      color("eyeColor", fa.eyeColor, "#21140f"),
      select("earStyle", fa.earStyle, "pointed", [
        option("pointed", fa.pointed),
        option("rounded", fa.rounded),
      ]),
    ],
    attachmentPoints: [
      "body-root",
      "head-pivot",
      "headphones",
      "left-eye",
      "right-eye",
      "mouth",
    ],
    capabilities: {
      customizationKeys: ["furColor", "chestColor", "eyeColor", "earStyle"],
      animationCapabilities: ["head-rotation", "facial-expression"],
      gaze: { head: true, eyes: false, torso: false, maxYaw: 0.5, maxPitch: 0.24, maxRoll: 0.1, maxEyeOffset: 0 },
      facialRig: "none",
      bodyRig: "none",
    },
  },
  {
    id: "character-model:hamid",
    displayName: fa.hamid,
    description: "\u0627\u0646\u0633\u0627\u0646 \u0633\u0628\u06a9\u200c\u0633\u0628\u06a9 \u0628\u0627 \u062a\u06cc\u200c\u0634\u0631\u062a \u0633\u06cc\u0627\u0647\u060c \u0645\u0648\u06cc \u06a9\u0648\u062a\u0627\u0647 \u0648 \u062a\u0647\u200c\u0631\u06cc\u0634.",
    modelType: "human",
    source: "procedural",
    rendererKey: "hamid-stylized",
    forwardAxis: "+Z",
    defaultTransform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0.72, 0.72, 0.72],
    },
    seatContactY: -0.145,
    seatPositionOffset: [0, 0, 0],
    seatYawOffsetRadians: 0,
    placementKinds: ["seat", "platform"],
    placementContactY: 0.035,
    placementPositionOffset: [0, 0, 0],
    placementYawOffsetRadians: 0,
    placementRadius: 0.49,
    customizationFields: [
      color("hairColor", fa.hairColor, "#211d1d"),
      select("hairStyle", fa.hairStyle, "short-fade", [
        option("modern-textured-quiff", fa.modernQuiff),
        option("side-part", fa.sidePart),
        option("curly-short", fa.curlyHair),
        option("medium-wavy", fa.mediumWavy),
        option("slicked-back", fa.slickedBack),
        option("short-fade", fa.shortFade),
        option("crew-cut", fa.crewCut),
        option("buzz-cut", fa.buzzCut),
        option("bald", fa.bald),
      ]),
      color("skinTone", fa.skinTone, "#c98f70"),
      color("eyeColor", fa.eyeColor, "#39281e"),
      color("beardColor", fa.beardColor, "#302521"),
      select("beardStyle", fa.beardStyle, "light-stubble", [
        option("clean-shaven", fa.cleanShaven),
        option("light-stubble", fa.lightStubble),
        option("medium-stubble", fa.mediumStubble),
        option("short-boxed-beard", fa.boxedBeard),
        option("full-trimmed-beard", fa.trimmedBeard),
        option("goatee", fa.goatee),
        option("mustache", fa.mustache),
        option("mustache-light-stubble", fa.mustacheStubble),
      ]),
      select("beardVisibility", fa.beardVisibility, "visible", [
        option("visible", fa.visible),
        option("hidden", fa.hidden),
      ]),
      color("clothingColor", fa.clothingColor, "#111315"),
      select("bellyFullness", "\u0641\u0631\u0645 \u0628\u062f\u0646", "fuller", [
        option("natural", "\u0637\u0628\u06cc\u0639\u06cc"),
        option("fuller", "\u067e\u0631\u062a\u0631"),
        option("full", "\u067e\u0631\u062a\u0631\u06cc\u0646"),
      ]),
    ],
    attachmentPoints: [
      "body-root",
      "head-pivot",
      "left-eyebrow",
      "right-eyebrow",
      "left-eye",
      "right-eye",
      "facial-hair-pivot",
      "mouth",
      "left-arm-pivot",
      "right-arm-pivot",
      "left-elbow-pivot",
      "right-elbow-pivot",
      "left-wrist-pivot",
      "right-wrist-pivot",
      "left-hand-pivot",
      "right-hand-pivot",
    ],
    capabilities: {
      customizationKeys: [
        "hairColor",
        "hairStyle",
        "skinTone",
        "eyeColor",
        "beardColor",
        "beardStyle",
        "beardVisibility",
        "clothingColor",
        "bellyFullness",
      ],
      animationCapabilities: ["head-rotation", "arm-gesture", "facial-expression"],
      gaze: { head: true, eyes: false, torso: false, maxYaw: 0.62, maxPitch: 0.31, maxRoll: 0.15, maxEyeOffset: 0 },
      facialRig: "none",
      bodyRig: "none",
    },
  },
];

export function createCharacterRegistry(
  definitions: readonly CharacterModelDefinition[],
  rendererKeys: ReadonlySet<string>,
) {
  const models = new Map<string, CharacterModelDefinition>();
  const builtIns = new Map<string, CharacterModelDefinition>();
  for (const candidate of definitions) {
    const model = characterModelDefinitionSchema.parse(candidate);
    if (models.has(model.id))
      throw new Error(`Duplicate character model ID: ${model.id}`);
    if (!rendererKeys.has(model.rendererKey))
      throw new Error(`Unsupported character renderer: ${model.rendererKey}`);
    models.set(model.id, structuredClone(model));
    builtIns.set(model.id, structuredClone(model));
  }
  return {
    get: (id: string) => models.get(id),
    list: () => [...models.values()].map((model) => structuredClone(model)),
    replaceProjectModels: (
      definitions: readonly CharacterModelDefinition[],
    ) => {
      models.clear();
      for (const [id, model] of builtIns)
        models.set(id, structuredClone(model));
      for (const candidate of definitions) {
        const model = characterModelDefinitionSchema.parse(candidate);
        if (model.source !== "asset" || !model.assetId || models.has(model.id))
          throw new Error("Invalid project character model.");
        if (
          model.rendererKey !== "glb-character" ||
          !rendererKeys.has(model.rendererKey)
        )
          throw new Error(
            `Unsupported character renderer: ${model.rendererKey}`,
          );
        models.set(model.id, structuredClone(model));
      }
    },
  };
}

export const characterModelRegistry = createCharacterRegistry(
  modelDefinitions,
  new Set([
    ...modelDefinitions.map((model) => model.rendererKey),
    "glb-character",
  ]),
);

export function normalizeCharacterCustomization(
  modelId: string,
  value: CharacterCustomization,
): CharacterCustomization {
  const model = characterModelRegistry.get(modelId);
  if (!model) return structuredClone(value);
  const fieldByKey = new Map(
    model.customizationFields.map((field) => [field.key, field]),
  );
  for (const key of Object.keys(value))
    if (!fieldByKey.has(key))
      throw new Error(`Unsupported customization field: ${key}`);
  const normalized: CharacterCustomization = {};
  for (const field of model.customizationFields) {
    const storedCandidate = value[field.key] ?? field.defaultValue;
    const legacyKamyarStyles: Record<string, string> =
      field.key === "hairStyle"
        ? {
            short: "crew-cut",
            parted: "side-part",
            "short-classic": "crew-cut",
            "textured-quiff": "modern-textured-quiff",
            textured: "modern-textured-quiff",
            "slight-wavy": "medium-wavy",
            "longer-styled": "slicked-back",
          }
        : field.key === "beardStyle"
          ? {
              short: "short-boxed-beard",
              stubble: "light-stubble",
              trimmed: "short-boxed-beard",
              "short-beard": "short-boxed-beard",
              "trimmed-full-beard": "full-trimmed-beard",
              "full-short": "full-trimmed-beard",
              "moustache-light": "mustache",
              "mustache-only": "mustache",
            }
          : {};
    const migratedCandidate =
      model.id === "character-model:kamyar"
        ? (legacyKamyarStyles[storedCandidate] ?? storedCandidate)
        : storedCandidate;
    let candidate =
      model.id === "character-model:chatgpt-robot" && field.key === "faceStyle"
        ? resolveChatGptExpression(migratedCandidate)
        : migratedCandidate;
    if (typeof candidate !== "string")
      throw new Error(`Invalid customization value: ${field.key}`);
    if (field.kind === "color" && !/^#[0-9a-fA-F]{6}$/.test(candidate))
      throw new Error(`Invalid color customization: ${field.key}`);
    if (field.kind === "select" && !field.options.some((option) => option.value === candidate)) {
      if (model.id === "character-model:kamyar" && (field.key === "hairStyle" || field.key === "beardStyle"))
        candidate = field.defaultValue;
      else throw new Error(`Unsupported customization value: ${field.key}`);
    }
    normalized[field.key] = candidate;
  }
  return normalized;
}
