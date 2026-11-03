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
  assert.match(shell, /<SceneAuthoring[\s\S]*?onSeek=\{seekTimeline\}/);
  assert.match(shell, /data-scene-id=\{activeSceneId/);
  assert.match(shell, /<CharacterEditor/);
  assert.match(shell, /<EnvironmentEditor/);
  assert.match(shell, /<ProjectManager/);
  assert.match(styles, /grid-template-columns: minmax\(0, 1fr\) 7px var\(--inspector-width/);
  assert.match(styles, /\.workspace-pane\[hidden\] \{ display: none; \}/);
  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(shell, /<WorkspaceResizeHandle\s+axis="x"/);
  assert.match(shell, /timelineHeight/);
  assert.match(shell, /<WorkspaceSettings[\s\S]*?onReset=\{\(\) =>/);
  const settings = readFileSync(new URL("../src/components/layout/workspace-settings.tsx", import.meta.url), "utf8");
  assert.match(settings, /بازنشانی چیدمان/);
});

test("inspector follows scene and object selection while Projects remains a single management view", () => {
  const shell = readFileSync(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const properties = readFileSync(new URL("../src/components/layout/properties-panel.tsx", import.meta.url), "utf8");
  assert.match(shell, /\["projects", "help", "settings"\]\.includes\(activeSection\)\) setActiveSection\("scenes"\)/);
  assert.match(shell, /setActiveSection\("characters"\);[\s\S]*?dispatchPanel\(\{ type: "selection" \}\)/);
  assert.match(shell, /setActiveSection\("environments"\);[\s\S]*?dispatchPanel\(\{ type: "selection" \}\)/);
  assert.match(shell, /activeSection === "projects" \? \([\s\S]*?<ProjectManager projects=\{projects\} \/>/);
  assert.match(shell, /hidden=\{\s*!\(\s*activeSection === "camera"\s*\|\|\s*activeSection === "characters"\s*\|\|\s*activeSection === "scenes"\s*\|\|\s*activeSection === "environments"\s*\|\|\s*activeSection === "animations"\s*\)\s*\|\|\s*inspectorView !== "properties"\s*\}/);
  assert.match(shell, /topic=\{inspectorHelpTopic\}/);
  assert.match(properties, /selected\.definitionId === "prop:laptop" && project &&\s*\(\s*<details/);
  assert.match(properties, /برای ویرایش وسایل، پروژه‌ای باز کنید و به بخش محیط‌ها بروید/);
});

test("primary navigation exposes six working tools and keeps project and animation actions reachable", () => {
  const navigation = readFileSync(new URL("../src/components/navigation/workspace-navigation.tsx", import.meta.url), "utf8");
  assert.match(navigation, /primarySections: SectionId\[\] = \["scenes", "characters", "audio", "camera", "environments", "settings"\]/);
  assert.match(navigation, /utilitySections: SectionId\[\] = \["projects", "animations"\]/);
  assert.match(navigation, /data-section=\{section\}/);
  assert.match(navigation, /aria-current=\{activeSection === section \? "page"/);
  assert.match(navigation, /aria-label=\{item\.label\}/);
  assert.doesNotMatch(navigation, /primarySections[\s\S]*?"dialogue"|primarySections[\s\S]*?"export"/);
});

test("scene inspector keeps basic identity and duration ahead of advanced scene and camera controls", () => {
  const scene = readFileSync(new URL("../src/components/scenes/scene-configuration-panel.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  assert.match(scene, /view === "scene" && <>[\s\S]*?نام سکانس[\s\S]*?مدت سکانس · ثانیه/);
  assert.match(scene, /<details className="mt-3 border-t border-line pt-2"><summary[\s\S]*?تنظیمات پیشرفتهٔ محیط و شخصیت‌ها/);
  assert.match(scene, /view === "camera" && <div[\s\S]*?تنظیمات پیشرفتهٔ دوربین/);
  assert.match(shell, /view=\{activeSection === "camera" \? "camera" : "scene"\}/);
  assert.match(shell, /onDurationChange=\{updateSceneDuration\}/);
});
