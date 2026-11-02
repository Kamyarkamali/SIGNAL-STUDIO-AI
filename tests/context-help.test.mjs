import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { contextHelp } from "../src/lib/help/context-help-content.ts";

test("context help registry covers implemented and planned work areas with practical guidance", () => {
  const required = ["purpose", "when", "steps", "controls", "example", "limits", "status"];
  for (const [topic, content] of Object.entries(contextHelp)) {
    assert.ok(content.title, `${topic} title`);
    for (const field of required) assert.ok(content[field], `${topic}.${field}`);
    assert.ok(content.steps.length > 0, `${topic} steps`);
    assert.ok(content.controls.length > 0, `${topic} controls`);
    assert.ok(["available", "planned"].includes(content.status), `${topic} status`);
  }
  for (const topic of ["audio", "dialogue", "behaviors", "camera", "export", "settings"]) assert.equal(contextHelp[topic].status, "planned");
  assert.match(contextHelp.scenes.limits, /خودکار/);
  assert.match(contextHelp.gaze.limits, /پذیرفته/);
});

test("context help uses accessible triggers and a native keyboard-dismissible drawer", async () => {
  const trigger = await readFile(new URL("../src/components/help/context-help.tsx", import.meta.url), "utf8");
  const navigation = await readFile(new URL("../src/components/navigation/workspace-navigation.tsx", import.meta.url), "utf8");
  const shell = await readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8");
  assert.match(trigger, /aria-haspopup="dialog"/);
  assert.match(trigger, /showModal\(\)/);
  assert.match(trigger, /onClose=\{onClose\}/);
  assert.match(navigation, /ContextHelpTrigger[\s\S]*?topic=\{item\.id === "animations" \? "timelineActions" : item\.id as ContextHelpId\}/);
  assert.match(shell, /<ContextHelpDrawer topic=\{helpTopic\}/);
  assert.match(shell, /onHelp=\{\(\) => setHelpTopic\("all"\)\}/);
  assert.match(trigger, /topic === "all"/);
  assert.match(trigger, /type="search"/);
  assert.match(trigger, /<details key=\{id\}/);
});

test("layout controls remain editor-only and restore bounded default panel sizes", async () => {
  const { clampWorkspaceDimension } = await import("../src/lib/layout/workspace-layout.ts");
  assert.equal(clampWorkspaceDimension(-20, 250, 440), 250);
  assert.equal(clampWorkspaceDimension(800, 250, 440), 440);
  assert.equal(clampWorkspaceDimension(312.4, 250, 440), 312);
  assert.equal(clampWorkspaceDimension(Number.NaN, 250, 440), 250);
});
