import type { AudioProjectCollections } from "../audio/audio-schema.ts";
import type { CharacterProjectData } from "../characters/character-schema.ts";
import type { SceneActionEvent, SceneDefinition } from "./scene-schema.ts";

export type ActiveDialogueState = {
  clipId: string;
  regionId: string;
  speakerIdentityId: string;
  speakerInstanceId: string;
  listenerInstanceIds: string[];
  targetInstanceId: string | null;
  /** Transient defaults for the existing scene action evaluator; never persisted. */
  actions: SceneActionEvent[];
};

/** Maps source-local speaker ranges onto the one global project-frame clock. */
export function resolveAudioBehaviorAtFrame(input: {
  audio: AudioProjectCollections;
  scene: SceneDefinition;
  sceneStartFrame: number;
  projectFrame: number;
  fps: number;
  characters: CharacterProjectData;
}): ActiveDialogueState | null {
  const { audio, scene, sceneStartFrame, projectFrame, fps, characters } = input;
  if (!Number.isSafeInteger(projectFrame) || !Number.isFinite(fps) || fps <= 0) return null;
  const sceneEnd = sceneStartFrame + scene.durationFrames;
  if (projectFrame < sceneStartFrame || projectFrame >= sceneEnd) return null;
  const visible = Object.keys(scene.characters).filter((id) => {
    const instance = characters.characterInstances[id];
    return Boolean(instance && characters.characterIdentities[instance.characterId] && scene.characters[id]?.visible && characters.characterStates[id]?.visible);
  }).sort();
  const candidates = Object.values(audio.speakerRegions).flatMap((region) => {
    const clip = audio.audioClips[region.audioClipId];
    const speaker = region.speakerId && audio.speakers[region.speakerId];
    if (!clip || clip.muted || region.status !== "assigned" || !speaker || speaker.kind !== "character") return [];
    const start = clip.startFrame + Math.round((region.startSeconds - clip.sourceStartSeconds) * fps);
    const end = clip.startFrame + Math.round((region.endSeconds - clip.sourceStartSeconds) * fps);
    if (projectFrame < start || projectFrame >= end) return [];
    const speakerInstanceId = visible.find((id) => characters.characterInstances[id]?.characterId === speaker.characterId);
    return speakerInstanceId ? [{ clip, region, start, end, speakerInstanceId, speakerIdentityId: speaker.characterId }] : [];
  }).sort((a, b) => b.clip.startFrame - a.clip.startFrame || b.start - a.start || a.clip.id.localeCompare(b.clip.id) || a.region.id.localeCompare(b.region.id));
  const active = candidates[0];
  if (!active) return null;
  const startFrame = Math.max(0, active.start - sceneStartFrame);
  const durationFrames = Math.min(scene.durationFrames, active.end - sceneStartFrame) - startFrame;
  if (durationFrames < 1) return null;
  const listenerInstanceIds = visible.filter((id) => id !== active.speakerInstanceId);
  const targetInstanceId = listenerInstanceIds[0] ?? null;
  const event = (characterInstanceId: string, action: SceneActionEvent["action"], targetId?: string): SceneActionEvent => ({
    id: `audio:${active.region.id}:${characterInstanceId}:${action}`,
    sceneId: scene.id,
    characterInstanceId,
    action,
    startFrame,
    durationFrames,
    enabled: true,
    priority: -101,
    intensity: 0.65,
    speed: 1,
    ...(action === "gaze-character" && targetId ? { targetKind: "character" as const, targetId } : {}),
  });
  const actions = [event(active.speakerInstanceId, "speaking")];
  if (targetInstanceId) actions.push(event(active.speakerInstanceId, "gaze-character", targetInstanceId));
  for (const listenerId of listenerInstanceIds) {
    actions.push(event(listenerId, "listening"));
    actions.push(event(listenerId, "gaze-character", active.speakerInstanceId));
  }
  return { clipId: active.clip.id, regionId: active.region.id, speakerIdentityId: active.speakerIdentityId,
    speakerInstanceId: active.speakerInstanceId, listenerInstanceIds, targetInstanceId, actions };
}
