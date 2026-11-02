import { arrangementSchema, propInstanceSchema, type EnvironmentArrangement } from "../environments/arrangement.ts";
import { environmentRegistry } from "../environments/registry.ts";
import { characterProjectDataSchema, type CharacterProjectData, type CharacterState } from "../characters/character-schema.ts";
import { sceneCharacterSchema, sceneDefinitionSchema, scenePropOverrideSchema, type SceneCharacterConfig, type SceneDefinition, type ScenePropOverride } from "./scene-schema.ts";

export function characterConfigFromState(state: CharacterState): SceneCharacterConfig {
  return sceneCharacterSchema.parse({
    visible: state.visible,
    transform: structuredClone(state.transform),
    ...(state.placementAnchorId ? { placementAnchorId: state.placementAnchorId } : {}),
  });
}

export function seedSceneCharacters(scene: SceneDefinition, data: CharacterProjectData): SceneDefinition {
  const characters = Object.fromEntries(Object.values(data.characterInstances).flatMap((instance) => {
    const state = data.characterStates[instance.id];
    return state ? [[instance.id, characterConfigFromState(state)]] : [];
  }));
  return sceneDefinitionSchema.parse({ ...scene, characters });
}

export function setSceneCharacter(scene: SceneDefinition, id: string, config: SceneCharacterConfig | null): SceneDefinition {
  const characters = { ...scene.characters };
  if (config) characters[id] = structuredClone(config);
  else delete characters[id];
  return sceneDefinitionSchema.parse({ ...scene, characters });
}

export function updateSceneCharacter(scene: SceneDefinition, id: string, change: Partial<SceneCharacterConfig>): SceneDefinition {
  const current = scene.characters[id];
  if (!current) return scene;
  return setSceneCharacter(scene, id, { ...current, ...change, transform: change.transform ? structuredClone(change.transform) : structuredClone(current.transform) });
}

export function updateSceneProp(scene: SceneDefinition, id: string, change: { visible?: boolean; transform?: EnvironmentArrangement["props"][number]["transform"] }): SceneDefinition {
  if (isFixedEnvironmentProp(scene.environmentId, id)) throw new Error("ساختار اتاق در این سکانس قابل تغییر نیست.");
  const current = scene.propOverrides[id] ?? {};
  return sceneDefinitionSchema.parse({ ...scene, propOverrides: { ...scene.propOverrides, [id]: scenePropOverrideSchema.parse({ ...current, ...change }) } });
}

export function updateSceneArrangement(scene: SceneDefinition, base: EnvironmentArrangement, edit: (current: EnvironmentArrangement) => EnvironmentArrangement): SceneDefinition {
  const current = resolveSceneArrangement(base, scene).arrangement ?? base;
  const next = edit(structuredClone(current));
  const fixedProps = base.props.filter((prop) => isFixedEnvironmentProp(base.environmentId, prop.id));
  if (next.environmentId !== base.environmentId || fixedProps.some((fixed) => {
    const proposed = next.props.find((prop) => prop.id === fixed.id);
    return !proposed || JSON.stringify(proposed) !== JSON.stringify(fixed);
  })) throw new Error("ساختار اتاق در این سکانس قابل تغییر نیست.");
  const propOverrides: SceneDefinition["propOverrides"] = {};
  for (const baseProp of base.props) {
    const prop = next.props.find((item) => item.id === baseProp.id);
    if (!prop) { propOverrides[baseProp.id] = { removed: true }; continue; }
    const change: NonNullable<SceneDefinition["propOverrides"][string]> = {};
    if (prop.visible !== baseProp.visible) change.visible = prop.visible;
    if (JSON.stringify(prop.transform) !== JSON.stringify(baseProp.transform)) change.transform = structuredClone(prop.transform);
    if (JSON.stringify(prop.decoration) !== JSON.stringify(baseProp.decoration)) change.decoration = prop.decoration ?? null;
    if (Object.keys(change).length) propOverrides[baseProp.id] = change;
  }
  for (const prop of next.props) if (!base.props.some((item) => item.id === prop.id)) propOverrides[prop.id] = { added: structuredClone(prop) };
  const lightingOverride = JSON.stringify(next.lighting) === JSON.stringify(base.lighting) ? undefined : structuredClone(next.lighting);
  return sceneDefinitionSchema.parse({ ...scene, propOverrides, lightingOverride });
}

export function setSceneEnvironment(scene: SceneDefinition, environmentId: string): SceneDefinition {
  if (!environmentRegistry.get(environmentId)) throw new Error("محیط انتخاب‌شده در کتابخانهٔ فعلی موجود نیست.");
  return sceneDefinitionSchema.parse({ ...scene, environmentId });
}

export function setScenePropOverride(scene: SceneDefinition, id: string, override: ScenePropOverride): SceneDefinition {
  const environmentId = scene.environmentId ?? "environment:studio-01";
  if (isFixedEnvironmentProp(environmentId, id) || override.added && isFixedEnvironmentProp(environmentId, override.added.definitionId)) {
    throw new Error("ساختار اتاق در این سکانس قابل تغییر نیست.");
  }
  if (override.added && override.added.id !== id) throw new Error("شناسهٔ وسیلهٔ افزوده‌شده با شناسهٔ تغییر سکانس یکسان نیست.");
  const propOverrides = { ...scene.propOverrides };
  if (!Object.keys(override).length) delete propOverrides[id];
  else propOverrides[id] = scenePropOverrideSchema.parse(override);
  return sceneDefinitionSchema.parse({ ...scene, propOverrides });
}

export function setSceneLighting(scene: SceneDefinition, lighting: EnvironmentArrangement["lighting"] | undefined): SceneDefinition {
  const next = { ...scene };
  if (lighting) next.lightingOverride = structuredClone(lighting);
  else delete (next as Partial<SceneDefinition>).lightingOverride;
  return sceneDefinitionSchema.parse(next);
}

export function resolveSceneArrangement(base: EnvironmentArrangement | null, scene?: SceneDefinition): { arrangement: EnvironmentArrangement | null; warning?: string } {
  if (!base) return { arrangement: null };
  if (!scene) return { arrangement: base };
  const parsedBase = arrangementSchema.safeParse(base);
  if (!parsedBase.success) return { arrangement: null, warning: "دادهٔ اصلی محیط نامعتبر است؛ برای جلوگیری از خطا، نمای استودیو بارگذاری نشد." };
  const validBase = parsedBase.data;
  const environmentId = scene.environmentId ?? base.environmentId;
  if (!environmentRegistry.get(environmentId) || environmentId !== validBase.environmentId) return { arrangement: validBase, warning: "این محیط هنوز در نمای سه‌بعدی پشتیبانی نمی‌شود؛ محیط پروژه نمایش داده شد." };
  const overrides = scene.propOverrides;
  const warnings = new Set<string>();
  const props = validBase.props.flatMap((prop) => {
    const override = overrides[prop.id];
    if (!override) return [prop];
    if (isFixedEnvironmentProp(environmentId, prop.id)) {
      warnings.add("تغییر ثبت‌شده برای ساختار ثابت اتاق نادیده گرفته شد؛ اجزای سازه‌ای استودیو حفظ شدند.");
      return [prop];
    }
    if (override.removed) return [];
    const merged = mergeScenePropOverride(prop, override, environmentId, warnings);
    return merged ? [merged] : [prop];
  });
  for (const [id, override] of Object.entries(overrides)) {
    if (!override.added) {
      if (!validBase.props.some((prop) => prop.id === id)) warnings.add("تغییر وسیله‌ای که دیگر در محیط وجود ندارد نادیده گرفته شد.");
      continue;
    }
    if (override.added.id !== id || validBase.props.some((prop) => prop.id === id) || isFixedEnvironmentProp(environmentId, override.added.definitionId)) {
      warnings.add("وسیلهٔ افزوده‌شدهٔ نامعتبر یا سازه‌ای نادیده گرفته شد؛ محیط اصلی حفظ شد.");
      continue;
    }
    const merged = mergeScenePropOverride(override.added, override, environmentId, warnings);
    if (merged) props.push(merged);
  }
  const resolved = arrangementSchema.safeParse({ ...validBase, environmentId, props, lighting: scene.lightingOverride ?? validBase.lighting });
  if (!resolved.success) return { arrangement: validBase, warning: [...warnings, "ترکیب تغییرهای سکانس نامعتبر بود؛ محیط پایه برای جلوگیری از توقف برنامه نمایش داده شد."].join(" ") };
  return { arrangement: resolved.data, ...(warnings.size ? { warning: [...warnings].join(" ") } : {}) };
}

function isFixedEnvironmentProp(environmentId: string | undefined, id: string): boolean {
  const environment = environmentRegistry.get(environmentId ?? "environment:studio-01");
  return environment?.propDefinitions.find((definition) => definition.id === id)?.editable === false
    || environment?.defaultProps.some((prop) => prop.id === id && environment.propDefinitions.find((definition) => definition.id === prop.definitionId)?.editable === false) === true;
}

function mergeScenePropOverride(prop: EnvironmentArrangement["props"][number], override: ScenePropOverride, environmentId: string, warnings: Set<string>) {
  const next = { ...structuredClone(prop) };
  const definition = environmentRegistry.get(environmentId)?.propDefinitions.find((item) => item.id === prop.definitionId);
  if (!definition) {
    warnings.add("تغییر نوع وسیلهٔ پشتیبانی‌نشده نادیده گرفته شد.");
    return null;
  }
  if (override.visible !== undefined) next.visible = override.visible;
  if (override.transform !== undefined) {
    const validTransform = propInstanceSchema.safeParse({ ...next, transform: override.transform });
    if (validTransform.success) next.transform = structuredClone(override.transform);
    else warnings.add("موقعیت نامعتبر یک وسیله نادیده گرفته شد؛ مقدار معتبر قبلی حفظ شد.");
  }
  if (override.decoration !== undefined) {
    const decoration = override.decoration;
    const compatible = decoration === null
      || (!decoration.sign || definition.id === "prop:practical-lights")
        && (!decoration.frames || definition.id === "prop:wall-art");
    const candidate = decoration === null ? { ...next, decoration: undefined } : { ...next, decoration };
    if (compatible && propInstanceSchema.safeParse(candidate).success) {
      if (decoration === null) delete next.decoration;
      else next.decoration = structuredClone(decoration);
    } else warnings.add("تزئین ناسازگار یک وسیله نادیده گرفته شد؛ چیدمان معتبر حفظ شد.");
  }
  const parsed = propInstanceSchema.safeParse(next);
  if (!parsed.success) {
    warnings.add("تغییر نامعتبر یک وسیله نادیده گرفته شد؛ چیدمان پایه حفظ شد.");
    return null;
  }
  return parsed.data;
}

export function resolveSceneCharacterData(data: CharacterProjectData, scene?: SceneDefinition): CharacterProjectData {
  if (!scene) return data;
  const characterInstances = Object.fromEntries(Object.keys(scene.characters).flatMap((id) => {
    const instance = data.characterInstances[id];
    return instance ? [[id, instance]] : [];
  }));
  const characterStates = Object.fromEntries(Object.entries(scene.characters).flatMap(([id, config]) => {
    const base = data.characterStates[id];
    if (!base || !characterInstances[id]) return [];
    const state = { ...base, visible: config.visible, transform: structuredClone(config.transform),
      ...(config.placementAnchorId ? { placementAnchorId: config.placementAnchorId } : {}) };
    if (!config.placementAnchorId) delete (state as Partial<CharacterState>).placementAnchorId;
    return [[id, state]];
  }));
  return characterProjectDataSchema.parse({ ...data, characterInstances, characterStates });
}

export function sceneCharacterState(data: CharacterProjectData, scene: SceneDefinition, id: string): CharacterState | undefined {
  const config = scene.characters[id];
  const base = data.characterStates[id];
  if (!config || !base) return undefined;
  const result = { ...base, visible: config.visible, transform: structuredClone(config.transform),
    ...(config.placementAnchorId ? { placementAnchorId: config.placementAnchorId } : {}) };
  if (!config.placementAnchorId) delete (result as Partial<CharacterState>).placementAnchorId;
  return result;
}

export function resolveSceneCameraTarget(scene: SceneDefinition, data: CharacterProjectData, arrangement: EnvironmentArrangement): { target: [number, number, number]; missing: boolean } {
  const reference = scene.productionCamera.targetRef;
  if (!reference) return { target: [...scene.productionCamera.target], missing: false };
  if (reference.kind === "character-instance") {
    const config = scene.characters[reference.id];
    if (config && data.characterInstances[reference.id]) return { target: [config.transform.position[0], config.transform.position[1] + 1.2 * config.transform.scale[1], config.transform.position[2]], missing: false };
    return { target: [...scene.productionCamera.target], missing: true };
  }
  if (reference.kind === "prop-instance" || reference.kind === "laptop" || reference.kind === "whiteboard") {
    const prop = arrangement.props.find((item) => item.id === reference.id && item.visible);
    if (prop) return { target: [...prop.transform.position], missing: false };
  }
  return { target: [...scene.productionCamera.target], missing: true };
}

