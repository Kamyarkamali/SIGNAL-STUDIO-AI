import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Group, Object3D } from "three";
import { createScene, duplicateScene, moveSceneActionEvent, reorderSceneActionEvent, setSceneDuration, updateSceneActionEvent } from "../src/lib/scenes/scene-operations.ts";
import { sceneDefinitionSchema } from "../src/lib/scenes/scene-schema.ts";
import { evaluateSceneCharacterActions } from "../src/lib/scenes/scene-action-evaluation.ts";
import { commitEventTimingDraft, formatDurationFrames, formatSceneEventTime, formatStartSeconds, parseSceneEventTimeDraft } from "../src/lib/scenes/event-timing-input.ts";
import { applyCharacterActionPose } from "../src/lib/characters/character-pose-adapter.ts";
import { defaultGazeCapability, neutralGazePose } from "../src/lib/characters/gaze-preview.ts";
import { newProject, migrateProject, projectSchema } from "../src/lib/projects/project-schema.ts";

const actorId = randomUUID();
const supported = ["head-rotation", "arm-gesture", "facial-expression"];
const event = (sceneId, action, overrides = {}) => ({
  id: randomUUID(), sceneId, characterInstanceId: actorId, action, startFrame: 10, durationFrames: 20,
  enabled: true, priority: 0, intensity: 1, speed: 1, ...overrides,
});

test("scene action events validate stable IDs and scene-local frame bounds", () => {
  const sceneId = randomUUID();
  const { scenes } = createScene({ sceneOrder: [], scenes: {} }, sceneId);
  const eventId = randomUUID();
  const parsed = sceneDefinitionSchema.parse({ ...scenes[sceneId], actionEvents: [{ ...event(sceneId, "head-nod"), id: eventId }] });
  assert.equal(parsed.actionEvents[0].id, eventId);
  assert.throws(() => sceneDefinitionSchema.parse({ ...parsed, actionEvents: [{ ...parsed.actionEvents[0], startFrame: 290, durationFrames: 20 }] }));
  assert.throws(() => sceneDefinitionSchema.parse({ ...parsed, actionEvents: [{ ...parsed.actionEvents[0], durationFrames: 0 }] }));
});

test("scene action evaluation is deterministic for arbitrary seeks and uses half-open event intervals", () => {
  const sceneId = randomUUID();
  const base = createScene({ sceneOrder: [], scenes: {} }, sceneId).scenes[sceneId];
  const scene = sceneDefinitionSchema.parse({ ...base, actionEvents: [event(sceneId, "head-nod")] });
  const before = evaluateSceneCharacterActions(scene, 9, 30, { [actorId]: supported });
  const atStart = evaluateSceneCharacterActions(scene, 10, 30, { [actorId]: supported });
  const inEvent = evaluateSceneCharacterActions(scene, 15, 30, { [actorId]: supported });
  const repeat = evaluateSceneCharacterActions(scene, 15, 30, { [actorId]: supported });
  const atEnd = evaluateSceneCharacterActions(scene, 30, 30, { [actorId]: supported });
  assert.deepEqual(before, {});
  assert.deepEqual(atStart[actorId].pose.headRotation, [0, 0, 0]);
  assert.ok(inEvent[actorId].pose.headRotation.some((value) => value !== 0));
  assert.deepEqual(repeat, inEvent);
  assert.deepEqual(atEnd, {});
});

test("event priorities resolve shared channels while independent arm and gaze channels coexist", () => {
  const sceneId = randomUUID();
  const base = createScene({ sceneOrder: [], scenes: {} }, sceneId).scenes[sceneId];
  const actorId2 = randomUUID();
  const scene = sceneDefinitionSchema.parse({ ...base, actionEvents: [
    event(sceneId, "head-nod", { priority: 8, intensity: 1.4 }),
    event(sceneId, "head-turn", { priority: 2, intensity: 0.3 }),
    event(sceneId, "explain", { priority: 1 }),
    event(sceneId, "gaze-character", { targetKind: "character", targetId: actorId2, priority: 3 }),
  ] });
  const output = evaluateSceneCharacterActions(scene, 15, 30, { [actorId]: supported }, new Set([actorId]));
  const nod = evaluateSceneCharacterActions(sceneDefinitionSchema.parse({ ...base, actionEvents: [scene.actionEvents[0]] }), 15, 30, { [actorId]: supported });
  assert.deepEqual(output[actorId].pose.headRotation, nod[actorId].pose.headRotation);
  assert.ok(output[actorId].pose.rightArmRotation.some((value) => value !== 0));
  assert.equal(output[actorId].gaze.mode, "attention");
  assert.equal(output[actorId].gaze.attentionTargetKind, "character");
  assert.equal(evaluateSceneCharacterActions(scene, 15, 30, { [actorId]: supported })[actorId].gaze, undefined);
});

test("scheduled actions resolve to the intended renderer pivots and reset on backward seek", () => {
  const sceneId = randomUUID();
  const otherActor = randomUUID();
  const base = createScene({ sceneOrder: [], scenes: {} }, sceneId).scenes[sceneId];
  const action = event(sceneId, "explain", { characterInstanceId: actorId, startFrame: 60, durationFrames: 90 });
  const otherAction = event(sceneId, "head-turn", { characterInstanceId: otherActor, startFrame: 60, durationFrames: 90 });
  const scene = sceneDefinitionSchema.parse({ ...base, actionEvents: [action, otherAction] });
  const capabilities = { [actorId]: supported, [otherActor]: ["head-rotation"] };
  const start = evaluateSceneCharacterActions(scene, 60, 30, capabilities);
  const middle = evaluateSceneCharacterActions(scene, 90, 30, capabilities);
  const before = evaluateSceneCharacterActions(scene, 59, 30, capabilities);
  assert.equal(start[actorId].poseActive, true);
  assert.deepEqual(start[actorId].pose.rightArmRotation, [0, 0, 0]);
  assert.ok(middle[actorId].pose.rightArmRotation.some((value) => value !== 0));
  assert.equal(middle[otherActor].pose.rightArmRotation.every((value) => value === 0), true);
  assert.deepEqual(before, {});

  const rig = new Group();
  const rightArm = new Object3D();
  rightArm.name = "right-arm-pivot";
  rightArm.rotation.z = 0.07;
  rig.add(rightArm);
  const baselines = new WeakMap();
  applyCharacterActionPose(rig, middle[actorId].pose, neutralGazePose, defaultGazeCapability, baselines);
  assert.notEqual(rightArm.rotation.z, 0.07, "evaluated event must reach the visible arm pivot");
  applyCharacterActionPose(rig, { headRotation: [0, 0, 0], leftArmRotation: [0, 0, 0], rightArmRotation: [0, 0, 0] }, neutralGazePose, defaultGazeCapability, baselines);
  assert.equal(rightArm.rotation.z, 0.07, "seeking before the action restores its renderer baseline");
});

test("timecode and seconds ranges convert deterministically to half-open scene frames", () => {
  assert.deepEqual(parseSceneEventTimeDraft("timecode", "00:00:02:00", 30, 300), { ok: true, frame: 60, normalized: "00:00:02:00" });
  assert.deepEqual(parseSceneEventTimeDraft("timecode", "00:00:05:00", 30, 300), { ok: true, frame: 150, normalized: "00:00:05:00" });
  assert.deepEqual(parseSceneEventTimeDraft("seconds", "5", 30, 300), { ok: true, frame: 150, normalized: "5" });
  assert.equal(formatSceneEventTime(150, 30, "timecode"), "00:00:05:00");
  assert.equal(formatSceneEventTime(150, 30, "seconds"), "5");
  assert.equal(parseSceneEventTimeDraft("timecode", "00:00:01:30", 30, 300).ok, false);
  assert.equal(parseSceneEventTimeDraft("timecode", "00:00:10:00", 30, 299).ok, false);
  assert.equal(parseSceneEventTimeDraft("timecode", "00:00:02:", 30, 300).ok, false);
  assert.equal(parseSceneEventTimeDraft("seconds", "2.5", 30, 300).ok, true);
});

test("runtime uses display-frame scheduling and lets scheduled poses override transient previews", async () => {
  const [shell, evaluator, timingComponent] = await Promise.all([
    readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/scenes/scene-action-evaluation.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/event-timing-input.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(shell, /requestAnimationFrame\(tick\)/);
  assert.match(shell, /cancelAnimationFrame\(animationFrame\)/);
  assert.match(shell, /return \{ \.\.\.manual, \.\.\.scheduled \}/);
  assert.match(shell, /filter\(\(\[, pose\]\) =>\s*pose\.poseActive/);
  assert.match(evaluator, /target\.poseActive = true/);
  assert.match(timingComponent, /value=\{startValue\}/);
  assert.match(timingComponent, /value=\{endValue\}/);
  assert.match(timingComponent, /onChange=\{\(event\) => \{ setStartDraft\(event\.target\.value\)/);
  assert.match(timingComponent, /onChange=\{\(event\) => \{ setEndDraft\(event\.target\.value\)/);
  assert.match(timingComponent, /event\.key === "Escape"/);
  assert.match(timingComponent, /value=\{mode\}/);
});

test("scene duplication creates independent event IDs; duration and FPS changes retain bounded frame truth", () => {
  const sceneId = randomUUID(), duplicateId = randomUUID();
  const created = createScene({ sceneOrder: [], scenes: {} }, sceneId);
  const source = sceneDefinitionSchema.parse({ ...created.scenes[sceneId], actionEvents: [event(sceneId, "arm-gesture", { startFrame: 280, durationFrames: 20 })] });
  const duplicated = duplicateScene({ ...created, scenes: { [sceneId]: source } }, sceneId, duplicateId);
  assert.notEqual(duplicated.scenes[sceneId].actionEvents[0].id, duplicated.scenes[duplicateId].actionEvents[0].id);
  const shortened = setSceneDuration(duplicated, sceneId, 290);
  assert.equal(shortened.scenes[sceneId].actionEvents[0].durationFrames, 10);
  const edited = updateSceneActionEvent(shortened.scenes[sceneId], shortened.scenes[sceneId].actionEvents[0].id, { startFrame: 100 });
  assert.equal(edited.actionEvents[0].startFrame, 100);
});

test("schema v7 scenes migrate with empty action arrays; v8 events survive project parsing", () => {
  const project = newProject(randomUUID(), "Events");
  const sceneId = randomUUID();
  const created = createScene({ sceneOrder: [], scenes: {} }, sceneId);
  const eventRecord = event(sceneId, "happy", { startFrame: 4, durationFrames: 30 });
  const current = projectSchema.parse({ ...project, sceneOrder: [sceneId], scenes: { [sceneId]: { ...created.scenes[sceneId], actionEvents: [eventRecord] } } });
  assert.equal(current.schemaVersion, 8);
  assert.equal(current.scenes[sceneId].actionEvents[0].id, eventRecord.id);
  const legacy = migrateProject({ ...current, schemaVersion: 7, scenes: { [sceneId]: { ...current.scenes[sceneId], actionEvents: undefined } } });
  assert.equal(legacy.schemaVersion, 8);
  assert.deepEqual(legacy.scenes[sceneId].actionEvents, []);
});

test("timing drafts allow empty/intermediate text during editing and validate on commit", () => {
  const emptyStart = commitEventTimingDraft("start-seconds", "", 30, 299);
  const incomplete = commitEventTimingDraft("start-seconds", "2.", 30, 299);
  assert.equal(emptyStart.ok, false);
  assert.equal(incomplete.ok, true);
  if (incomplete.ok) {
    assert.equal(incomplete.frame, 60);
    assert.equal(incomplete.normalized, "2");
  }
  assert.equal(commitEventTimingDraft("duration-frames", "", 30, 300).ok, false);
  assert.equal(commitEventTimingDraft("duration-frames", "15.0", 30, 300).ok, false);
});

test("seconds convert to nearest configured frame and formatted values preserve every supported frame", () => {
  assert.deepEqual(commitEventTimingDraft("start-seconds", "1.25", 30, 100), { ok: true, frame: 38, normalized: "1.267" });
  assert.deepEqual(commitEventTimingDraft("start-seconds", "0.1", 24, 100), { ok: true, frame: 2, normalized: "0.083" });
  for (const fps of [24, 25, 30, 50, 60]) {
    for (let frame = 0; frame <= fps * 10; frame += 1) {
      const formatted = formatStartSeconds(frame, fps);
      assert.equal(Math.round(Number(formatted) * fps), frame, `${frame} frames at ${fps} FPS`);
    }
  }
  assert.equal(formatStartSeconds(0, 30), "0");
  assert.equal(formatDurationFrames(15), "15");
});

test("timing commits reject non-finite, negative, zero-duration and out-of-scene values", () => {
  for (const invalid of ["-1", "Infinity", "NaN", "1e4"]) {
    assert.equal(commitEventTimingDraft("start-seconds", invalid, 30, 299).ok, false, invalid);
  }
  assert.equal(commitEventTimingDraft("duration-frames", "0", 30, 300).ok, false);
  assert.equal(commitEventTimingDraft("duration-frames", "-2", 30, 300).ok, false);
  assert.equal(commitEventTimingDraft("start-seconds", "10", 30, 299).ok, false);
  assert.equal(commitEventTimingDraft("duration-frames", "301", 30, 300).ok, false);
  assert.deepEqual(commitEventTimingDraft("duration-frames", "300", 30, 300), { ok: true, frame: 300, normalized: "300" });
});

test("committed input edits update only the selected event and retain timeline frame values", () => {
  const sceneId = randomUUID();
  const created = createScene({ sceneOrder: [], scenes: {} }, sceneId);
  const selected = event(sceneId, "head-nod", { startFrame: 30, durationFrames: 45 });
  const unrelated = event(sceneId, "explain", { startFrame: 120, durationFrames: 60 });
  const scene = sceneDefinitionSchema.parse({ ...created.scenes[sceneId], actionEvents: [selected, unrelated] });
  const committedTime = commitEventTimingDraft("start-seconds", "2.5", 30, 255);
  const committedDuration = commitEventTimingDraft("duration-frames", "75", 30, 270);
  assert.equal(committedTime.ok, true);
  assert.equal(committedDuration.ok, true);
  if (!committedTime.ok || !committedDuration.ok) return;
  const updated = updateSceneActionEvent(scene, selected.id, { startFrame: committedTime.frame, durationFrames: committedDuration.frame });
  assert.deepEqual(updated.actionEvents[0], { ...selected, startFrame: 75, durationFrames: 75 });
  assert.deepEqual(updated.actionEvents[1], unrelated);
  assert.equal(sceneDefinitionSchema.safeParse(updated).success, true);
});

test("event list ordering persists independently from time and priority, with accessible reorder fallback", async () => {
  const sceneId = randomUUID();
  const base = createScene({ sceneOrder: [], scenes: {} }, sceneId).scenes[sceneId];
  const first = event(sceneId, "gaze-character", { targetKind: "character", targetId: randomUUID(), startFrame: 90, durationFrames: 30, priority: 4 });
  const second = event(sceneId, "explain", { startFrame: 15, durationFrames: 45, priority: -2 });
  const scene = sceneDefinitionSchema.parse({ ...base, actionEvents: [first, second] });
  const reordered = reorderSceneActionEvent(scene, second.id, 0);
  assert.deepEqual(reordered.actionEvents.map((item) => item.id), [second.id, first.id]);
  assert.deepEqual(sceneDefinitionSchema.parse(JSON.parse(JSON.stringify(reordered))).actionEvents.map((item) => item.id), [second.id, first.id]);
  assert.deepEqual(reordered.actionEvents.map(({ id, startFrame, durationFrames, priority }) => ({ id, startFrame, durationFrames, priority })),
    [{ id: second.id, startFrame: 15, durationFrames: 45, priority: -2 }, { id: first.id, startFrame: 90, durationFrames: 30, priority: 4 }]);
  const moved = moveSceneActionEvent(reordered, first.id, 133.8);
  assert.equal(moved.actionEvents[1].startFrame, 134);
  assert.equal(moved.actionEvents[1].durationFrames, 30);
  assert.equal(moveSceneActionEvent(moved, first.id, 999).actionEvents[1].startFrame, base.durationFrames - 30);
  const [editor, timeline] = await Promise.all([
    readFile(new URL("../src/components/scenes/scene-action-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/scene-action-timeline.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(editor, /onReorderEvent\(event\.id, index - 1\)/);
  assert.match(editor, /onReorderEvent\(event\.id, index \+ 1\)/);
  assert.match(editor, /draggable/);
  assert.match(timeline, /pixelsPerFrame/);
  assert.match(timeline, /Math\.round\(\(event\.clientX - drag\.originX\) \/ pixelsPerFrame\)/);
  assert.match(timeline, /onMove\(eventId, frame\)/);
});

test("animation workspace separates scene overview from per-character channel tracks without remounting viewport", async () => {
  const [timeline, tracks, shell, inspector] = await Promise.all([
    readFile(new URL("../src/components/scenes/scene-authoring.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/scene-action-timeline.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/scene-action-inspector.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(timeline, /hidden=\{animationFocused\}/);
  assert.match(timeline, /hidden=\{!animationFocused\}/);
  assert.match(timeline, /<SceneActionTimeline/);
  assert.match(timeline, /انتخاب سکانس برای ویرایش حرکت‌ها/);
  assert.match(tracks, /getPreviewActionChannels/);
  assert.match(tracks, /gazeSupportedIds\.includes/);
  assert.match(tracks, /categoryLabel/);
  assert.match(tracks, /slice\(\)\.sort\(\(a, b\) => a\.priority - b\.priority/);
  assert.match(shell, /<StudioViewport/);
  assert.match(shell, /onMoveEvent=\{\(id, startFrame\)/);
  assert.match(inspector, /اولویت تعارض در کانال مشترک/);
  assert.match(inspector, /زمان و ترتیب فهرست را تغییر نمی‌دهد/);
});

test("new-event authoring uses the shared editable time range and persists integer frames", async () => {
  const [editor, shell, camera] = await Promise.all([
    readFile(new URL("../src/components/scenes/scene-action-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/scene-canvas.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(editor, /\breadOnly\b/);
  assert.match(editor, /<EventTimeRangeInput/);
  assert.match(editor, /startFrame, durationFrames: endFrame - startFrame/);
  assert.match(editor, /creationRangeRef\.current = next/);
  const timingInput = await readFile(new URL("../src/components/scenes/event-timing-input.tsx", import.meta.url), "utf8");
  assert.match(timingInput, /value=\{startValue\}/);
  assert.match(timingInput, /value=\{endValue\}/);
  assert.match(timingInput, /onChange=\{\(event\) => \{ setStartDraft\(event\.target\.value\)/);
  assert.match(timingInput, /onChange=\{\(event\) => \{ setEndDraft\(event\.target\.value\)/);
  assert.match(shell, /<SceneActionEditor key=\{`\$\{projects\.active\?\.id/);
  assert.match(camera, /if \(isTextEntry\(event\.target\)\) return/);
  const start = parseSceneEventTimeDraft("timecode", "00:00:02:15", 30, 299);
  const end = parseSceneEventTimeDraft("timecode", "00:00:04:15", 30, 300);
  assert.equal(start.ok, true);
  assert.equal(end.ok, true);
  if (!start.ok || !end.ok) return;
  const sceneId = randomUUID();
  const project = newProject(randomUUID(), "Keyboard event timing");
  const created = createScene({ sceneOrder: [], scenes: {} }, sceneId);
  const saved = projectSchema.parse({ ...project, sceneOrder: [sceneId], scenes: {
    [sceneId]: sceneDefinitionSchema.parse({ ...created.scenes[sceneId], actionEvents: [event(sceneId, "head-nod", {
      startFrame: start.frame, durationFrames: end.frame - start.frame,
    })] }),
  } });
  assert.equal(projectSchema.parse(JSON.parse(JSON.stringify(saved))).scenes[sceneId].actionEvents[0].startFrame, 75);
  assert.equal(saved.scenes[sceneId].actionEvents[0].durationFrames, 60);
});

test("animation editor is reachable from main navigation and shares timeline, inspector, and help infrastructure", async () => {
  const [navigation, shell, timeline, help, actionEditor, actionInspector, styles, timingInput] = await Promise.all([
    readFile(new URL("../src/config/navigation.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/scene-authoring.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/help/context-help-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/scene-action-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/scene-action-inspector.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/event-timing-input.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(navigation, /id: "animations"[\s\S]*label: "حرکت‌ها"/);
  assert.match(shell, /activeSection === "animations"/);
  assert.match(shell, /<SceneActionEditor/);
  assert.match(shell, /<SceneActionInspector/);
  assert.match(timeline, /selected\.actionEvents\.map/);
  assert.match(help, /timelineActions:[\s\S]*title: "حرکت‌ها و انیمیشن‌های زمان‌بندی‌شده"/);
  assert.match(actionEditor, /w-full min-w-0/);
  assert.match(actionEditor, /<details/);
  assert.match(actionInspector, /تنظیمات پیشرفتهٔ حرکت/);
  assert.match(styles, /\.workspace-main\s*\{[^}]*min-width:\s*0/);
  assert.match(styles, /\.workspace-inspector details\[open\]/);
  assert.match(actionInspector, /<EventTimeRangeInput/);
  assert.match(timingInput, /inputMode=\{mode === "timecode" \? "text" : "decimal"\}/);
  assert.match(timingInput, /event\.key === "Enter"/);
  assert.match(timingInput, /event\.key === "Escape"/);
  assert.match(timingInput, /onBlur=\{\(event\) => validate\("start", event\.currentTarget\.value\)\}/);
  assert.match(timingInput, /const \[startDraft, setStartDraft\]/);
  assert.match(timingInput, /const \[endDraft, setEndDraft\]/);
  assert.match(timingInput, /type="text"/);
  assert.match(timingInput, /setStartDraft\(event\.target\.value\)/);
  assert.match(timingInput, /setEndDraft\(event\.target\.value\)/);
});
