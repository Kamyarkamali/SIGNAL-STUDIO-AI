import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { ProjectService } from "../src/lib/projects/project-service.ts";
import { migrateProject, newProject, projectSchema } from "../src/lib/projects/project-schema.ts";
import { validateAudioCollections } from "../src/lib/audio/audio-schema.ts";
import { createSceneAudioClip, isAudioAssetAvailable, sceneLocalPlacementToGlobalFrame } from "../src/lib/audio/audio-placement.ts";
import { moveAudioClip, splitAudioClip } from "../src/lib/audio/timeline-editing.ts";
import { audioSourceTimeAtProjectFrame } from "../src/lib/scenes/timeline-projection.ts";
import { mergeAdjacentSpeakerRegions, splitSpeakerRegion, updateSpeakerRegion } from "../src/lib/audio/audio-operations.ts";
import { sourceDraftValues } from "../src/lib/audio/audio-source-draft.ts";
import { createScene } from "../src/lib/scenes/scene-operations.ts";

test("audio source draft is safe with no selection, null state, and a removed asset", () => {
  const asset = { id: "audio-1", audioDurationSeconds: 4.5 };
  const draft = { assetId: asset.id, start: "1.25", end: "3.75" };
  assert.deepEqual(sourceDraftValues(null, undefined), { start: "0", end: "" });
  assert.deepEqual(sourceDraftValues(null, asset), { start: "0", end: "4.5" });
  assert.deepEqual(sourceDraftValues(draft, undefined), { start: "0", end: "" });
  assert.deepEqual(sourceDraftValues(draft, { id: "audio-2", audioDurationSeconds: 2 }), { start: "0", end: "2" });
  assert.deepEqual(sourceDraftValues(draft, asset), { start: "1.25", end: "3.75" });
});

function wav(durationSeconds = 12) {
  const dataLength = 32_000 * durationSeconds;
  const bytes = new Uint8Array(44 + dataLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x52494646, false); view.setUint32(4, bytes.length - 8, true); view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 16_000, true); view.setUint32(28, 32_000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); view.setUint32(36, 0x64617461, false); view.setUint32(40, dataLength, true);
  return bytes;
}

test("newly uploaded audio remains placeable while the current render manifest is stale", () => {
  assert.equal(isAudioAssetAvailable(undefined, true), true);
  assert.equal(isAudioAssetAvailable("audio"), true);
  assert.equal(isAudioAssetAvailable(undefined), false);
  assert.equal(isAudioAssetAvailable("image", true), true, "Only server-validated upload results may bypass the stale render manifest.");
});

test("schema v8 migrates to v9 with empty audio records and keeps scene data", () => {
  const source = newProject(randomUUID(), "Migration");
  const sceneId = randomUUID();
  const sequence = createScene({ sceneOrder: [], scenes: {} }, sceneId);
  const legacy = { ...source, ...sequence, schemaVersion: 8 };
  const migrated = migrateProject(legacy);
  assert.equal(migrated?.schemaVersion, 9);
  assert.deepEqual(migrated?.sceneOrder, [sceneId]);
  assert.deepEqual(migrated?.audioClips, {});
  assert.deepEqual(migrated?.speakerRegions, {});
});

test("audio collection validation enforces stable references and non-overlapping clip-local speaker intervals", () => {
  const speaker = { id: randomUUID(), kind: "audio-only", name: "Guest" };
  const clipId = randomUUID();
  const collections = {
    speakers: { [speaker.id]: speaker },
    audioClips: { [clipId]: { id: clipId, assetId: randomUUID(), startFrame: 0, sourceStartSeconds: 0, sourceEndSeconds: 12, gain: 1, muted: false } },
    speakerRegions: {
      [randomUUID()]: { id: randomUUID(), audioClipId: clipId, startSeconds: 0, endSeconds: 5, speakerId: speaker.id, status: "assigned" },
    },
  };
  // A map key must be the same stable ID stored in its record.
  const region = Object.values(collections.speakerRegions)[0];
  assert.ok(region);
  region.id = Object.keys(collections.speakerRegions)[0];
  const broken = projectSchema.safeParse({ ...newProject(randomUUID(), "Bad"), ...collections });
  assert.equal(broken.success, false);
  const missing = validateAudioCollections({ speakers: { [speaker.id]: speaker }, audioClips: {}, speakerRegions: {} }, {}, new Set());
  assert.deepEqual(missing, []);
  const clip = { id: clipId, assetId: "asset", startFrame: 0, sourceStartSeconds: 0, sourceEndSeconds: 12, gain: 1, muted: false };
  const firstId = randomUUID(), secondId = randomUUID();
  const overlap = validateAudioCollections({ speakers: { [speaker.id]: speaker }, audioClips: { [clipId]: clip }, speakerRegions: {
    [firstId]: { id: firstId, audioClipId: clipId, startSeconds: 0, endSeconds: 4, speakerId: speaker.id, status: "assigned" },
    [secondId]: { id: secondId, audioClipId: clipId, startSeconds: 3, endSeconds: 7, speakerId: null, status: "unknown" },
  } }, { asset: { audioDurationSeconds: 12 } }, new Set());
  assert.ok(overlap.some((message) => message.includes("هم‌پوشانی")));
});

test("speaker split and merge preserve stable records, source bounds, speaker identity, and adjacency rules", () => {
  const clipId = randomUUID(), speakerId = randomUUID(), regionId = randomUUID();
  const original = { id: regionId, audioClipId: clipId, startSeconds: 2, endSeconds: 6, speakerId, status: "assigned", text: "hello" };
  const split = splitSpeakerRegion(original, randomUUID());
  assert.ok(split);
  assert.equal(split.first.id, regionId);
  assert.equal(split.first.endSeconds, 4);
  assert.equal(split.second.startSeconds, 4);
  assert.equal(split.second.endSeconds, 6);
  assert.equal(split.second.speakerId, speakerId);
  assert.equal(splitSpeakerRegion({ ...original, endSeconds: 2.01 }, randomUUID()), null);
  assert.deepEqual(mergeAdjacentSpeakerRegions(split.first, split.second), original);
  assert.equal(mergeAdjacentSpeakerRegions(split.first, { ...split.second, speakerId: randomUUID() }), null);
  assert.equal(mergeAdjacentSpeakerRegions(split.first, { ...split.second, startSeconds: 4.1 }), null);
});

test("speaker quick assignment reuses identity and timing edits retain the selected speaker", () => {
  const identityId = randomUUID(), clipId = randomUUID(), regionId = randomUUID(), speakerId = randomUUID();
  const identity = { id: identityId, name: "Presenter" };
  const base = {
    speakers: {}, audioClips: {},
    speakerRegions: { [regionId]: { id: regionId, audioClipId: clipId, startSeconds: 0, endSeconds: 2, speakerId: null, status: "unknown" } },
  };
  const assigned = updateSpeakerRegion(base, regionId, { speakerId: identityId, status: "assigned" }, { [identityId]: identity }, () => speakerId);
  assert.equal(assigned.speakerRegions[regionId].speakerId, speakerId);
  assert.equal(assigned.speakers[speakerId].characterId, identityId);
  const changedTime = updateSpeakerRegion(assigned, regionId, { endSeconds: 1.5 }, { [identityId]: identity }, randomUUID);
  assert.equal(changedTime.speakerRegions[regionId].speakerId, speakerId);
  assert.equal(changedTime.speakerRegions[regionId].endSeconds, 1.5);
  const reassigned = updateSpeakerRegion(changedTime, regionId, { speakerId: identityId, status: "assigned" }, { [identityId]: identity }, randomUUID);
  assert.deepEqual(Object.keys(reassigned.speakers), [speakerId]);
  const unknown = updateSpeakerRegion(reassigned, regionId, { speakerId: null, status: "unknown" }, { [identityId]: identity }, randomUUID);
  assert.equal(unknown.speakerRegions[regionId].speakerId, null);
  assert.equal(unknown.speakerRegions[regionId].status, "unknown");
});

test("scene-first audio import creates stable global frame placements and maps playback into source trims", () => {
  const firstId = randomUUID(), secondId = randomUUID();
  const first = createSceneAudioClip({ id: randomUUID(), assetId: firstId, sceneStartFrame: 0, sceneDurationFrames: 300, localFrame: 45, sourceDurationSeconds: 4 });
  const second = createSceneAudioClip({ id: randomUUID(), assetId: secondId, sceneStartFrame: 300, sceneDurationFrames: 300, localFrame: 30, sourceDurationSeconds: 6 });
  assert.equal(first.startFrame, 45);
  assert.equal(second.startFrame, 330);
  assert.equal(audioSourceTimeAtProjectFrame({ ...first, sourceStartSeconds: 1, sourceEndSeconds: 4 }, 45, 30), 1);
  assert.equal(audioSourceTimeAtProjectFrame({ ...first, sourceStartSeconds: 1, sourceEndSeconds: 4 }, 75, 30), 2);
  assert.equal(audioSourceTimeAtProjectFrame({ ...first, sourceStartSeconds: 1, sourceEndSeconds: 4 }, 135, 30), null);
  assert.equal(createSceneAudioClip({ id: randomUUID(), assetId: firstId, sceneStartFrame: 0, sceneDurationFrames: 300, localFrame: 300, sourceDurationSeconds: 2 }), null);
});

test("timeline clip move and split persist through the existing schema v9 save and reopen path", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-timeline-edit-"));
  try {
    const service = new ProjectService(root);
    const project = await service.create("Timeline edits");
    const imported = await service.importAudioAsset(project.id, "voice.wav", "audio/wav", 12, wav());
    const asset = Object.values(imported.assetManifest).find((entry) => entry.kind === "audio");
    assert.ok(asset);
    const clipId = randomUUID();
    const clip = createSceneAudioClip({ id: clipId, assetId: asset.id, sceneStartFrame: 0, sceneDurationFrames: 900, localFrame: 10, sourceDurationSeconds: 12 });
    assert.ok(clip);
    let audio = { speakers: {}, audioClips: { [clip.id]: clip }, speakerRegions: {} };
    audio = moveAudioClip(audio, clip.id, 45);
    audio = splitAudioClip(audio, clip.id, 135, 30, randomUUID);
    const saved = await service.save(project.id, project.title, imported.revision, undefined, undefined, undefined, undefined, undefined,
      project.fps, project.sceneOrder, project.scenes, audio.speakers, audio.audioClips, audio.speakerRegions);
    const reopened = await service.open(project.id);
    assert.equal(reopened.schemaVersion, 9, "Timeline editing does not add a new project structure.");
    assert.equal(Object.keys(reopened.audioClips).length, 2);
    assert.deepEqual(Object.values(reopened.audioClips).map((item) => item.startFrame).sort((a, b) => a - b), [45, 135]);
    assert.equal(reopened.audioClips[clip.id].assetId, asset.id);
    assert.equal(saved.revision, reopened.revision);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("two scenes attach separate imported audio assets, reload at project frames, and delete independently", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-two-scene-audio-"));
  try {
    const store = new ProjectService(root); const project = await store.create("Two scene audio");
    await store.importAudioAsset(project.id, "scene-a.wav", "audio/wav", 3, wav(3));
    const importedB = await store.importAudioAsset(project.id, "scene-b.wav", "audio/wav", 4, wav(4));
    const assets = Object.values(importedB.assetManifest).filter((asset) => asset.kind === "audio");
    assert.equal(assets.length, 2);
    const assetA = assets.find((asset) => asset.displayName === "scene-a.wav");
    const assetB = assets.find((asset) => asset.displayName === "scene-b.wav");
    assert.ok(assetA && assetB);
    const oneId = randomUUID(), twoId = randomUUID();
    const first = createScene({ sceneOrder: [], scenes: {} }, oneId);
    const second = createScene(first, twoId);
    const clipA = createSceneAudioClip({ id: randomUUID(), assetId: assetA.id, sceneStartFrame: 0, sceneDurationFrames: 300, localFrame: 30, sourceDurationSeconds: 3 });
    const clipB = createSceneAudioClip({ id: randomUUID(), assetId: assetB.id, sceneStartFrame: 300, sceneDurationFrames: 300, localFrame: 60, sourceDurationSeconds: 4 });
    assert.ok(clipA && clipB);
    const regionA = { id: randomUUID(), audioClipId: clipA.id, startSeconds: 0, endSeconds: 3, speakerId: null, status: "unknown" };
    const regionB = { id: randomUUID(), audioClipId: clipB.id, startSeconds: 0, endSeconds: 4, speakerId: null, status: "unknown" };
    const scenes = { ...second.scenes };
    const saved = await store.save(importedB.id, importedB.title, importedB.revision, undefined, undefined, undefined, undefined, undefined,
      30, second.sceneOrder, scenes, {}, { [clipA.id]: clipA, [clipB.id]: clipB }, { [regionA.id]: regionA, [regionB.id]: regionB });
    assert.equal(saved.audioClips[clipA.id].startFrame, 30);
    assert.equal(saved.audioClips[clipB.id].startFrame, 360);
    const reopened = await store.open(project.id);
    assert.equal(reopened.audioClips[clipA.id].assetId, assetA.id);
    assert.equal(reopened.audioClips[clipB.id].assetId, assetB.id);
    assert.equal(reopened.speakerRegions[regionB.id].audioClipId, clipB.id);
    const withoutA = await store.save(reopened.id, reopened.title, reopened.revision, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, reopened.speakers, { [clipB.id]: clipB }, { [regionB.id]: regionB });
    assert.equal(withoutA.audioClips[clipA.id], undefined);
    assert.equal((await store.open(project.id)).audioClips[clipB.id].startFrame, 360);
    await store.removeAudioAsset(project.id, assetA.id);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("audio workflow exposes direct scene import, same-lane speaker names, and frame-driven playback wiring", async () => {
  const [editor, timeline, playback, shell, help] = await Promise.all([
    readFile(new URL("../src/components/audio/audio-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/scenes/unified-timeline-tracks.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/audio/audio-timeline-playback.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/help/context-help-content.ts", import.meta.url), "utf8"),
  ]);
  assert.match(editor, /افزودن صدا<input/);
  assert.match(editor, /createSceneAudioClip\(/);
  assert.match(editor, /تنظیمات پیشرفتهٔ کلیپ/);
  assert.match(editor, /Object\.values\(identities\)\.map/);
  assert.match(editor, /updateSpeakerRegion\(current, region\.id, change, identities, uuid\)/);
  assert.match(editor, /aria-label="گویندهٔ کلیپ انتخاب‌شده"/);
  assert.match(editor, /speakerName=/);
  assert.match(editor, /unknown-speaker|status: "unknown"/);
  assert.match(editor, /پخش کلیپ/);
  assert.match(timeline, /speakerLabels\.join/);
  assert.match(timeline, /regions\.map\(/);
  assert.match(playback, /audioSourceTimeAtProjectFrame/);
  assert.match(shell, /<AudioTimelinePlayback/);
  assert.match(help, /«افزودن صدا» را بزنید/);
  assert.match(help, /پخش پروژه، کلیپ‌های فعال را از ثانیهٔ منبع متناظر با فریم جاری اجرا می‌کند/);
});

test("audio imports persist separately, clips and speakers survive reopen/duplicate, and referenced files cannot be deleted", async () => {
  const root = await mkdtemp(join(tmpdir(), "signal-studio-audio-"));
  try {
    const store = new ProjectService(root);
    const project = await store.create("Audio persistence");
    const imported = await store.importAudioAsset(project.id, "dialogue.wav", "audio/wav", 5, wav());
    const asset = Object.values(imported.assetManifest).find((entry) => entry.kind === "audio");
    assert.ok(asset);
    assert.equal(asset.audioDurationSeconds, 12, "WAV duration is read from the file header rather than trusting the browser value.");
    const replaced = await store.replaceAudioAsset(project.id, asset.id, "dialogue-replaced.wav", "audio/wav", 12, wav());
    assert.equal(replaced.assetManifest[asset.id].displayName, "dialogue-replaced.wav");
    assert.equal(replaced.assetManifest[asset.id].id, asset.id);
    const speaker = { id: randomUUID(), kind: "audio-only", name: "Guest" };
    const clip = { id: randomUUID(), assetId: asset.id, startFrame: sceneLocalPlacementToGlobalFrame(300, 300, 90), sourceStartSeconds: 2, sourceEndSeconds: 8, gain: 1, muted: false };
    const region = { id: randomUUID(), audioClipId: clip.id, startSeconds: 3, endSeconds: 5, speakerId: speaker.id, status: "assigned" };
    const saved = await store.save(replaced.id, replaced.title, replaced.revision, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, { [speaker.id]: speaker }, { [clip.id]: clip }, { [region.id]: region });
    assert.equal(saved.schemaVersion, 9);
    assert.equal(saved.audioClips[clip.id].startFrame, 390, "Scene-local placement is persisted as the existing project-global frame.");
    assert.equal(saved.audioClips[clip.id].sourceStartSeconds, 2, "Source trim remains relative to the original audio file.");
    assert.equal((await store.open(project.id)).speakerRegions[region.id].speakerId, speaker.id);
    assert.equal((await store.open(project.id)).audioClips[clip.id].startFrame, 390, "Project reopen preserves the converted global placement.");
    await assert.rejects(store.removeAudioAsset(project.id, asset.id), { code: "ASSET_IN_USE" });
    await assert.rejects(store.replaceAudioAsset(project.id, asset.id, "short.wav", "audio/wav", 4, wav(4)), { code: "DURATION_MISMATCH" });
    const duplicate = await store.duplicate(project.id);
    assert.ok(Object.values(duplicate.assetManifest).some((entry) => entry.id === asset.id && entry.kind === "audio"));
    assert.equal(duplicate.audioClips[clip.id].assetId, asset.id);
    assert.equal(duplicate.audioClips[clip.id].startFrame, 390);
    const noClip = await store.save(saved.id, saved.title, saved.revision, undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, saved.speakers, {}, {});
    const deleted = await store.removeAudioAsset(project.id, asset.id);
    assert.equal(deleted.assetManifest[asset.id], undefined);
    assert.deepEqual(noClip.audioClips, {});
  } finally { await rm(root, { recursive: true, force: true }); }
});
