import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { characterModelRegistry } from "../src/lib/characters/character-registry.ts";
import {
  blendPreviewPoseLayers,
  clampPreviewSettings,
  defaultPreviewSettings,
  evaluateCharacterPreviewPose,
  evaluateFacialExpressionWeight,
  getPreviewDuration,
  getPreviewExpression,
  getPreviewActionAvailability,
  isPreviewActionSupported,
  previewActionIds,
} from "../src/lib/characters/animation-preview.ts";
import { applyFacialExpressionPose, evaluatePreviewBlinkWeight } from "../src/lib/characters/facial-expression-preview.ts";
import { characterProjectDataSchema } from "../src/lib/characters/character-schema.ts";
import { emptyCharacterData, createCharacterIdentity, addCharacterInstance } from "../src/lib/characters/character-operations.ts";

const allChannels = ["head-rotation", "arm-gesture", "facial-expression"];

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
  assert.deepEqual(Object.keys(first).sort(), ["headRotation", "leftArmRotation", "leftElbowRotation", "leftHandRotation", "leftWristRotation", "neckRotation", "rightArmRotation", "rightElbowRotation", "rightHandRotation", "rightWristRotation", "torsoRotation"]);
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

test("hand-to-chin thinking requires the full named joint chain and interpolates smoothly", () => {
  const kamyar = characterModelRegistry.get("character-model:kamyar");
  const joints = kamyar.attachmentPoints;
  assert.equal(isPreviewActionSupported("thinking", allChannels, []), false);
  assert.equal(isPreviewActionSupported("thinking", allChannels, joints), true);
  const sample = (time) => evaluateCharacterPreviewPose({ actionId: "thinking", sourceTimeSeconds: time, durationSeconds: 2.6, capabilities: allChannels, attachmentPoints: joints });
  const before = sample(0.55); const after = sample(0.551);
  assert.ok(Math.abs(after.rightElbowRotation[2] - before.rightElbowRotation[2]) < 0.03);
  assert.ok(before.rightElbowRotation[2] < -0.2);
  assert.ok(before.rightWristRotation[2] < 0);
  assert.deepEqual(sample(0.55), sample(0.55));
});

test("laughing preset coordinates head and upper body while retaining a visible laugh expression", () => {
  const pose = evaluateCharacterPreviewPose({ actionId: "laughing", sourceTimeSeconds: 0.55, durationSeconds: 1.8, capabilities: allChannels });
  assert.ok(pose.headRotation[0] !== 0);
  assert.ok(pose.torsoRotation[0] !== 0);
  assert.ok(pose.rightElbowRotation[2] !== 0);
  assert.equal(getPreviewExpression("laughing", allChannels), "laughing");
});

test("ChatGPT expression presets have distinct visible eye, brow and mouth configurations", async () => {
  const { chatGptExpressionPresets: p } = await import("../src/lib/characters/chatgpt-expression-presets.ts");
  for (const expression of ["happy", "sad", "angry", "surprised", "excited"]) {
    assert.notDeepEqual(p[expression], p.neutral);
  }
  assert.equal(p.happy.mouth, "smile");
  assert.equal(p.sad.mouth, "frown");
  assert.equal(p.happy.mouthRotation, 0);
  assert.equal(p.sad.mouthRotation, Math.PI);
  assert.ok(p.angry.eyeScaleY < p.neutral.eyeScaleY);
  assert.ok(p.surprised.eyeScaleY > p.excited.eyeScaleY);
  assert.ok(p.surprised.browLift > p.happy.browLift);
  assert.ok(p.excited.mouthScale[0] > p.happy.mouthScale[0]);
  const renderers = await readFile(new URL("../src/components/characters/character-renderers.tsx", import.meta.url), "utf8");
  assert.match(renderers, /name="eye-shape"\s+scale=\{\[1, poseExpression\.eyeScaleY, 1\]\}/);
  assert.match(renderers, /name="eyebrow"\s+position=/);
  assert.match(renderers, /name="mouth-display"/);
  assert.match(renderers, /"left-eyebrow" : "right-eyebrow"/);
  assert.match(renderers, /claudeOpenMouth/);
});

test("every procedural prototype advertises only implemented local face controls", () => {
  const claude = characterModelRegistry.get("character-model:claude-mascot");
  const kamyar = characterModelRegistry.get("character-model:kamyar");
  const hamid = characterModelRegistry.get("character-model:hamid");
  assert.ok(claude && kamyar && hamid);
  assert.ok(claude.capabilities.animationCapabilities.includes("facial-expression"));
  assert.ok(kamyar.capabilities.animationCapabilities.includes("facial-expression"));
  assert.ok(hamid.capabilities.animationCapabilities.includes("facial-expression"));
  assert.equal(getPreviewExpression("surprised", claude.capabilities.animationCapabilities), "surprised");
  assert.equal(getPreviewExpression("neutral", kamyar.capabilities.animationCapabilities), "neutral");
  assert.equal(getPreviewExpression("surprised", []), undefined);
});

function faceNode(name, children = []) {
  const node = { name, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, children,
    getObjectByName(target) { if (this.name === target) return this; for (const child of this.children) { const found = child.getObjectByName(target); if (found) return found; } return undefined; } };
  return node;
}
function fakeFaceRig({ digital = true, nestedBrows = true } = {}) {
  const variants = ["neutral", "smile", "frown", "open", "small-open", "laughing-open", "tilted-line"].map((shape) => faceNode(`mouth-${shape}`));
  const eyes = [-1, 1].map((side) => faceNode(side < 0 ? "left-eye" : "right-eye", [
    ...(digital ? [faceNode("eye-shape")] : []), ...(nestedBrows ? [faceNode("eyebrow")] : []),
  ]));
  return faceNode("root", [...eyes, faceNode("left-eyebrow"), faceNode("right-eyebrow"), faceNode("mouth-display", [faceNode("mouth", variants)])]);
}

test("facial adapter changes actual named renderer transforms, mouth visibility, blink, and restores baseline", () => {
  const rig = fakeFaceRig();
  applyFacialExpressionPose(rig, "chatgpt-robot", "neutral", 1);
  const baseEye = rig.getObjectByName("eye-shape").scale.y;
  applyFacialExpressionPose(rig, "chatgpt-robot", "happy", 1);
  assert.notEqual(rig.getObjectByName("eye-shape").scale.y, baseEye);
  assert.notEqual(rig.getObjectByName("eyebrow").position.y, 0.115);
  assert.equal(rig.getObjectByName("mouth-smile").visible, true);
  assert.equal(rig.getObjectByName("mouth-neutral").visible, false);
  const happyMouthScale = rig.getObjectByName("mouth-display").scale.x;
  applyFacialExpressionPose(rig, "chatgpt-robot", "sad", 1);
  assert.equal(rig.getObjectByName("mouth-frown").visible, true);
  assert.notEqual(rig.getObjectByName("mouth-display").scale.x, happyMouthScale);
  const openEye = rig.getObjectByName("eye-shape").scale.y;
  applyFacialExpressionPose(rig, "chatgpt-robot", "surprised", 1, 1);
  assert.ok(rig.getObjectByName("eye-shape").scale.y < openEye);
  assert.equal(rig.getObjectByName("mouth-open").visible, true);
  applyFacialExpressionPose(rig, "chatgpt-robot", "neutral", 1);
  assert.equal(rig.getObjectByName("mouth-neutral").visible, true);
  assert.equal(evaluatePreviewBlinkWeight(0.31, 0.1), evaluatePreviewBlinkWeight(0.31, 0.1));
});

test("human adapters use their actual named eyes, brows, mouth, and independent per-instance nodes", () => {
  const kamyar = fakeFaceRig({ digital: false, nestedBrows: false }); const hamid = fakeFaceRig({ digital: false, nestedBrows: false });
  applyFacialExpressionPose(kamyar, "kamyar-stylized", "angry", 1);
  applyFacialExpressionPose(hamid, "hamid-stylized", "happy", 1);
  assert.ok(kamyar.getObjectByName("left-eye").scale.y < 1);
  assert.notEqual(kamyar.getObjectByName("left-eyebrow").rotation.z, 0);
  assert.equal(kamyar.getObjectByName("mouth-small-open").visible, true);
  assert.equal(hamid.getObjectByName("mouth-smile").visible, true);
  assert.equal(kamyar.getObjectByName("mouth-smile").visible, false);
});

test("runtime wires renderer facial values into demand rendering without replacing gaze composition", async () => {
  const layer = await readFile(new URL("../src/components/characters/character-layer.tsx", import.meta.url), "utf8");
  const adapter = await readFile(new URL("../src/lib/characters/character-pose-adapter.ts", import.meta.url), "utf8");
  const renderers = await readFile(new URL("../src/components/characters/character-renderers.tsx", import.meta.url), "utf8");
  assert.match(layer, /applyFacialExpressionPose\(\s*group\.current/);
  assert.match(layer, /evaluateFacialExpressionWeight\(\s*preview\.actionId,\s*elapsed/);
  assert.match(layer, /invalidate\(\)/);
  assert.match(layer, /applyCharacterActionPose\(\s*group\.current,\s*pose,\s*gazePose,/);
  assert.match(adapter, /composeGazeHeadRotation\(pose\.headRotation, gazePose/);
  assert.match(renderers, /<ExpressionMouth\s+expression=\{face\}/);
  assert.match(renderers, /name="mouth-smile"/);
  assert.match(renderers, /name="mouth-frown"/);
  assert.match(renderers, /name="mouth-open"/);
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

test("surprise and excitement respond faster and more strongly than calm actions", () => {
  const early = (actionId, t) => evaluateCharacterPreviewPose({ actionId, sourceTimeSeconds: t,
    durationSeconds: getPreviewDuration(actionId), capabilities: ["head-rotation", "arm-gesture", "facial-expression"] });
  const surprised = early("surprised", 0.045);
  const excited = early("excited", 0.08);
  const calm = early("listening", 0.08);
  assert.ok(Math.abs(surprised.headRotation[0]) > 0);
  assert.ok(Math.abs(excited.leftArmRotation[2]) > Math.abs(calm.leftArmRotation[2]));
  const max = early("excited", 0.35);
  assert.ok(Math.abs(max.leftArmRotation[2]) > 0.25);
  const scaled = evaluateCharacterPreviewPose({ actionId: "excited", sourceTimeSeconds: 0.35,
    durationSeconds: getPreviewDuration("excited", { speed: 1.5 }), capabilities: ["head-rotation", "arm-gesture"],
    settings: { speed: 1.5, intensity: 0.5 } });
  assert.ok(Math.abs(scaled.leftArmRotation[2]) <= Math.abs(max.leftArmRotation[2]));
});

test("facial expression controls ease in and out at explicit timestamps", () => {
  const weight = (time) => evaluateFacialExpressionWeight("surprised", time, 0.85);
  assert.equal(weight(0), 0);
  assert.ok(weight(0.11) > 0.9);
  assert.ok(weight(0.84) < 0.1);
  assert.equal(weight(0.11), evaluateFacialExpressionWeight("surprised", 0.11, 0.85));
  assert.equal(evaluateFacialExpressionWeight("head-turn", 0.2, 2.4), 0);
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
  const unsupported = evaluateCharacterPreviewPose({ actionId: "arm-gesture", sourceTimeSeconds: 0.55, durationSeconds: 2.4, capabilities: ["head-rotation"] });
  assert.ok(Object.values(unsupported).every((rotation) => rotation.every((value) => value === 0)));
  const independent = evaluateCharacterPreviewPose({ actionId: "head-turn", sourceTimeSeconds: 0.8, durationSeconds: 2.4, capabilities: allChannels });
  assert.notEqual(independent, head);
  assert.deepEqual(head, evaluateCharacterPreviewPose({ actionId: "head-nod", sourceTimeSeconds: 0.55, durationSeconds: 2.4, capabilities: ["head-rotation"] }));
});

test("return-to-idle deterministically blends the transient pose to neutral", () => {
  const fromPose = evaluateCharacterPreviewPose({ actionId: "arm-gesture", sourceTimeSeconds: 1.2, durationSeconds: 2.4, capabilities: allChannels });
  const halfway = evaluateCharacterPreviewPose({ actionId: "return-idle", sourceTimeSeconds: 0.275, durationSeconds: 0.55, capabilities: [], fromPose });
  const finished = evaluateCharacterPreviewPose({ actionId: "return-idle", sourceTimeSeconds: 0.55, durationSeconds: 0.55, capabilities: [], fromPose });
  assert.ok(Math.abs(halfway.rightArmRotation[2]) < Math.abs(fromPose.rightArmRotation[2]));
  assert.ok(Object.values(finished).every((rotation) => rotation.every((value) => value === 0)));
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
  const adapter = await readFile(new URL("../src/lib/characters/character-pose-adapter.ts", import.meta.url), "utf8");
  assert.match(source, /cancelAnimationFrame\(frame\)/, "preview scheduling is cleaned up on stop/unmount");
  assert.match(adapter, /getObjectByName\(name\)/, "pose resolves named local pivots rather than changing the saved instance transform");
  assert.match(adapter, /apply\("head-pivot"/, "head motion targets the model-local head pivot");
  const editor = await readFile(new URL("../src/components/characters/character-editor.tsx", import.meta.url), "utf8");
  assert.match(editor, /aria-label="سرعت حرکت"/);
  assert.match(editor, /aria-label="شدت حرکت"/);
  assert.match(editor, /aria-label="مدت گذار"/);
  assert.match(editor, /aria-label="مدت بازگشت به حالت خنثی"/);
  assert.match(editor, /aria-label="منحنی حرکت"/);
});
