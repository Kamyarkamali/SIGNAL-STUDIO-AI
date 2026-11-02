import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialWorkspacePanelState, reduceWorkspacePanelState } from "../src/components/layout/workspace-panel-state.ts";

const step = (state, action) => reduceWorkspacePanelState(state, action);

test("section navigation and scene selection lead to the relevant editing pane", () => {
  const selected = step(initialWorkspacePanelState, { type: "selection" });
  assert.deepEqual(selected, { open: true, view: "properties" });
  assert.deepEqual(step(selected, { type: "section" }), { open: true, view: "section" });
  assert.deepEqual(initialWorkspacePanelState, { open: true, view: "section" });
});

test("panel collapse, reopening and view switching retain the chosen task", () => {
  const selected = step(initialWorkspacePanelState, { type: "selection" });
  const collapsed = step(selected, { type: "toggle" });
  assert.deepEqual(collapsed, { open: false, view: "properties" });
  assert.deepEqual(step(collapsed, { type: "toggle" }), selected);
  assert.deepEqual(step(selected, { type: "view", view: "section" }), { open: true, view: "section" });
});

test("mobile panel closes independently of project and selection data", () => {
  const selected = step(initialWorkspacePanelState, { type: "selection" });
  assert.deepEqual(step(selected, { type: "viewport", mobile: true }), { open: false, view: "properties" });
  assert.deepEqual(step(selected, { type: "close" }), { open: false, view: "properties" });
  assert.deepEqual(step(selected, { type: "viewport", mobile: false }), selected);
});

test("editor layout retains the viewport, timeline and existing feature panels", () => {
  const shell = readFileSync(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(shell, /<StudioViewport[\s\S]*?<\/section>[\s\S]*?<aside\s+id="workspace-inspector"/);
  assert.match(shell, /sectionEditor[\s\S]*?propertiesEditor/);
  assert.match(shell, /<TimelinePlaceholder \/>/);
  assert.match(shell, /<CharacterEditor/);
  assert.match(shell, /<EnvironmentEditor/);
  assert.match(shell, /<ProjectManager/);
  assert.match(styles, /grid-template-columns: minmax\(0, 1fr\) clamp\(270px/);
  assert.match(styles, /\.workspace-pane\[hidden\] \{ display: none; \}/);
  assert.match(styles, /@media \(max-width: 650px\)/);
});
