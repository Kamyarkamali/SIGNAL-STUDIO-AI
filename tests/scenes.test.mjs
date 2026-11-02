import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createScene, deleteScene, duplicateScene, renameScene, reorderScene, setSceneDuration, convertSceneFrameRate, updateSceneContent } from "../src/lib/scenes/scene-operations.ts";
import { computeSceneOffsets, formatTimecode, resolveSceneTime, sceneLocalToGlobalFrame, secondsToFrames, totalDurationFrames } from "../src/lib/scenes/scene-time.ts";
import { pausePlayback, playbackFrameAt, seekPlayback, startPlayback, stopPlayback } from "../src/lib/scenes/playback.ts";
import { migrateProject, newProject, projectSchema, version5ProjectSchema } from "../src/lib/projects/project-schema.ts";
import { ProjectService } from "../src/lib/projects/project-service.ts";
import { defaultArrangement } from "../src/lib/environments/arrangement.ts";
import { STUDIO_01 } from "../src/lib/environments/studio-01.ts";
import { resolveSceneArrangement } from "../src/lib/scenes/scene-configuration.ts";

function sequence() {
  const sceneId = randomUUID();
  const created = createScene({ sceneOrder: [], scenes: {} }, sceneId, STUDIO_01.id);
  return { sceneId, sequence: created };
}

test("scene create, rename, duplicate, delete and reorder preserve stable unique IDs", () => {
  const { sceneId, sequence: first } = sequence();
  const renamed = renameScene(first, sceneId, "مقدمه");
  assert.equal(renamed.scenes[sceneId].name, "مقدمه");
  const duplicateId = randomUUID();
  const duplicate = duplicateScene(renamed, sceneId, duplicateId);
  assert.deepEqual(duplicate.sceneOrder, [sceneId, duplicateId]);
  assert.notEqual(duplicate.scenes[sceneId].id, duplicate.scenes[duplicateId].id);
  assert.deepEqual(duplicate.scenes[duplicateId].productionCamera.position, renamed.scenes[sceneId].productionCamera.position);
  assert.notEqual(duplicate.scenes[duplicateId].productionCamera.position, renamed.scenes[sceneId].productionCamera.position);
  assert.equal(duplicate.scenes[duplicateId].environmentId, STUDIO_01.id);
  assert.deepEqual(reorderScene(duplicate, duplicateId, 0).sceneOrder, [duplicateId, sceneId]);
  const deleted = deleteScene(duplicate, sceneId);
  assert.deepEqual(deleted.sceneOrder, [duplicateId]);
  assert.equal(deleted.scenes[sceneId], undefined);
});

test("scene title, description, director notes and type persist and duplicate with the scene", () => {
  const { sceneId, sequence: first } = sequence();
  const authored = updateSceneContent(first, sceneId, { description: "A short introduction", directionNotes: "Hold for the title", sceneType: "establishing" });
  assert.equal(authored.scenes[sceneId].description, "A short introduction");
  assert.equal(authored.scenes[sceneId].directionNotes, "Hold for the title");
  assert.equal(authored.scenes[sceneId].sceneType, "establishing");
  const renamed = renameScene(authored, sceneId, "Opening");
  const copied = duplicateScene(renamed, sceneId, randomUUID());
  const duplicate = copied.scenes[copied.sceneOrder[1]];
  assert.equal(duplicate.name, "Opening - نسخه");
  assert.equal(duplicate.description, "A short introduction");
  assert.equal(duplicate.directionNotes, "Hold for the title");
  assert.equal(duplicate.sceneType, "establishing");
  assert.equal(projectSchema.parse({ ...newProject(randomUUID(), "metadata"), sceneOrder: copied.sceneOrder, scenes: copied.scenes }).scenes[sceneId].description, "A short introduction");
});

test("scene duration validation and frame-rate conversion preserve seconds", () => {
  const { sceneId, sequence: first } = sequence();
  assert.throws(() => setSceneDuration(first, sceneId, 0));
  assert.throws(() => setSceneDuration(first, sceneId, -5));
  assert.throws(() => setSceneDuration(first, sceneId, 1.5));
  const halfSecond = setSceneDuration(first, sceneId, 15);
  const converted = convertSceneFrameRate(halfSecond, 30, 24);
  assert.equal(converted.scenes[sceneId].durationFrames, 12);
  assert.equal(secondsToFrames(0.5, 24), 12);
});

test("offsets recalculate from ordered integer frames and boundary resolution is deterministic", () => {
  const { sceneId: firstId, sequence: first } = sequence();
  const secondId = randomUUID();
  const two = createScene(first, secondId);
  const second = setSceneDuration(two, secondId, 90);
  const thirdId = randomUUID();
  const three = createScene(second, thirdId);
  assert.deepEqual(computeSceneOffsets(three.sceneOrder, three.scenes).map(({ startFrame, endFrame }) => [startFrame, endFrame]), [[0, 300], [300, 390], [390, 690]]);
  assert.equal(resolveSceneTime(299, three.sceneOrder, three.scenes).sceneId, firstId);
  assert.equal(resolveSceneTime(0, three.sceneOrder, three.scenes).sceneId, firstId);
  assert.equal(resolveSceneTime(300 - 1, three.sceneOrder, three.scenes).localFrame, 299);
  assert.deepEqual(resolveSceneTime(300, three.sceneOrder, three.scenes), { sceneId: secondId, sceneIndex: 1, startFrame: 300, endFrame: 390, localFrame: 0 });
  assert.equal(resolveSceneTime(389, three.sceneOrder, three.scenes).localFrame, 89);
  assert.equal(resolveSceneTime(390, three.sceneOrder, three.scenes).sceneId, thirdId);
  assert.equal(resolveSceneTime(690, three.sceneOrder, three.scenes).sceneId, thirdId);
  assert.equal(resolveSceneTime(690, three.sceneOrder, three.scenes).localFrame, 300);
  assert.equal(resolveSceneTime(900, three.sceneOrder, three.scenes).localFrame, 300);
  assert.equal(resolveSceneTime(-12, three.sceneOrder, three.scenes).sceneId, firstId);
  assert.equal(sceneLocalToGlobalFrame(secondId, 45, three.sceneOrder, three.scenes), 345);
  assert.equal(totalDurationFrames(three.sceneOrder, three.scenes), 690);
  const moved = reorderScene(three, thirdId, 0);
  assert.deepEqual(computeSceneOffsets(moved.sceneOrder, moved.scenes).map(({ startFrame, endFrame }) => [startFrame, endFrame]), [[0, 300], [300, 600], [600, 690]]);
  const resized = setSceneDuration(moved, secondId, 120);
  assert.deepEqual(computeSceneOffsets(resized.sceneOrder, resized.scenes).map(({ startFrame, endFrame }) => [startFrame, endFrame]), [[0, 300], [300, 600], [600, 720]]);
  assert.equal(resolveSceneTime(719, resized.sceneOrder, resized.scenes).localFrame, 119);
  assert.equal(resolveSceneTime(720, resized.sceneOrder, resized.scenes).localFrame, 120);
});

test("project schema v7 stores scene-local configuration and camera metadata; v5 migrates safely", () => {
  const { sceneId, sequence: scenes } = sequence();
  const project = newProject(randomUUID(), "scene migration");
  const withScene = projectSchema.parse({ ...project, sceneOrder: scenes.sceneOrder, scenes: scenes.scenes, fps: 24 });
  assert.equal(withScene.scenes[sceneId].productionCamera.framing, "landscape-16:9");
  assert.equal(withScene.fps, 24);
  const legacyScene = { ...withScene.scenes[sceneId] };
  delete legacyScene.description;
  delete legacyScene.sceneType;
  const legacyV6 = projectSchema.parse({ ...withScene, scenes: { [sceneId]: legacyScene } });
  assert.equal(legacyV6.scenes[sceneId].description, "");
  assert.equal(legacyV6.scenes[sceneId].sceneType, undefined);
  assert.equal(projectSchema.safeParse({ ...withScene, sceneOrder: [sceneId, sceneId] }).success, false);
  assert.equal(projectSchema.safeParse({ ...withScene, scenes: { ...scenes.scenes, [sceneId]: { ...scenes.scenes[sceneId], durationFrames: -1 } } }).success, false);
  assert.equal(projectSchema.safeParse({ ...withScene, scenes: { ...scenes.scenes, [randomUUID()]: scenes.scenes[sceneId] } }).success, false);
  const oldV5 = version5ProjectSchema.parse({ ...project, schemaVersion: 5 });
  const migrated = migrateProject(oldV5);
  assert.equal(migrated.schemaVersion, 9);
  assert.equal(migrated.fps, 30);
  assert.deepEqual(migrated.sceneOrder, []);
  assert.deepEqual(migrated.scenes, {});
});

test("scene data persists across reopen and project duplication is independent", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-scenes-test-"));
  try {
    const store = new ProjectService(root);
    const project = await store.create("scenes");
    const { sequence: baseScenes } = sequence();
    const cameraSceneId = baseScenes.sceneOrder[0];
    const scheduledEvent = { id: randomUUID(), sceneId: cameraSceneId, characterInstanceId: randomUUID(), action: "head-nod", startFrame: 60, durationFrames: 45, enabled: true, priority: 2, intensity: 0.9, speed: 1.1 };
    const scenes = { ...baseScenes, scenes: { ...baseScenes.scenes, [cameraSceneId]: {
      ...baseScenes.scenes[cameraSceneId], description: "Explains the topic", sceneType: "educational", directionNotes: "Pause after the question",
      actionEvents: [scheduledEvent],
      propOverrides: { "studio-01:laptop": { visible: false, transform: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] } } },
      productionCamera: { ...baseScenes.scenes[cameraSceneId].productionCamera,
        position: [1, 2, 3], rotation: [0.1, 0.2, 0.3], target: [0, 1, 0], fov: 36, zoom: 1.25,
        shotType: "medium", framing: "portrait-9:16", targetRef: { kind: "laptop", id: randomUUID() } },
    } } };
    const saved = await store.save(project.id, project.title, project.revision, undefined, undefined, undefined, undefined, undefined,
      30, scenes.sceneOrder, scenes.scenes);
    const reopened = await new ProjectService(root).open(project.id);
    assert.deepEqual(reopened.sceneOrder, scenes.sceneOrder);
    assert.deepEqual(reopened.scenes, scenes.scenes);
    assert.deepEqual(reopened.scenes[cameraSceneId].actionEvents, [scheduledEvent]);
    const reloadedArrangement = resolveSceneArrangement(defaultArrangement(), reopened.scenes[cameraSceneId]);
    assert.equal(reloadedArrangement.arrangement.props.find((prop) => prop.id === "studio-01:laptop").visible, false);
    assert.deepEqual(reloadedArrangement.arrangement.props.find((prop) => prop.id === "studio-01:laptop").transform.position, [1, 2, 3]);
    assert.equal(reopened.scenes[cameraSceneId].description, "Explains the topic");
    assert.equal(reopened.scenes[cameraSceneId].sceneType, "educational");
    assert.equal(reopened.scenes[cameraSceneId].directionNotes, "Pause after the question");
    assert.deepEqual(reopened.scenes[cameraSceneId].productionCamera.position, [1, 2, 3]);
    assert.deepEqual(reopened.scenes[cameraSceneId].productionCamera.rotation, [0.1, 0.2, 0.3]);
    assert.equal(reopened.scenes[cameraSceneId].productionCamera.framing, "portrait-9:16");
    const duplicate = await store.duplicate(project.id);
    assert.deepEqual(duplicate.scenes[cameraSceneId].actionEvents, [scheduledEvent]);
    const changedScene = renameScene({ sceneOrder: duplicate.sceneOrder, scenes: duplicate.scenes }, duplicate.sceneOrder[0], "copy edit");
    const duplicateSaved = await store.save(duplicate.id, duplicate.title, duplicate.revision, undefined, undefined, undefined, undefined, undefined,
      duplicate.fps, changedScene.sceneOrder, changedScene.scenes);
    assert.equal(duplicateSaved.scenes[duplicate.sceneOrder[0]].name, "copy edit");
    assert.notEqual((await store.open(project.id)).scenes[cameraSceneId].name, "copy edit");
    assert.equal(saved.revision, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("play, pause, stop, seek and monotonic playback are deterministic and clamp safely", () => {
  const stopped = { frame: 0, status: "stopped" };
  const playing = startPlayback(stopped, 300);
  assert.deepEqual(playing, { frame: 0, status: "playing" });
  assert.equal(playbackFrameAt(10, 1000, 30, 300), 40);
  assert.deepEqual(pausePlayback({ frame: 40, status: "playing" }), { frame: 40, status: "paused" });
  assert.deepEqual(seekPlayback(playing, 301, 300), { frame: 300, status: "paused" });
  assert.deepEqual(startPlayback({ frame: 300, status: "ended" }, 300), { frame: 0, status: "playing" });
  assert.deepEqual(stopPlayback(), stopped);
  assert.equal(formatTimecode(1800, 30), "00:01:00:00");
});

test("storyboard and viewport scene selection share the resolved timeline scene", async () => {
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const timeline = await readFile(new URL("../src/components/scenes/scene-authoring.tsx", import.meta.url), "utf8");
  const unifiedTimeline = await readFile(new URL("../src/components/scenes/unified-timeline-tracks.tsx", import.meta.url), "utf8");
  assert.match(shell, /data-scene-id=\{activeSceneId/);
  assert.match(shell, /activeSceneId=\{activeSceneId\}/);
  assert.match(shell, /onSelect=\{selectScene\}/);
  assert.match(timeline, /aria-pressed=\{selectedCard\}/);
  assert.match(unifiedTimeline, /onSeek\(Number\(event\.target\.value\)\)/);
  const authoring = await readFile(new URL("../src/components/scenes/scene-authoring.tsx", import.meta.url), "utf8");
  assert.match(authoring, /draggable/);
  assert.match(authoring, /onDrop=/);
  assert.match(authoring, /aria-label="ویژگی‌های صحنهٔ انتخاب‌شده"/);
  assert.match(unifiedTimeline, /خط‌کش LTR تایم‌لاین/);
  assert.match(unifiedTimeline, /onPointerDown=/);
  assert.match(authoring, /onContentChange\(selected\.id/);
});

