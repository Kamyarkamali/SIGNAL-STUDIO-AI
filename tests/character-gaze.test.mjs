import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { characterModelRegistry } from "../src/lib/characters/character-registry.ts";
import { characterModelDefinitionSchema } from "../src/lib/characters/character-registry.ts";
import {
  defaultGazeCapability,
  composeGazeHeadRotation,
  evaluateGazePose,
  gazePoseAt,
  neutralGazePose,
  rotateVectorByEulerXYZ,
  supportedGazeCapability,
  transformGazePoint,
} from "../src/lib/characters/gaze-preview.ts";

test("gaze capability metadata follows implemented model pivots, not model names", () => {
  const kamyar = characterModelRegistry.get("character-model:kamyar");
  const chatgpt = characterModelRegistry.get("character-model:chatgpt-robot");
  const claude = characterModelRegistry.get("character-model:claude-mascot");
  const hamid = characterModelRegistry.get("character-model:hamid");
  assert.ok(kamyar && chatgpt && claude && hamid);
  assert.equal(supportedGazeCapability(kamyar)?.head, true);
  assert.equal(supportedGazeCapability(kamyar)?.eyes, false);
  assert.equal(supportedGazeCapability(chatgpt)?.eyes, true);
  assert.equal(supportedGazeCapability(claude)?.head, true);
  assert.equal(supportedGazeCapability(claude)?.eyes, false);
  assert.equal(supportedGazeCapability(hamid)?.head, true);
  assert.ok(supportedGazeCapability(chatgpt).maxYaw > supportedGazeCapability(claude).maxYaw, "head limits come from each reusable model definition");
  assert.equal(supportedGazeCapability({ ...chatgpt, glb: { url: "/mock.glb" } }), null);
  assert.equal(supportedGazeCapability({ capabilities: { animationCapabilities: [] }, attachmentPoints: [] }), null);
  assert.equal(characterModelDefinitionSchema.safeParse({ ...claude, capabilities: { ...claude.capabilities, gaze: { ...supportedGazeCapability(claude), eyes: true } } }).success, false,
    "the registry rejects declared gaze channels without matching pivots");
});

test("target resolution math respects nested scale, rotation, translation, and quaternion heading", () => {
  const point = transformGazePoint([1, 0, 0], {
    position: [0, 0, 2], rotation: [0, Math.PI / 2, 0], scale: [2, 2, 2],
    parent: { position: [3, 1, 0], rotation: [0, 0, 0], scale: [1, 2, 1] },
  });
  assert.ok(Math.abs(point[0] - 3) < 1e-8);
  assert.ok(Math.abs(point[1] - 1) < 1e-8);
  assert.ok(Math.abs(point[2]) < 1e-8);
  const forward = rotateVectorByEulerXYZ([0, 0, 1], [0, Math.PI / 2, 0]);
  assert.ok(Math.abs(forward[0] - 1) < 1e-8);
  const aimed = evaluateGazePose({ mode: "point", sourceTimeSeconds: 0.5, durationSeconds: 2, transitionSeconds: 0.4, capability: defaultGazeCapability,
    origin: [0, 0, 0], rotation: [0, 0, 0], worldQuaternion: [0, Math.SQRT1_2, 0, Math.SQRT1_2], target: [-2, 0, 0] });
  assert.ok(aimed.headRotation[1] > 0, "world target is converted into the character's local forward convention");
});

test("gaze is deterministic at arbitrary timestamps, blends from prior pose, and clamps unreachable rear targets", () => {
  const args = { mode: "point", durationSeconds: 8, transitionSeconds: 0.5, capability: defaultGazeCapability,
    origin: [0, 0, 0], rotation: [0, 0, 0], target: [0, 0, -5] };
  const early = evaluateGazePose({ ...args, sourceTimeSeconds: 0.25 });
  const later = evaluateGazePose({ ...args, sourceTimeSeconds: 1.5 });
  assert.deepEqual(evaluateGazePose({ ...args, sourceTimeSeconds: 0.25 }), early);
  assert.notDeepEqual(early, later);
  assert.ok(Math.abs(later.headRotation[1]) <= defaultGazeCapability.maxYaw);
  assert.equal(later.reachable, false, "the unsupported rear-facing portion is reported as clamped");
  assert.deepEqual(evaluateGazePose({ ...args, sourceTimeSeconds: 0.5, target: [NaN, Infinity, 0] }), { ...neutralGazePose, reachable: false });
  assert.deepEqual(evaluateGazePose({ mode: "camera", sourceTimeSeconds: 1, durationSeconds: 5, transitionSeconds: 0.5, capability: defaultGazeCapability,
    origin: [0, 0, 0], rotation: [0, 0, 0] }), { ...neutralGazePose, reachable: false });
});

test("eye offsets are active only for a model with independent eye pivots and each preview remains independent", () => {
  const chatgpt = supportedGazeCapability(characterModelRegistry.get("character-model:chatgpt-robot"));
  const human = supportedGazeCapability(characterModelRegistry.get("character-model:hamid"));
  assert.ok(chatgpt && human);
  const towardRight = { mode: "point", sourceTimeSeconds: 0.6, durationSeconds: 5, transitionSeconds: 0.2, origin: [0, 0, 0], rotation: [0, 0, 0], target: [2, 0, 3] };
  const robotPose = evaluateGazePose({ ...towardRight, capability: chatgpt });
  const humanPose = evaluateGazePose({ ...towardRight, capability: human });
  assert.ok(robotPose.eyeOffset[0] > 0);
  assert.deepEqual(humanPose.eyeOffset, [0, 0]);
  assert.notDeepEqual(robotPose, humanPose);
  const gesture = [0.2, 0.15, 0];
  const composed = composeGazeHeadRotation(gesture, robotPose, chatgpt);
  assert.ok(Math.abs(composed[1]) <= chatgpt.maxYaw);
  assert.notDeepEqual(composed, gesture, "gaze shares the head pivot additively with gestures under safe limits");
  const perInstance = { "instance:one": robotPose, "instance:two": humanPose };
  assert.notDeepEqual(perInstance["instance:one"], perInstance["instance:two"]);
});

test("attention previews target the selected object, ease back to neutral, and invalid targets fall back safely", () => {
  const base = { mode: "attention", attention: "curious", attentionTargetKind: "camera", sourceTimeSeconds: 0.4,
    durationSeconds: 2, transitionSeconds: 0.35, capability: defaultGazeCapability, origin: [0, 0, 0], rotation: [0, 0, 0], target: [2, 0, 3] };
  const focused = evaluateGazePose(base);
  assert.notDeepEqual(focused.headRotation, [0, 0, 0]);
  const returned = evaluateGazePose({ ...base, sourceTimeSeconds: 2 });
  assert.deepEqual(returned.headRotation, [0, 0, 0]);
  const missing = evaluateGazePose({ ...base, target: undefined });
  assert.equal(missing.reachable, false);
  const preview = { mode: "direction", horizontal: -0.5, vertical: 0.1, startedAtMs: 1000, durationSeconds: 10, transitionSeconds: 0.4 };
  const pose = gazePoseAt(preview, 1.3, defaultGazeCapability);
  assert.ok(pose.headRotation[1] < 0);
  const up = evaluateGazePose({ mode: "direction", sourceTimeSeconds: 1, durationSeconds: 3, transitionSeconds: 0.2,
    capability: defaultGazeCapability, origin: [0, 0, 0], rotation: [0, 0, 0], vertical: 0.2 });
  assert.ok(up.headRotation[0] < 0, "positive UI vertical direction looks upward in the model's +Z-forward frame");
});

test("runtime resolves stable character and prop IDs, laptop display surface, and keeps gaze outside project JSON", async () => {
  const source = await readFile(new URL("../src/components/characters/character-layer.tsx", import.meta.url), "utf8");
  assert.match(source, /character-instance:\$\{preview\.targetId\}/);
  assert.match(source, /getObjectByName\("head-pivot"\)/);
  assert.match(source, /getObjectByName\("display-surface"\)/);
  assert.match(source, /new Box3\(\)\.setFromObject\(target\)/);
  assert.match(source, /getWorldQuaternion/);
  assert.match(source, /left-iris-gaze/);
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /Record<string, GazePreview>/);
  assert.match(shell, /characterGazes=\{characterGazes\}/);
  assert.doesNotMatch(shell, /gazePreview\s*:/, "temporary preview data is not declared in project data");
  assert.match(source, /gaze=\{gazes\[id\]\}/, "gaze records are independently addressed by stable instance ID");
  assert.match(source, /apply\("head-pivot", headPose\)/, "the saved instance root is not used as the animated pivot");
});
