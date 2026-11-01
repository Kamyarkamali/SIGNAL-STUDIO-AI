import { z } from "zod";
import { STUDIO_01, STUDIO_01_ID } from "./studio-01.ts";
import type { EnvironmentPropInstance, TransformConfig, Vec3 } from "./environment-registry.ts";

const vector = z.tuple([z.number().finite().min(-100).max(100), z.number().finite().min(-100).max(100), z.number().finite().min(-100).max(100)]);
const scaleVector = z.tuple([z.number().finite().min(0.05).max(20), z.number().finite().min(0.05).max(20), z.number().finite().min(0.05).max(20)]);
export const propInstanceSchema = z.object({
  id: z.string().min(1).max(100), definitionId: z.string().min(1).max(100),
  transform: z.object({ position: vector, rotation: vector, scale: scaleVector }).strict(),
  visible: z.boolean(),
}).strict();
export const arrangementSchema = z.object({
  environmentId: z.literal(STUDIO_01_ID),
  props: z.array(propInstanceSchema).max(200),
}).strict().superRefine((arrangement, context) => {
  const definitions = new Map(STUDIO_01.propDefinitions.map((item) => [item.id, item]));
  const ids = new Set<string>();
  for (const prop of arrangement.props) {
    if (ids.has(prop.id)) context.addIssue({ code: "custom", message: "شناسهٔ وسیله تکراری است." });
    ids.add(prop.id);
    const definition = definitions.get(prop.definitionId);
    if (!definition) context.addIssue({ code: "custom", message: "نوع وسیله پشتیبانی نمی‌شود." });
    if (definition?.editable === false) {
      const initial = STUDIO_01.defaultProps.find((item) => item.id === prop.id);
      if (!initial || JSON.stringify(prop) !== JSON.stringify(initial)) context.addIssue({ code: "custom", message: "ساختار اتاق قابل تغییر نیست." });
    }
  }
  for (const initial of STUDIO_01.defaultProps.filter((item) => STUDIO_01.propDefinitions.find((definition) => definition.id === item.definitionId)?.editable === false)) {
    if (!ids.has(initial.id)) context.addIssue({ code: "custom", message: "ساختار اتاق باید حفظ شود." });
  }
});

export type EnvironmentArrangement = z.infer<typeof arrangementSchema>;
const seatNames: Record<string, string> = {
  "studio-01:host-chair": "صندلی میزبان", "studio-01:cohost-chair": "صندلی هم‌میزبان", "studio-01:guest-chair": "صندلی مهمان",
  "studio-01:microphone-left": "میکروفون میزبان", "studio-01:microphone-right": "میکروفون هم‌میزبان", "studio-01:microphone-guest": "میکروفون مهمان",
};
export function propDisplayLabel(arrangement: EnvironmentArrangement, instance: EnvironmentPropInstance): string {
  if (seatNames[instance.id]) return seatNames[instance.id];
  const name = STUDIO_01.propDefinitions.find((item) => item.id === instance.definitionId)?.displayName ?? "وسیله";
  const siblings = arrangement.props.filter((item) => item.definitionId === instance.definitionId);
  return siblings.length > 1 ? `${name} · ${siblings.findIndex((item) => item.id === instance.id) + 1}` : name;
}
export function defaultArrangement(): EnvironmentArrangement {
  return { environmentId: STUDIO_01_ID, props: STUDIO_01.defaultProps.map((item) => ({ ...item, transform: {
    position: [...item.transform.position], rotation: [...item.transform.rotation], scale: [...item.transform.scale],
  } })) };
}

export function updateProp(arrangement: EnvironmentArrangement, id: string, change: Partial<Pick<EnvironmentPropInstance, "visible" | "transform">>): EnvironmentArrangement {
  const prop = arrangement.props.find((item) => item.id === id);
  if (!prop) throw new Error("وسیله پیدا نشد.");
  if (STUDIO_01.propDefinitions.find((item) => item.id === prop.definitionId)?.editable === false) throw new Error("این بخش از اتاق قابل ویرایش نیست.");
  const next = { ...arrangement, props: arrangement.props.map((item) => item.id === id ? { ...item, ...change } : item) };
  return arrangementSchema.parse(next);
}

export function removeProp(arrangement: EnvironmentArrangement, id: string): EnvironmentArrangement {
  const prop = arrangement.props.find((item) => item.id === id);
  if (!prop) throw new Error("وسیله پیدا نشد.");
  if (STUDIO_01.propDefinitions.find((item) => item.id === prop.definitionId)?.editable === false) throw new Error("این بخش از اتاق قابل حذف نیست.");
  return arrangementSchema.parse({ ...arrangement, props: arrangement.props.filter((item) => item.id !== id) });
}

function offset(transform: TransformConfig): TransformConfig {
  return { position: [transform.position[0] + 0.45, transform.position[1], transform.position[2] + 0.45] as Vec3,
    rotation: [...transform.rotation], scale: [...transform.scale] };
}

export function initialTransformFor(instance: EnvironmentPropInstance): TransformConfig {
  const exact = STUDIO_01.defaultProps.find((item) => item.id === instance.id);
  if (exact) return structuredClone(exact.transform);
  const sample = STUDIO_01.defaultProps.find((item) => item.definitionId === instance.definitionId);
  if (!sample) throw new Error("نوع وسیله پشتیبانی نمی‌شود.");
  return offset(sample.transform);
}

export function addProp(arrangement: EnvironmentArrangement, definitionId: string, id: string): EnvironmentArrangement {
  const sample = STUDIO_01.defaultProps.find((item) => item.definitionId === definitionId);
  if (!sample || STUDIO_01.propDefinitions.find((item) => item.id === definitionId)?.editable === false) throw new Error("این وسیله در کتابخانه نیست.");
  return arrangementSchema.parse({ ...arrangement, props: [...arrangement.props,
    { id, definitionId, transform: offset(sample.transform), visible: true }] });
}

export function duplicateProp(arrangement: EnvironmentArrangement, sourceId: string, id: string): EnvironmentArrangement {
  const source = arrangement.props.find((item) => item.id === sourceId);
  if (!source || STUDIO_01.propDefinitions.find((item) => item.id === source.definitionId)?.editable === false) throw new Error("این وسیله قابل تکثیر نیست.");
  return arrangementSchema.parse({ ...arrangement, props: [...arrangement.props,
    { ...source, id, transform: offset(source.transform) }] });
}

export function restoreDefault(arrangement: EnvironmentArrangement, id: string): EnvironmentArrangement {
  const initial = STUDIO_01.defaultProps.find((item) => item.id === id);
  if (!initial || STUDIO_01.propDefinitions.find((item) => item.id === initial.definitionId)?.editable === false) throw new Error("وسیلهٔ پیش‌فرض پیدا نشد.");
  if (arrangement.props.some((item) => item.id === id)) return arrangement;
  return arrangementSchema.parse({ ...arrangement, props: [...arrangement.props, initial] });
}
