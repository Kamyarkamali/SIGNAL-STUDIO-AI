import { z } from "zod";

const vector = z.tuple([z.number().finite().min(-100).max(100), z.number().finite().min(-100).max(100), z.number().finite().min(-100).max(100)]);
const positiveVector = z.tuple([z.number().finite().min(0.05).max(20), z.number().finite().min(0.05).max(20), z.number().finite().min(0.05).max(20)]);
const transformSchema = z.object({ position: vector, rotation: vector, scale: positiveVector }).strict();

export const characterModelDefinitionSchema = z.object({
  id: z.string().regex(/^character-model:[a-z0-9-]+$/),
  displayName: z.string().min(1).max(120),
  modelType: z.enum(["human", "robot", "mascot", "imported"]),
  source: z.enum(["asset", "procedural", "development-placeholder"]),
  rendererKey: z.string().min(1).max(100),
  assetId: z.uuid().optional(),
  forwardAxis: z.enum(["+Z", "-Z", "+X", "-X"]),
  defaultTransform: transformSchema,
  capabilities: z.object({
    customizationKeys: z.array(z.string().min(1)),
    animationCapabilities: z.array(z.enum(["mouth", "eyes", "head-gaze", "facial-expression", "body", "hands"])),
    facialRig: z.enum(["none", "morph-targets", "bones", "digital-face", "procedural"]),
    bodyRig: z.enum(["none", "compatible", "custom"]),
  }).strict(),
  preferredAnchorRoles: z.array(z.enum(["host", "co-host", "guest"])),
}).strict().superRefine((model, context) => {
  if (model.source === "asset" && !model.assetId) context.addIssue({ code: "custom", message: "Asset-backed character models require an asset ID." });
  if (model.source !== "asset" && model.assetId) context.addIssue({ code: "custom", message: "Only asset-backed character models may reference an asset." });
});

export type CharacterModelDefinition = z.infer<typeof characterModelDefinitionSchema>;

const modelDefinitions: readonly CharacterModelDefinition[] = [
  {
    id: "character-model:development-human",
    displayName: "پیکرهٔ عمومی آزمایشی (موقت — مدل نهایی نیست)",
    modelType: "human",
    source: "development-placeholder",
    rendererKey: "development-humanoid",
    forwardAxis: "+Z",
    defaultTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [0.72, 0.72, 0.72] },
    capabilities: { customizationKeys: [], animationCapabilities: [], facialRig: "none", bodyRig: "none" },
    preferredAnchorRoles: ["host", "co-host", "guest"],
  },
];

export function createCharacterRegistry(definitions: readonly CharacterModelDefinition[], rendererKeys: ReadonlySet<string>) {
  const models = new Map<string, CharacterModelDefinition>();
  for (const candidate of definitions) {
    const model = characterModelDefinitionSchema.parse(candidate);
    if (models.has(model.id)) throw new Error(`Duplicate character model ID: ${model.id}`);
    if (!rendererKeys.has(model.rendererKey)) throw new Error(`Unsupported character renderer: ${model.rendererKey}`);
    models.set(model.id, structuredClone(model));
  }
  return {
    get: (id: string) => models.get(id),
    list: () => [...models.values()].map((model) => structuredClone(model)),
  };
}

export const characterModelRegistry = createCharacterRegistry(modelDefinitions, new Set(["development-humanoid"]));
