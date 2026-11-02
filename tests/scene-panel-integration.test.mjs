import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("Scenes navigation is connected to the project's shared scene state and supported operations", async () => {
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../src/components/scenes/scene-management-panel.tsx", import.meta.url), "utf8");
  assert.match(shell, /activeSection === "scenes"\s*\?\s*\(\s*<SceneManagementPanel/);
  assert.match(shell, /sceneOrder=\{projects\.sceneOrder\} scenes=\{projects\.scenes\}/);
  assert.match(shell, /onCreate=\{addScene\}[\s\S]*?onDuplicate=\{cloneScene\} onDelete=\{removeScene\} onReorder=\{moveScene\}/);
  assert.match(shell, /onSelect=\{selectScene\}/);
  assert.match(shell, /setActiveSection\("scenes"\); dispatchPanel\(\{ type: "selection" \}\)/);
  assert.match(shell, /activeSceneId=\{activeSceneId\}/);
  assert.match(shell, /<SceneAuthoring[\s\S]*?onSeek=\{seekTimeline\}/);
  assert.match(panel, /ContextHelpTrigger topic="scenes"/);
  assert.match(panel, /props\.onSelect\(id\)/);
  assert.match(panel, /props\.onReorder\(moving, index\)/);
  assert.match(panel, /props\.onRename\(id, value\)/);
  assert.match(panel, /props\.onDuplicate\(id\)/);
  assert.match(panel, /props\.onDelete\(id\)/);
  assert.match(panel, /title="[^"]+"/);
});

test("Scenes navigation no longer routes to the obsolete coming-soon placeholder", async () => {
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  const sectionContent = await readFile(new URL("../src/components/layout/section-content.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(sectionContent, /امکان ساخت و مرتب‌سازی سکانس‌ها در فاز ۰۵ اضافه می‌شود/);
  assert.match(sectionContent, /مدیریت سکانس‌های پروژه/);
  assert.match(shell, /activeSection === "scenes"\s*\?\s*\(\s*<SceneManagementPanel/);
});
