import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { characterModelRegistry } from "../src/lib/characters/character-registry.ts";
import {
  blendPreviewPoseLayers,
  clampPreviewSettings,
  defaultPreviewSettings,
  evaluateCharacterPreviewPose,
  getPreviewDuration,
  getPreviewExpression,
  getPreviewActionAvailability,
  isPreviewActionSupported,
  previewActionIds,
} from "../src/lib/characters/animation-preview.ts";
import { characterProjectDataSchema } from "../src/lib/characters/character-schema.ts";
import { emptyCharacterData, createCharacterIdentity, addCharacterInstance } from "../src/lib/characters/character-operations.ts";

const allChannels = ["head-rotation", "arm-gesture"];

test("preview actions are capability-backed for procedural and imported model definitions", () => {
  const kamyar = characterModelRegistry.get("character-model:kamyar");
  const claude = characterModelRegistry.get("character-model:claude-mascot");
  assert.ok(kamyar && claude);
  assert.equal(isPreviewActionSupported("head-turn", kamyar.capabilities.animationCapabilities), true);
  assert.equal(isPreviewActionSupported("arm-gesture", claude.capabilities.animationCapabilities), false);
  assert.equal(getPreviewActionAvailability([]).every((item) => !item.supported || item.id === "neutral" || item.id === "return-idle"), true);
  assert.deepEqual(kamyar.capabilities.animationCapabilities, allChannels);
});

test("explicit source timestamps are deterministic, seekable, bounded, and keep world transforms out of pose output", () => {
  const input = { actionId: "head-turn", sourceTimeSeconds: 0.7, durationSeconds: 2.4, capabilities: allChannels };
  const first = evaluateCharacterPreviewPose(input);
  evaluateCharacterPreviewPose({ ...input, sourceTimeSeconds: 1.4 });
  const repeated = evaluateCharacterPreviewPose(input);
  assert.deepEqual(repeated, first, "seeking elsewhere cannot change the result for an absolute timestamp");
  assert.ok(Math.abs(first.headRotation[1]) <= 0.3);
  assert.deepEqual(evaluateCharacterPreviewPose({ ...input, sourceTimeSeconds: 5 }).headRotation, [0, 0, 0]);
  assert.deepEqual(Object.keys(first).sort(), ["headRotation", "leftArmRotation", "rightArmRotation"]);
  assert.deepEqual(evaluateCharacterPreviewPose({ ...input, actionId: "head-nod" }), evaluateCharacterPreviewPose({ ...input, actionId: "head-nod" }));
});

test("emotional and gesture presets are distinct and facial previews require a real face capability", () => {
  assert.ok(previewActionIds.includes("celebrating"));
  const capabilities = ["head-rotation", "arm-gesture"];
  const happy = evaluateCharacterPreviewPose({ actionId: "happy", sourceTimeSeconds: 0.45, durationSeconds: 1.8, capabilities });
  const surprised = evaluateCharacterPreviewPose({ actionId: "surprised", sourceTimeSeconds: 0.3, durationSeconds: 0.85, capabilities });
  assert.notDeepEqual(happy, surprised);
  assert.equal(getPreviewExpression("happy", capabilities), undefined);
  assert.equal(getPreviewExpression("happy", [...capabilities, "facial-expression"]), "happy");
  assert.equal(isPreviewActionSupported("hand-wave", ["arm-gesture"]), true);
  assert.equal(isPreviewActionSupported("hand-wave", ["head-rotation"]), false);
});

test("preview timing and intensity settings are bounded and deterministic", () => {
  assert.deepEqual(clampPreviewSettings({ speed: 12, intensity: -4, transitionSeconds: 5, returnSeconds: 0 }), {
    speed: 2, intensity: 0.25, transitionSeconds: 0.8, returnSeconds: 0.15, easing: "smooth",
  });
  assert.equal(getPreviewDuration("surprised", { speed: 2 }), 0.425);
  const input = { actionId: "quick-nod", sourceTimeSeconds: 0.2, capabilities: ["head-rotation"], settings: { speed: 1.4, intensity: 0.7, easing: "ease-out" } };
  assert.deepEqual(evaluateCharacterPreviewPose(input), evaluateCharacterPreviewPose(input));
  assert.ok(Math.abs(evaluateCharacterPreviewPose(input).headRotation[0]) <= 0.17);
  const maximumPose = evaluateCharacterPreviewPose({ actionId: "celebrating", sourceTimeSeconds: 0.65, durationSeconds: 1.3, capabilities: ["head-rotation", "arm-gesture"], settings: { intensity: 1.5 } });
  assert.ok(Math.abs(maximumPose.leftArmRotation[2]) <= 0.54 && Math.abs(maximumPose.rightArmRotation[2]) <= 0.54);
  assert.deepEqual(defaultPreviewSettings.speed, 1);
});

test("pose layers resolve conflicting channels by deterministic priority", () => {
  const low = evaluateCharacterPreviewPose({ actionId: "head-nod", sourceTimeSeconds: 0.5, durationSeconds: 2.2, capabilities: ["head-rotation"] });
  const high = evaluateCharacterPreviewPose({ actionId: "head-shake", sourceTimeSeconds: 0.5, durationSeconds: 1.35, capabilities: ["head-rotation"] });
  const arm = evaluateCharacterPreviewPose({ actionId: "arm-gesture", sourceTimeSeconds: 0.5, durationSeconds: 2, capabilities: ["arm-gesture"] });
  const blended = blendPreviewPoseLayers([
    { pose: low, channels: ["headRotation"], priority: 1 },
    { pose: arm, channels: ["leftArmRotation", "rightArmRotation"], priority: 1 },
    { pose: high, channels: ["headRotation"], priority: 5 },
  ]);
  assert.deepEqual(blended.headRotation, high.headRotation);
  assert.deepEqual(blended.rightArmRotation, arm.rightArmRotation);
});

test("preview poses are independent and unsupported actions resolve to neutral", () => {
  const head = evaluateCharacterPreviewPose({ actionId: "head-nod", sourceTimeSeconds: 0.55, durationSeconds: 2.4, capabilities: ["head-rotation"] });
  const arm = evaluateCharacterPreviewPose({ actionId: "arm-gesture", sourceTimeSeconds: 0.55, durationSeconds: 2.4, capabilities: ["arm-gesture"] });
  assert.notDeepEqual(head, arm);
  assert.deepEqual(evaluateCharacterPreviewPose({ actionId: "arm-gesture", sourceTimeSeconds: 0.55, durationSeconds: 2.4, capabilities: ["head-rotation"] }), {
    headRotation: [0, 0, 0], leftArmRotation: [0, 0, 0], rightArmRotation: [0, 0, 0],
  });
  const independent = evaluateCharacterPreviewPose({ actionId: "head-turn", sourceTimeSeconds: 0.8, durationSeconds: 2.4, capabilities: allChannels });
  assert.notEqual(independent, head);
  assert.deepEqual(head, evaluateCharacterPreviewPose({ actionId: "head-nod", sourceTimeSeconds: 0.55, durationSeconds: 2.4, capabilities: ["head-rotation"] }));
});

test("return-to-idle deterministically blends the transient pose to neutral", () => {
  const fromPose = evaluateCharacterPreviewPose({ actionId: "arm-gesture", sourceTimeSeconds: 1.2, durationSeconds: 2.4, capabilities: allChannels });
  const halfway = evaluateCharacterPreviewPose({ actionId: "return-idle", sourceTimeSeconds: 0.275, durationSeconds: 0.55, capabilities: [], fromPose });
  const finished = evaluateCharacterPreviewPose({ actionId: "return-idle", sourceTimeSeconds: 0.55, durationSeconds: 0.55, capabilities: [], fromPose });
  assert.ok(Math.abs(halfway.rightArmRotation[2]) < Math.abs(fromPose.rightArmRotation[2]));
  assert.deepEqual(finished, { headRotation: [0, 0, 0], leftArmRotation: [0, 0, 0], rightArmRotation: [0, 0, 0] });
});

test("preview playback remains transient and does not alter saved identity, instance, or transform data", async () => {
  let data = emptyCharacterData();
  data = createCharacterIdentity(data, "10000000-0000-4000-8000-000000000001", "Preview Test", "character-model:kamyar");
  data = addCharacterInstance(data, "10000000-0000-4000-8000-000000000001", "20000000-0000-4000-8000-000000000001");
  const before = structuredClone(data);
  const playback = { instanceId: "20000000-0000-4000-8000-000000000001", actionId: "head-turn", startedAtMs: 17, durationSeconds: 2.4 };
  assert.equal(characterProjectDataSchema.safeParse(data).success, true);
  assert.deepEqual(data, before);
  assert.equal("playback" in data, false);
  assert.deepEqual(evaluateCharacterPreviewPose({ actionId: playback.actionId, sourceTimeSeconds: 0.5, durationSeconds: playback.durationSeconds, capabilities: allChannels }).headRotation[1] <= 0.24, true);
  const source = await readFile(new URL("../src/components/characters/character-layer.tsx", import.meta.url), "utf8");
  assert.match(source, /cancelAnimationFrame\(frame\)/, "preview scheduling is cleaned up on stop/unmount");
  assert.match(source, /getObjectByName\(name\)/, "pose resolves named local pivots rather than changing the saved instance transform");
  assert.match(source, /apply\("head-pivot"/, "head motion targets the model-local head pivot");
  const editor = await readFile(new URL("../src/components/characters/character-editor.tsx", import.meta.url), "utf8");
  assert.match(editor, /aria-label="سرعت حرکت"/);
  assert.match(editor, /aria-label="شدت حرکت"/);
  assert.match(editor, /aria-label="مدت گذار"/);
  assert.match(editor, /aria-label="مدت بازگشت به حالت خنثی"/);
  assert.match(editor, /aria-label="منحنی حرکت"/);
});
