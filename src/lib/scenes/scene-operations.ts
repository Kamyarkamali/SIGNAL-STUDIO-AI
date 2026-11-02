import { defaultSceneCamera, sceneDefinitionSchema, type SceneActionEvent, type SceneCameraConfig, type SceneDefinition } from "./scene-schema.ts";
import { secondsToFrames } from "./scene-time.ts";

export type SceneSequence = { sceneOrder: string[]; scenes: Record<string, SceneDefinition> };
export type SceneIdFactory = () => string;
const createId = () => globalThis.crypto.randomUUID();

function checked(sequence: SceneSequence): SceneSequence {
  for (const id of sequence.sceneOrder) {
    const scene = sequence.scenes[id];
    if (!scene || scene.id !== id) throw new Error("Scene order and scene records are inconsistent.");
    sceneDefinitionSchema.parse(scene);
  }
  return sequence;
}

export function createScene(sequence: SceneSequence, id = createId(), environmentId?: string): SceneSequence {
  if (sequence.scenes[id]) throw new Error("Scene ID already exists.");
  const name = `صحنه ${sequence.sceneOrder.length + 1}`;
  const scene = sceneDefinitionSchema.parse({ id, name, durationFrames: 300, environmentId,
    productionCamera: defaultSceneCamera(), tracks: [], directionNotes: "" });
  return checked({ sceneOrder: [...sequence.sceneOrder, id], scenes: { ...sequence.scenes, [id]: scene } });
}

export function renameScene(sequence: SceneSequence, id: string, name: string): SceneSequence {
  const current = sequence.scenes[id];
  if (!current) return sequence;
  const scene = sceneDefinitionSchema.parse({ ...current, name });
  return { ...sequence, scenes: { ...sequence.scenes, [id]: scene } };
}

export function updateSceneContent(sequence: SceneSequence, id: string, content: {
  description?: string; directionNotes?: string; sceneType?: SceneDefinition["sceneType"];
}): SceneSequence {
  const current = sequence.scenes[id];
  if (!current) return sequence;
  const scene = sceneDefinitionSchema.parse({ ...current, ...content });
  return { ...sequence, scenes: { ...sequence.scenes, [id]: scene } };
}

export function duplicateScene(sequence: SceneSequence, id: string, newId = createId()): SceneSequence {
  const original = sequence.scenes[id];
  if (!original) return sequence;
  if (sequence.scenes[newId]) throw new Error("Scene ID already exists.");
  const tracks = original.tracks.map((track) => ({ ...track, id: createId() }));
  const actionEvents = original.actionEvents.map((event) => ({ ...event, id: createId(), sceneId: newId }));
  const duplicate = sceneDefinitionSchema.parse({ ...original, id: newId, name: `${original.name} - نسخه`,
    productionCamera: { ...original.productionCamera, position: [...original.productionCamera.position], target: [...original.productionCamera.target],
      ...(original.productionCamera.targetRef ? { targetRef: { ...original.productionCamera.targetRef } } : {}) }, tracks, actionEvents });
  const index = sequence.sceneOrder.indexOf(id);
  const sceneOrder = [...sequence.sceneOrder];
  sceneOrder.splice(index + 1, 0, newId);
  return checked({ sceneOrder, scenes: { ...sequence.scenes, [newId]: duplicate } });
}

export function deleteScene(sequence: SceneSequence, id: string): SceneSequence {
  if (!sequence.scenes[id]) return sequence;
  const scenes = { ...sequence.scenes };
  delete scenes[id];
  return checked({ sceneOrder: sequence.sceneOrder.filter((sceneId) => sceneId !== id), scenes });
}

export function reorderScene(sequence: SceneSequence, id: string, destinationIndex: number): SceneSequence {
  const sourceIndex = sequence.sceneOrder.indexOf(id);
  if (sourceIndex < 0 || !Number.isInteger(destinationIndex)) return sequence;
  const sceneOrder = [...sequence.sceneOrder];
  sceneOrder.splice(sourceIndex, 1);
  sceneOrder.splice(Math.max(0, Math.min(sceneOrder.length, destinationIndex)), 0, id);
  return { ...sequence, sceneOrder };
}

export function setSceneDuration(sequence: SceneSequence, id: string, durationFrames: number): SceneSequence {
  const current = sequence.scenes[id];
  if (!current) return sequence;
  const safeDuration = durationFrames;
  const actionEvents = current.actionEvents.flatMap((event) => event.startFrame >= safeDuration ? [] : [{ ...event, durationFrames: Math.min(event.durationFrames, safeDuration - event.startFrame) }]);
  const scene = sceneDefinitionSchema.parse({ ...current, durationFrames: safeDuration, actionEvents });
  return { ...sequence, scenes: { ...sequence.scenes, [id]: scene } };
}

export function addSceneActionEvent(scene: SceneDefinition, event: SceneActionEvent): SceneDefinition {
  return sceneDefinitionSchema.parse({ ...scene, actionEvents: [...scene.actionEvents, event] });
}

export function updateSceneActionEvent(scene: SceneDefinition, eventId: string, patch: Partial<Omit<SceneActionEvent, "id">>): SceneDefinition {
  return sceneDefinitionSchema.parse({ ...scene, actionEvents: scene.actionEvents.map((event) => event.id === eventId ? { ...event, ...patch } : event) });
}

/** Reorders the serialized event list only; event IDs, timing and evaluation priority are unchanged. */
export function reorderSceneActionEvent(scene: SceneDefinition, eventId: string, destinationIndex: number): SceneDefinition {
  const sourceIndex = scene.actionEvents.findIndex((event) => event.id === eventId);
  if (sourceIndex < 0 || !Number.isInteger(destinationIndex)) return scene;
  const actionEvents = [...scene.actionEvents];
  const [event] = actionEvents.splice(sourceIndex, 1);
  actionEvents.splice(Math.max(0, Math.min(actionEvents.length, destinationIndex)), 0, event);
  return sceneDefinitionSchema.parse({ ...scene, actionEvents });
}

/** Moves an event on the integer-frame ruler while preserving its duration and other event fields. */
export function moveSceneActionEvent(scene: SceneDefinition, eventId: string, requestedStartFrame: number): SceneDefinition {
  const event = scene.actionEvents.find((item) => item.id === eventId);
  if (!event || !Number.isFinite(requestedStartFrame)) return scene;
  const startFrame = Math.max(0, Math.min(scene.durationFrames - event.durationFrames, Math.round(requestedStartFrame)));
  return updateSceneActionEvent(scene, eventId, { startFrame });
}

export function removeSceneActionEvent(scene: SceneDefinition, eventId: string): SceneDefinition {
  return sceneDefinitionSchema.parse({ ...scene, actionEvents: scene.actionEvents.filter((event) => event.id !== eventId) });
}

export function setSceneCamera(sequence: SceneSequence, id: string, productionCamera: SceneCameraConfig): SceneSequence {
  const current = sequence.scenes[id];
  if (!current) return sequence;
  const scene = sceneDefinitionSchema.parse({ ...current, productionCamera });
  return { ...sequence, scenes: { ...sequence.scenes, [id]: scene } };
}

export function convertSceneFrameRate(sequence: SceneSequence, previousFps: number, nextFps: number): SceneSequence {
  if (previousFps === nextFps) return sequence;
  const scenes = Object.fromEntries(Object.entries(sequence.scenes).map(([id, scene]) => {
    const durationFrames = Math.max(1, secondsToFrames(scene.durationFrames / previousFps, nextFps));
    const actionEvents = scene.actionEvents.map((event) => ({ ...event,
      startFrame: secondsToFrames(event.startFrame / previousFps, nextFps),
      durationFrames: Math.max(1, secondsToFrames(event.durationFrames / previousFps, nextFps)),
    })).flatMap((event) => event.startFrame >= durationFrames ? [] : [{ ...event, durationFrames: Math.min(event.durationFrames, durationFrames - event.startFrame) }]);
    return [id, sceneDefinitionSchema.parse({ ...scene, durationFrames, actionEvents })];
  }));
  return checked({ sceneOrder: [...sequence.sceneOrder], scenes });
}

