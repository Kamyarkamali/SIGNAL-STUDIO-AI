import { z } from "zod";
import {
  characterModelRegistry,
  normalizeCharacterCustomization,
} from "./character-registry.ts";

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

export const characterIdentitySchema = z
  .object({
    id: z.uuid(),
    name: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .transform((name) => name.normalize("NFC")),
    modelId: z.string().min(1).max(120),
    customization: z.record(
      z.string().min(1).max(80),
      z.union([z.string().max(120), z.number().finite(), z.boolean()]),
    ),
  })
  .strict();

export const characterInstanceSchema = z
  .object({ id: z.uuid(), characterId: z.uuid() })
  .strict();

export const characterTransformSchema = z
  .object({ position: vector, rotation: vector, scale: positiveVector })
  .strict();

export const characterStateSchema = z
  .object({
    transform: characterTransformSchema,
    initialTransform: characterTransformSchema,
    visible: z.boolean(),
    placementAnchorId: z.string().min(1).max(120).optional(),
  })
  .strict();

export const characterProjectDataSchema = z
  .object({
    characterIdentities: z.record(z.uuid(), characterIdentitySchema),
    characterInstances: z.record(z.uuid(), characterInstanceSchema),
    characterStates: z.record(z.uuid(), characterStateSchema),
  })
  .strict()
  .superRefine((data, context) => {
    for (const [id, identity] of Object.entries(data.characterIdentities)) {
      if (id !== identity.id)
        context.addIssue({
          code: "custom",
          message: "Character identity key does not match its ID.",
        });
      if (characterModelRegistry.get(identity.modelId)) {
        try {
          normalizeCharacterCustomization(
            identity.modelId,
            identity.customization as Record<string, string>,
          );
        } catch (error) {
          context.addIssue({
            code: "custom",
            message:
              error instanceof Error
                ? error.message
                : "Invalid character appearance.",
            path: ["characterIdentities", id, "customization"],
          });
        }
      }
    }
    for (const [id, instance] of Object.entries(data.characterInstances)) {
      if (id !== instance.id)
        context.addIssue({
          code: "custom",
          message: "Character instance key does not match its ID.",
        });
      if (!data.characterIdentities[instance.characterId])
        context.addIssue({
          code: "custom",
          message: "Character instance references a missing identity.",
        });
      if (!data.characterStates[id])
        context.addIssue({
          code: "custom",
          message: "Character instance has no placement state.",
        });
    }
    for (const id of Object.keys(data.characterStates)) {
      if (!data.characterInstances[id])
        context.addIssue({
          code: "custom",
          message: "Character placement has no instance.",
        });
    }
  });

export type CharacterIdentity = z.infer<typeof characterIdentitySchema>;
export type CharacterInstance = z.infer<typeof characterInstanceSchema>;
export type CharacterState = z.infer<typeof characterStateSchema>;
export type CharacterProjectData = z.infer<typeof characterProjectDataSchema>;
