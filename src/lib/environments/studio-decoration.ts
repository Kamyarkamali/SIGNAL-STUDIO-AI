import { z } from "zod";

const vec3 = z.tuple([z.number().finite().min(-100).max(100), z.number().finite().min(-100).max(100), z.number().finite().min(-100).max(100)]);
const positiveVec3 = z.tuple([z.number().finite().min(0.05).max(20), z.number().finite().min(0.05).max(20), z.number().finite().min(0.05).max(20)]);
export const decorationTransformSchema = z.object({ position: vec3, rotation: vec3, scale: positiveVec3 }).strict();

export const signCustomizationSchema = z.object({
  design: z.enum(["default", "text", "image"]), text: z.string().max(80), textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), glowColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), illumination: z.number().finite().min(0).max(3),
  imageAssetId: z.uuid().optional(), fit: z.enum(["contain", "cover"]), transform: decorationTransformSchema, visible: z.boolean(),
}).strict().superRefine((sign, context) => {
  if (sign.design === "image" && !sign.imageAssetId) context.addIssue({ code: "custom", message: "Image design requires an image asset." });
});

export const frameCustomizationSchema = z.object({
  imageAssetId: z.uuid().optional(), fit: z.enum(["contain", "cover"]), transform: decorationTransformSchema, visible: z.boolean(),
}).strict();

export const studioDecorationSchema = z.object({
  sign: signCustomizationSchema.optional(),
  frames: z.tuple([frameCustomizationSchema, frameCustomizationSchema]).optional(),
}).strict();

export type SignCustomization = z.infer<typeof signCustomizationSchema>;
export type FrameCustomization = z.infer<typeof frameCustomizationSchema>;
export type StudioDecoration = z.infer<typeof studioDecorationSchema>;

export const defaultSignCustomization: SignCustomization = {
  design: "default", text: "Signal Studio", textColor: "#f0fffc", backgroundColor: "#71c9c3", glowColor: "#479e9b",
  illumination: 0.8, fit: "contain", transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, visible: true,
};

export const defaultFrameCustomization = (): FrameCustomization => ({
  fit: "contain", transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, visible: true,
});
