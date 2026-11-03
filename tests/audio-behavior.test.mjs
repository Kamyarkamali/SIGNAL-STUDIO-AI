import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { resolveAudioBehaviorAtFrame } from "../src/lib/scenes/audio-behavior.ts";
import { evaluateSceneCharacterActions } from "../src/lib/scenes/scene-action-evaluation.ts";
import { createScene, setSceneBehaviorMode } from "../src/lib/scenes/scene-operations.ts";
import { sceneDefinitionSchema } from "../src/lib/scenes/scene-schema.ts";
import { projectSchema, newProject } from "../src/lib/projects/project-schema.ts";
import { isPreviewActionSupported } from "../src/lib/characters/animation-preview.ts";

const transform = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
function fixture() {
  const ids = { kamyar: randomUUID(), hamid: randomUUID(), kamyarInstance: randomUUID(), hamidInstance: randomUUID(),
    scene: randomUUID(), clip: randomUUID(), region1: randomUUID(), region2: randomUUID(), speaker1: randomUUID(), speaker2: randomUUID(), asset: randomUUID() };
  const base = createScene({ sceneOrder: [], scenes: {} }, ids.scene).scenes[ids.scene];
  const scene = sceneDefinitionSchema.parse({ ...base, durationFrames: 300, characters: {
    [ids.kamyarInstance]: { visible: true, transform }, [ids.hamidInstance]: { visible: true, transform },
  } });
  const characters = {
    characterIdentities: { [ids.kamyar]: { id: ids.kamyar, name: "کامیار", modelId: "character-model:kamyar", customization: {} },
      [ids.hamid]: { id: ids.hamid, name: "حمید", modelId: "character-model:hamid", customization: {} } },
    characterInstances: { [ids.kamyarInstance]: { id: ids.kamyarInstance, characterId: ids.kamyar },
      [ids.hamidInstance]: { id: ids.hamidInstance, characterId: ids.hamid } },
    characterStates: { [ids.kamyarInstance]: { visible: true, transform, initialTransform: transform },
      [ids.hamidInstance]: { visible: true, transform, initialTransform: transform } },
  };
  const audio = {
    speakers: { [ids.speaker1]: { id: ids.speaker1, kind: "character", characterId: ids.kamyar, name: "کامیار" },
      [ids.speaker2]: { id: ids.speaker2, kind: "character", characterId: ids.hamid, name: "حمید" } },
    audioClips: { [ids.clip]: { id: ids.clip, assetId: ids.asset, startFrame: 30, sourceStartSeconds: 1, sourceEndSeconds: 5, gain: 1, muted: false } },
    speakerRegions: { [ids.region1]: { id: ids.region1, audioClipId: ids.clip, startSeconds: 1, endSeconds: 3, speakerId: ids.speaker1, status: "assigned" },
      [ids.region2]: { id: ids.region2, audioClipId: ids.clip, startSeconds: 3, endSeconds: 5, speakerId: ids.speaker2, status: "assigned" } },
  };
  const at = (frame, sceneValue = scene, audioValue = audio, sceneStartFrame = 0) => resolveAudioBehaviorAtFrame({ audio: audioValue, scene: sceneValue, sceneStartFrame, projectFrame: frame, fps: 30, characters });
  return { ids, scene, characters, audio, at };
}

test("assigned source ranges switch visible speaking and listening roles at exact project frames", () => {
  const { ids, at } = fixture();
  assert.equal(at(29), null);
  const first = at(60);
  assert.equal(first.speakerInstanceId, ids.kamyarInstance);
  assert.deepEqual(first.listenerInstanceIds, [ids.hamidInstance]);
  assert.ok(first.actions.some((event) => event.characterInstanceId === ids.kamyarInstance && event.action === "speaking"));
  assert.ok(first.actions.some((event) => event.characterInstanceId === ids.hamidInstance && event.action === "gaze-character" && event.targetId === ids.kamyarInstance));
  assert.deepEqual(at(60), first);
  const second = at(90);
  assert.equal(second.speakerInstanceId, ids.hamidInstance);
  assert.ok(second.actions.some((event) => event.characterInstanceId === ids.kamyarInstance && event.action === "listening"));
  assert.equal(at(150), null);
});

test("mutes, unknown/audio-only speakers and hidden or missing scene members animate nobody", () => {
  const { ids, scene, audio, characters, at } = fixture();
  assert.equal(at(60, scene, { ...audio, audioClips: { [ids.clip]: { ...audio.audioClips[ids.clip], muted: true } } }), null);
  assert.equal(at(60, scene, { ...audio, speakerRegions: { ...audio.speakerRegions, [ids.region1]: { ...audio.speakerRegions[ids.region1], status: "unknown", speakerId: null } } }), null);
  assert.equal(at(60, sceneDefinitionSchema.parse({ ...scene, characters: { ...scene.characters, [ids.kamyarInstance]: { ...scene.characters[ids.kamyarInstance], visible: false } } })), null);
  const audioOnly = randomUUID();
  assert.equal(at(60, scene, { ...audio, speakers: { ...audio.speakers, [audioOnly]: { id: audioOnly, kind: "audio-only", name: "راوی" } }, speakerRegions: { ...audio.speakerRegions, [ids.region1]: { ...audio.speakerRegions[ids.region1], speakerId: audioOnly } } }), null);
  assert.equal(characters.characterInstances[ids.kamyarInstance].characterId, ids.kamyar);
});

test("trim, moved clip and scene offset change speaker mapping without a second clock", () => {
  const { ids, scene, audio, at } = fixture();
  const moved = { ...audio, audioClips: { [ids.clip]: { ...audio.audioClips[ids.clip], startFrame: 120, sourceStartSeconds: 2, sourceEndSeconds: 5 } } };
  assert.equal(at(60, scene, moved), null);
  assert.equal(at(120, scene, moved).speakerInstanceId, ids.kamyarInstance);
  assert.equal(at(150, scene, moved).speakerInstanceId, ids.hamidInstance);
  assert.equal(at(150, scene, moved, 150).actions[0].startFrame, 0);
});

test("hybrid manual events override only their own channels while automatic speaking remains", () => {
  const { ids, scene, at } = fixture();
  const auto = at(60);
  const manual = { id: randomUUID(), sceneId: scene.id, characterInstanceId: ids.kamyarInstance, action: "explain", startFrame: 30,
    durationFrames: 90, enabled: true, priority: -100, intensity: 1, speed: 1 };
  const gaze = { ...manual, id: randomUUID(), characterInstanceId: ids.hamidInstance, action: "gaze-camera", targetKind: "camera" };
  const hybrid = sceneDefinitionSchema.parse({ ...scene, behaviorMode: "hybrid", actionEvents: [manual, gaze] });
  const output = evaluateSceneCharacterActions({ ...hybrid, actionEvents: [...hybrid.actionEvents, ...auto.actions] }, 60, 30,
    { [ids.kamyarInstance]: ["head-rotation", "arm-gesture", "facial-expression"], [ids.hamidInstance]: ["head-rotation", "facial-expression"] }, new Set([ids.kamyarInstance, ids.hamidInstance]));
  assert.equal(output[ids.kamyarInstance].expression, "speaking");
  assert.ok(output[ids.kamyarInstance].pose.rightArmRotation.some((value) => value !== 0));
  assert.equal(output[ids.hamidInstance].gaze.attentionTargetKind, "camera");
  assert.deepEqual(output, evaluateSceneCharacterActions({ ...hybrid, actionEvents: [...hybrid.actionEvents, ...auto.actions] }, 60, 30,
    { [ids.kamyarInstance]: ["head-rotation", "arm-gesture", "facial-expression"], [ids.hamidInstance]: ["head-rotation", "facial-expression"] }, new Set([ids.kamyarInstance, ids.hamidInstance])));
  assert.equal(isPreviewActionSupported("speaking", ["head-rotation"]), false);
});

test("behavior modes and authored events survive project JSON save/reload without changing clip frames", () => {
  const { ids, scene, characters, audio, at } = fixture();
  assert.equal(at(60, setSceneBehaviorMode(scene, "manual")).speakerInstanceId, ids.kamyarInstance);
  const event = { id: randomUUID(), sceneId: scene.id, characterInstanceId: ids.kamyarInstance, action: "speaking", startFrame: 45,
    durationFrames: 50, enabled: true, priority: 0, intensity: 1, speed: 1 };
  const project = newProject(randomUUID(), "Behavior test");
  const parsed = projectSchema.parse({ ...project, ...characters, ...audio, sceneOrder: [scene.id],
    scenes: { [scene.id]: sceneDefinitionSchema.parse({ ...scene, behaviorMode: "hybrid", actionEvents: [event] }) },
    assetManifest: { [ids.asset]: { id: ids.asset, kind: "audio", displayName: "voice.wav", mediaType: "audio/wav", fileSizeBytes: 100, origin: "imported", sha256: "a".repeat(64), relativePath: "assets/audio/voice.wav", audioDurationSeconds: 5 } } });
  const restored = projectSchema.parse(JSON.parse(JSON.stringify(parsed)));
  assert.equal(restored.scenes[scene.id].behaviorMode, "hybrid");
  assert.equal(restored.scenes[scene.id].actionEvents[0].id, event.id);
  assert.equal(restored.audioClips[ids.clip].startFrame, 30);
});
