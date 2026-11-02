import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initialObjectEditState, lockOrbitControls, reduceObjectEditState, shouldEnterObjectEditMode } from "../src/lib/environments/object-edit-state.ts";

test("viewport single click is inert; double click enters edit only for editable objects", () => {
  let state = initialObjectEditState;
  assert.equal(shouldEnterObjectEditMode(1, true), false);
  assert.deepEqual(state, { selectedId: null, editingId: null });
  state = reduceObjectEditState(state, { type: "select", id: "prop:desk" });
  assert.deepEqual(state, { selectedId: "prop:desk", editingId: null });
  assert.equal(shouldEnterObjectEditMode(2, true), true);
  assert.equal(shouldEnterObjectEditMode(2, false), false);
  state = reduceObjectEditState(state, { type: "enter", id: "prop:desk", editable: true });
  assert.equal(state.editingId, "prop:desk");
});

test("edit-mode selection is exclusive and Escape-style finish preserves selection", () => {
  let state = reduceObjectEditState(initialObjectEditState, { type: "select", id: "prop:desk" });
  state = reduceObjectEditState(state, { type: "enter", id: "prop:desk", editable: true });
  state = reduceObjectEditState(state, { type: "select", id: "prop:chair" });
  assert.deepEqual(state, { selectedId: "prop:chair", editingId: null });
  state = reduceObjectEditState(state, { type: "enter", id: "prop:chair", editable: true });
  state = reduceObjectEditState(state, { type: "finish" });
  assert.deepEqual(state, { selectedId: "prop:chair", editingId: null });
});

test("a genuine empty-space click clears selection and edit mode", () => {
  let state = reduceObjectEditState(initialObjectEditState, { type: "select", id: "prop:desk" });
  state = reduceObjectEditState(state, { type: "enter", id: "prop:desk", editable: true });
  state = reduceObjectEditState(state, { type: "select", id: null });
  assert.deepEqual(state, { selectedId: null, editingId: null });
});

test("double-clicking another prop switches directly to its edit mode", () => {
  let state = reduceObjectEditState(initialObjectEditState, { type: "select", id: "prop:desk" });
  state = reduceObjectEditState(state, { type: "enter", id: "prop:desk", editable: true });
  state = reduceObjectEditState(state, { type: "select", id: "prop:chair" });
  state = reduceObjectEditState(state, { type: "enter", id: "prop:chair", editable: true });
  assert.deepEqual(state, { selectedId: "prop:chair", editingId: "prop:chair" });
});

test("protected objects cannot enter gizmo edit mode", () => {
  const selected = reduceObjectEditState(initialObjectEditState, { type: "select", id: "prop:room" });
  assert.deepEqual(reduceObjectEditState(selected, { type: "enter", id: "prop:room", editable: false }), selected);
});

test("OrbitControls is disabled during transform drag and restored to its prior state", () => {
  const controls = { enabled: true };
  const restore = lockOrbitControls(controls);
  assert.equal(controls.enabled, false);
  restore();
  assert.equal(controls.enabled, true);
  controls.enabled = false;
  lockOrbitControls(controls)();
  assert.equal(controls.enabled, false);
});

test("temporary edit-mode state is absent from project schema and only prop transforms persist", async () => {
  const { arrangementSchema, defaultArrangement, updateProp } = await import("../src/lib/environments/arrangement.ts");
  const arrangement = defaultArrangement();
  const desk = arrangement.props.find((item) => item.id === "studio-01:desk");
  const moved = updateProp(arrangement, desk.id, { transform: { ...desk.transform, position: [0.1, 0, 0] } });
  const parsed = arrangementSchema.parse(moved);
  assert.deepEqual(parsed.props.find((item) => item.id === desk.id).transform.position, [0.1, 0, 0]);
  assert.equal("editingId" in parsed, false);
  assert.equal("objectEdit" in parsed, false);
});

test("viewport wiring gates prop gizmos on edit mode while preserving character gizmos", async () => {
  const [props, characters, panel, canvas, shell, fiberEvents] = await Promise.all([
    readFile(new URL("../src/components/viewport/environments/studio-environment.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/characters/character-layer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/environment-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/scene-canvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../node_modules/@react-three/fiber/dist/events-e51d7528.esm.js", import.meta.url), "utf8"),
  ]);
  assert.match(props, /editing && selected && definition\.editable !== false && <TransformControls/);
  assert.match(props, /editing && selected && outline && <mesh/, "selection alone must not show bounding wireframes");
  assert.doesNotMatch(props, /\{selected && outline &&/);
  assert.match(props, /onClick=\{\(event\) => \{ event\.stopPropagation\(\); if \(definition\.editable === false\) onSelect\(null\); \}\}/);
  assert.match(props, /onDoubleClick=\{\(event\) => \{ event\.stopPropagation\(\); if \(shouldEnterObjectEditMode/);
  assert.match(props, /onMouseDown=\{\(\) => \{ dragging\.current = true/);
  assert.match(props, /onMouseUp=\{\(\) => \{ restoreOrbit\.current\?\.\(\)/);
  assert.match(characters, /showEditorHelpers && selected &&\s*\(\s*<TransformControls/);
  assert.match(canvas, /onPointerMissed=\{\(\) => onSelect\(null\)\}/);
  assert.match(fiberEvents, /if \(delta <= 2\)/, "camera drags above the R3F click threshold do not trigger empty-space deselection");
  assert.match(shell, /event\.key === "Escape" && objectEdit\.editingId[\s\S]*type: "select", id: null/);
  assert.match(panel, /onClick=\{\(\) => onSelect\(prop\.id\)\}/, "panel selection stays independent of canvas pointer events");
  for (const label of ["ویرایش وسیله", "جابه‌جایی", "چرخش", "تغییر اندازه", "پایان ویرایش"])
    assert.ok(panel.includes(label), `missing environment panel action ${label}`);
});
