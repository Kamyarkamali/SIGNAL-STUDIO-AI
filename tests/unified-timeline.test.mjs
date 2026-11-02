import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { audioClipFrameRange, speakerRegionFrameRange, speakerRegionsAtFrame } from "../src/lib/scenes/timeline-projection.ts";
import { clipSceneRelation, clipSourceDurationFrames, sceneLocalPlacementToGlobalFrame } from "../src/lib/audio/audio-placement.ts";
import { canMergeAudioClips, mergeAudioClips, moveAudioClip, snapTimelineFrame, splitAudioClip, timelineClientXToFrame, trimAudioClip } from "../src/lib/audio/timeline-editing.ts";

const clip = { id: "10000000-0000-4000-8000-000000000001", assetId: "10000000-0000-4000-8000-000000000002", startFrame: 100, sourceStartSeconds: 2, sourceEndSeconds: 5.25, gain: 1, muted: false };
const region = { id: "10000000-0000-4000-8000-000000000003", audioClipId: clip.id, startSeconds: 3, endSeconds: 4, speakerId: null, status: "unknown" };

test("unified audio clip and speaker rows project existing source times onto project frames", () => {
  assert.deepEqual(audioClipFrameRange(clip, 30), { startFrame: 100, endFrame: 198 });
  assert.deepEqual(speakerRegionFrameRange(clip, region, 30), { startFrame: 130, endFrame: 160 });
});

test("speaker interval lookup is half-open and deterministic on direct or backward seeks", () => {
  const clips = [clip];
  const regions = [region];
  assert.equal(speakerRegionsAtFrame(clips, regions, 130, 30).length, 1);
  assert.equal(speakerRegionsAtFrame(clips, regions, 159, 30).length, 1);
  assert.equal(speakerRegionsAtFrame(clips, regions, 160, 30).length, 0);
  assert.equal(speakerRegionsAtFrame(clips, regions, 129, 30).length, 0);
  assert.equal(speakerRegionsAtFrame(clips, regions, 130, 30)[0]?.region.id, region.id);
});

test("scene-local clip placement converts to project frames and reports cross-scene ranges without splitting", () => {
  assert.equal(sceneLocalPlacementToGlobalFrame(300, 300, 90), 390);
  assert.equal(sceneLocalPlacementToGlobalFrame(300, 300, 300), null);
  assert.equal(sceneLocalPlacementToGlobalFrame(300, 300, -1), null);
  assert.equal(clipSourceDurationFrames(2, 5.25, 30), 98);
  assert.equal(clipSceneRelation({ ...clip, startFrame: 330 }, 300, 300, 30), "inside");
  assert.equal(clipSceneRelation({ ...clip, startFrame: 570 }, 300, 300, 30), "spans");
  assert.equal(clipSceneRelation({ ...clip, startFrame: 200 }, 300, 300, 30), "before");
  assert.equal(clipSceneRelation({ ...clip, startFrame: 700 }, 300, 300, 30), "after");
  const spanning = { ...clip, startFrame: 570 };
  assert.equal(audioClipFrameRange(spanning, 30).endFrame, 668);
});

test("timeline pointer coordinates map through zoom and horizontal scroll without reversing RTL page layout", () => {
  assert.equal(timelineClientXToFrame(600, 100, 1000, 1000), 500);
  // After horizontal scrolling the content's client rect shifts; the same local time maps to the same frame.
  assert.equal(timelineClientXToFrame(300, -200, 1000, 1000), 500);
  // At 4x zoom the content is wider, but frame coordinates remain project coordinates.
  assert.equal(timelineClientXToFrame(2100, 100, 4000, 1000), 500);
  assert.equal(timelineClientXToFrame(100, 100, 4000, 1000), 0);
  assert.equal(timelineClientXToFrame(4100, 100, 4000, 1000), 1000);
  assert.equal(timelineClientXToFrame(Number.NaN, 0, 1, 1), null);
});

test("audio edits snap to scene and clip edges, move clips between scenes, and preserve frame coordinates", () => {
  const audio = { speakers: {}, audioClips: { [clip.id]: clip }, speakerRegions: { [region.id]: region } };
  assert.equal(snapTimelineFrame(297, [0, 300, 600], 5), 300);
  assert.equal(snapTimelineFrame(287, [0, 300, 600], 5), 287);
  const moved = moveAudioClip(audio, clip.id, 330);
  assert.equal(moved.audioClips[clip.id].startFrame, 330);
  assert.equal(audio.audioClips[clip.id].startFrame, 100, "The old project snapshot remains unchanged for undo.");
  assert.equal(clipSceneRelation(moved.audioClips[clip.id], 300, 300, 30), "inside");
});

test("edge trims retain the original asset and adjust speaker intervals within source bounds", () => {
  const longRegion = { ...region, startSeconds: 2.5, endSeconds: 5 };
  const audio = { speakers: {}, audioClips: { [clip.id]: clip }, speakerRegions: { [longRegion.id]: longRegion } };
  const trimmedStart = trimAudioClip(audio, clip.id, "start", 130, 30);
  assert.equal(trimmedStart.audioClips[clip.id].sourceStartSeconds, 3);
  assert.equal(trimmedStart.audioClips[clip.id].startFrame, 130);
  assert.equal(trimmedStart.speakerRegions[longRegion.id].startSeconds, 3);
  const trimmedEnd = trimAudioClip(trimmedStart, clip.id, "end", 160, 30);
  assert.equal(trimmedEnd.audioClips[clip.id].sourceEndSeconds, 4);
  assert.equal(trimmedEnd.speakerRegions[longRegion.id].endSeconds, 4);
  assert.equal(trimmedEnd.audioClips[clip.id].assetId, clip.assetId);
});

test("split-at-playhead preserves source ranges and splits crossing speaker assignments", () => {
  const longRegion = { ...region, startSeconds: 2.5, endSeconds: 4.5 };
  const audio = { speakers: {}, audioClips: { [clip.id]: clip }, speakerRegions: { [longRegion.id]: longRegion } };
  const split = splitAudioClip(audio, clip.id, 145, 30, () => "20000000-0000-4000-8000-000000000001");
  const right = Object.values(split.audioClips).find((item) => item.id !== clip.id);
  assert.ok(right);
  assert.equal(split.audioClips[clip.id].sourceEndSeconds, 3.5);
  assert.equal(right.sourceStartSeconds, 3.5);
  assert.equal(right.startFrame, 145);
  const regions = Object.values(split.speakerRegions);
  assert.deepEqual(regions.map((item) => [item.startSeconds, item.endSeconds]).sort((a, b) => a[0] - b[0]), [[2.5, 3.5], [3.5, 4.5]]);
  assert.equal(regions[1].audioClipId, right.id);
  assert.equal(splitAudioClip(audio, clip.id, 100, 30, () => "unused"), audio, "Splits at clip edges are rejected.");
});

test("sequential compatible clips merge non-destructively and preserve or clear speaker labels by choice", () => {
  const right = { ...clip, id: "10000000-0000-4000-8000-000000000004", startFrame: 198, sourceStartSeconds: 5.25, sourceEndSeconds: 7 };
  const speaker = { id: "10000000-0000-4000-8000-000000000005", kind: "audio-only", name: "گوینده" };
  const firstRegion = { ...region, startSeconds: 2, endSeconds: 5.25, speakerId: speaker.id, status: "assigned" };
  const secondRegion = { ...region, id: "10000000-0000-4000-8000-000000000006", audioClipId: right.id, startSeconds: 5.25, endSeconds: 7, speakerId: null, status: "unknown" };
  const audio = { speakers: { [speaker.id]: speaker }, audioClips: { [clip.id]: clip, [right.id]: right }, speakerRegions: { [firstRegion.id]: firstRegion, [secondRegion.id]: secondRegion } };
  assert.equal(canMergeAudioClips(clip, right, 30), true);
  assert.equal(canMergeAudioClips(clip, { ...right, assetId: "10000000-0000-4000-8000-000000000007" }, 30), false);
  const preserved = mergeAudioClips(audio, clip.id, right.id, 30, "preserve", () => "10000000-0000-4000-8000-000000000008");
  assert.equal(Object.keys(preserved.audioClips).length, 1);
  assert.equal(preserved.audioClips[clip.id].sourceEndSeconds, 7);
  assert.equal(preserved.speakerRegions[secondRegion.id].audioClipId, clip.id);
  assert.equal(preserved.speakerRegions[firstRegion.id].speakerId, speaker.id);
  const unknown = mergeAudioClips(audio, clip.id, right.id, 30, "unknown", () => "10000000-0000-4000-8000-000000000008");
  assert.equal(Object.values(unknown.speakerRegions).length, 1);
  assert.equal(Object.values(unknown.speakerRegions)[0].status, "unknown");
  assert.equal(Object.keys(audio.audioClips).length, 2, "The source project object remains intact for undo.");
});

test("scene, event, audio, and speaker lanes route to their existing editor and selection state", async () => {
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const dock = await readFile(new URL("../src/components/scenes/unified-timeline-tracks.tsx", import.meta.url), "utf8");
  const editor = await readFile(new URL("../src/components/audio/audio-editor.tsx", import.meta.url), "utf8");
  assert.match(shell, /<SceneAuthoring[\s\S]*?audio=\{projects\.audio\}/);
  assert.match(shell, /onSelectAudio=\{\(assetId, clipId, frame, regionId\) => \{[\s\S]*?setTimelineAudioSelection\(\{[\s\S]*?projectId: projects\.active\.id,[\s\S]*?assetId,[\s\S]*?clipId,[\s\S]*?setActiveSection\("audio"\);[\s\S]*?seekTimeline\(frame\);/);
  assert.match(shell, /onMoveEvent=\{\(sceneId, eventId, startFrame\) =>\s*editActionEvents\(sceneId,/);
  assert.match(dock, /props\.audio\.audioClips/);
  assert.match(dock, /props\.audio\.speakerRegions/);
  assert.match(dock, /props\.onSelectEvent/);
  assert.match(dock, /props\.onSelectAudio/);
  assert.match(dock, /صدا \$\{String\(index \+ 1\)/);
  assert.match(dock, /aria-pressed=\{selected\}/);
  assert.match(dock, /speakerColor\(colorKey\)/);
  assert.match(editor, /افزودن صدا به سکانس/);
  assert.match(editor, /sceneLocalPlacementToGlobalFrame/);
  assert.match(editor, /ادامهٔ کلیپ کامل در سکانس‌های بعدی/);
  assert.match(editor, /onSelectClip\(item\.assetId, item\.id\)/);
  assert.match(dock, /در دسترس نیست · فاز ۰۹/);
  assert.match(dock, /زیرنویس · آینده/);
  assert.equal((shell.match(/<StudioViewport\b/g) ?? []).length, 1);
});

test("timeline scale controls change presentation width while preserving the shared frame mapping", async () => {
  const dock = await readFile(new URL("../src/components/scenes/unified-timeline-tracks.tsx", import.meta.url), "utf8");
  assert.match(dock, /const \[zoom, setZoom\] = useState\(1\)/);
  assert.match(dock, /fitWidth \* zoom/);
  assert.match(dock, /Math\.max\(0\.5/);
  assert.match(dock, /Math\.min\(4/);
  assert.match(dock, /setZoom\(1\)/);
  assert.match(dock, /aria-label="بزرگ‌نمایی تایم‌لاین"/);
  assert.match(dock, /aria-label="کوچک‌نمایی تایم‌لاین"/);
  assert.match(dock, /drag\.originX\) \/ \(width \/ safeTotal\)/);
});

test("audio timeline exposes desktop and library drops, pointer trim/move, multi-select, merge choice and undo", async () => {
  const dock = await readFile(new URL("../src/components/scenes/unified-timeline-tracks.tsx", import.meta.url), "utf8");
  const editor = await readFile(new URL("../src/components/audio/audio-editor.tsx", import.meta.url), "utf8");
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const help = await readFile(new URL("../src/lib/help/context-help-content.ts", import.meta.url), "utf8");
  assert.match(dock, /timelineClientXToFrame\(clientX, rect\.left, rect\.width, props\.totalFrames\)/);
  assert.match(dock, /event\.dataTransfer\.types\.includes\("Files"\)/);
  assert.match(dock, /onDropAudioFile\(file, sceneId, frame\)/);
  assert.match(dock, /beginAudioDrag\(event, clip\.id, "move"\)/);
  assert.match(dock, /beginAudioDrag\(event, clip\.id, "start"\)/);
  assert.match(dock, /beginAudioDrag\(event, clip\.id, "end"\)/);
  assert.match(dock, /event\.ctrlKey \|\| event\.metaKey/);
  assert.match(dock, /حفظ گوینده‌ها/);
  assert.match(dock, /نامشخص‌کردن گوینده/);
  assert.match(dock, /واچرخانی/);
  assert.match(dock, /بازانجام/);
  assert.match(editor, /application\/x-signal-audio-asset/);
  assert.match(shell, /onDropAudioFile=\{importAudioAtScene\}/);
  assert.match(help, /برای واردکردن فایل از رایانه/);
});

test("central help explains project-synchronized audio and remaining timeline limits", async () => {
  const { contextHelp } = await import("../src/lib/help/context-help-content.ts");
  assert.equal(contextHelp.gettingStarted.status, "available");
  assert.match(contextHelp.gettingStarted.steps.join(" "), /پروژه|سکانس|شخصیت|صدا|حرکت/);
  assert.match(contextHelp.audio.steps.join(" "), /برش از\/تا|جایگاه|فریم محلی/);
  assert.match(contextHelp.audio.limits, /خودکار شخصیت/);
  assert.match(contextHelp.timeline.limits, /با جایگاه نشانگر زمان پروژه همگام است/);
  assert.doesNotMatch(contextHelp.timeline.limits, /همگام‌سازی نمی‌شود/);
  assert.match(contextHelp.timeline.limits, /زیرنویس/);
  assert.match(contextHelp.timeline.steps.join(" "), /بزرگ‌نمایی|کوچک‌نمایی/);
});
