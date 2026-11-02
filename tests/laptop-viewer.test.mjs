import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { defaultArrangement } from "../src/lib/environments/arrangement.ts";
import { getLaptopInspectionPose } from "../src/lib/environments/laptop-view.ts";
import { laptopVisualSpec } from "../src/lib/environments/studio-visual-spec.ts";
import { Euler, Vector3 } from "three";
import { initialLaptopViewerState, reduceLaptopViewerState } from "../src/lib/environments/laptop-viewer-state.ts";

test("laptop close-up frames the screen from the front and above in world coordinates", () => {
  const laptop = defaultArrangement().props.find((item) => item.id === "studio-01:laptop");
  assert.ok(laptop);
  const pose = getLaptopInspectionPose(laptop.transform);
  assert.equal(pose.target[0], laptop.transform.position[0]);
  assert.ok(Math.abs(pose.target[1] - 1.4779) < 0.001);
  assert.ok(Math.abs(pose.target[2] + 0.1105) < 0.001);
  assert.ok(pose.position[1] > pose.target[1], "camera is above screen center to make a top/front view");
  assert.ok(Math.hypot(pose.position[0] - pose.target[0], pose.position[1] - pose.target[1], pose.position[2] - pose.target[2]) > 0.78);
  assert.ok(Math.hypot(...pose.up) > 0.99, "camera up follows the transformed screen orientation");
});

test("laptop viewing camera faces the transformed screen and real screen/hinge/body dimensions align", () => {
  const laptop = defaultArrangement().props.find((item) => item.id === "studio-01:laptop");
  const pose = getLaptopInspectionPose(laptop.transform);
  const screenNormal = new Vector3(0, 0, 1).applyEuler(new Euler(laptopVisualSpec.screenTilt, 0, 0)).applyEuler(new Euler(...laptop.transform.rotation));
  const towardCamera = pose.position.map((value, index) => value - pose.target[index]);
  assert.ok(towardCamera[0] * screenNormal.x + towardCamera[1] * screenNormal.y + towardCamera[2] * screenNormal.z > 1.1);
  assert.equal(laptopVisualSpec.screenSurfaceSize[0] / laptopVisualSpec.screenFrameSize[0], 0.9);
  assert.ok(Math.abs(laptopVisualSpec.screenCenter[1] - laptopVisualSpec.screenFrameSize[1] / 2) < 1e-9);
  const bodyRearEdge = 0.03 - laptopVisualSpec.baseSize[2] / 2;
  assert.ok(Math.abs(bodyRearEdge - laptopVisualSpec.hingeZ) <= 0.02, "hinges meet the base at its rear edge");
  assert.ok(Math.abs(laptopVisualSpec.screenTilt) < 0.3, "screen stays near upright at a natural open angle");
});

test("fullscreen laptop viewer state opens, follows fullscreen events, and closes cleanly", () => {
  const opened = reduceLaptopViewerState(initialLaptopViewerState, { type: "open" });
  assert.deepEqual(opened, { open: true, fullscreen: false, message: null, mode: "device" });
  const screen = reduceLaptopViewerState(opened, { type: "mode", value: "screen" });
  const fullscreenScreen = reduceLaptopViewerState(screen, { type: "fullscreen", value: true });
  assert.equal(fullscreenScreen.mode, "screen", "fullscreen transitions preserve the selected viewing mode");
  assert.equal(reduceLaptopViewerState(fullscreenScreen, { type: "fullscreen", value: false }).mode, "screen");
  const fullscreen = reduceLaptopViewerState(opened, { type: "fullscreen", value: true });
  assert.equal(fullscreen.open, true);
  assert.equal(fullscreen.fullscreen, true);
  assert.deepEqual(reduceLaptopViewerState(fullscreen, { type: "close" }), initialLaptopViewerState);
});

test("inspection camera restores position, orientation, up vector, target, and FOV; viewer leaves camera alone", async () => {
  const [canvas, viewer, editor, css, laptop] = await Promise.all([
    readFile(new URL("../src/components/viewport/scene-canvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/laptop-display-viewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/display-editor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/environments/studio-details.tsx", import.meta.url), "utf8"),
  ]);
  const inspection = canvas.slice(canvas.indexOf("function InspectionCamera"), canvas.indexOf("function ContextLossMonitor"));
  assert.match(inspection, /position: Vector3; quaternion: typeof camera\.quaternion; up: Vector3; target: Vector3/);
  assert.match(inspection, /camera\.position\.copy\(saved\.current\.position\); camera\.quaternion\.copy\(saved\.current\.quaternion\)/);
  assert.match(inspection, /camera\.up\.copy\(saved\.current\.up\)/);
  assert.doesNotMatch(inspection, /camera\.fov\s*=/, "laptop inspection preserves the editor FOV; production-camera preview is a separate controller");
  assert.match(viewer, /toggleElementFullscreen\(dialog, document\)/);
  assert.doesNotMatch(viewer, /camera\./, "the media dialog does not mutate editor or production camera state");
  assert.match(viewer, /fullscreenchange/);
  assert.doesNotMatch(viewer, /if \(wasFullscreen\.current && !fullscreen && dialog\?\.open\) dialog\.close\(\)/, "Escape from fullscreen keeps the viewer open and preserves its selected mode");
  assert.match(viewer, /<video key=\{mediaUrl\} src=\{mediaUrl\} autoPlay=\{playing\} controls/);
  assert.match(viewer, /<Image src=\{mediaUrl\}/);
  assert.match(viewer, /value=\{state\.mode\}/);
  assert.match(viewer, /نمای دستگاه/);
  assert.match(viewer, /تمرکز روی صفحه/);
  assert.match(viewer, /محتوا فقط/);
  assert.match(viewer, /aspectRatio: String\(screenAspect\)/);
  assert.match(viewer, /aspectRatio: String\(frameAspect\)/);
  assert.match(viewer, /laptop-hinge/);
  assert.match(viewer, /laptop-device-keyboard/);
  assert.match(viewer, /toggleElementFullscreen\(dialog, document\)/);
  assert.match(css, /\.laptop-screen-bezel/);
  assert.match(css, /\.laptop-screen-bezel\s*\{[^}]*width:\s*100%/);
  assert.match(css, /\.laptop-screen-bezel\s*\{[^}]*aspect-ratio:\s*0\.9\s*\/\s*0\.47/);
  assert.match(css, /\.laptop-screen-media\s*\{[^}]*width:\s*90%[^}]*height:\s*81\.28%/);
  assert.match(css, /\.laptop-device-keyboard/);
  assert.match(css, /\.laptop-content-only/);
  assert.match(editor, /<LaptopDisplayViewer project=\{project\} assignment=\{assignment\} playing=\{playing\}/);
  assert.match(css, /laptop-display-viewer:fullscreen/);
  assert.match(laptop, /<DisplaySurface assignment=\{assignment\} url=\{url\} playing=\{playing\}/);
});

test("device-framed presentation retains the 3D laptop while hiding helpers temporarily", async () => {
  const [viewport, canvas, props, characters, shell] = await Promise.all([
    readFile(new URL("../src/components/viewport/studio-viewport.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/scene-canvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/viewport/environments/studio-environment.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/characters/character-layer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/layout/editor-shell.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(viewport, /showEditorHelpers && !isFullscreen && !laptopPresentation && !laptopContentViewerOpen/);
  assert.match(viewport, /setShowEditorHelpers\(\(visible\) => !visible\)/);
  assert.match(viewport, /previousInspection\.current = inspectPropId/);
  assert.match(viewport, /onInspectChange\(previousInspection\.current\)/);
  assert.match(viewport, /prop\.id\.endsWith\(\":laptop\"\)/);
  assert.match(viewport, /document\.fullscreenElement !== viewport/);
  assert.match(canvas, /showEditorHelpers=\{showEditorHelpers\}/);
  assert.match(props, /showEditorHelpers && editing && selected && outline/);
  assert.match(props, /showEditorHelpers && editing && selected && definition\.editable !== false && <TransformControls/);
  assert.match(props, /\(!showEditorHelpers \|\| !editing\) && dragging\.current/);
  assert.match(props, /restoreOrbit\.current\?\.\(\);\s*restoreOrbit\.current = null;\s*commit\(\)/);
  assert.match(characters, /showEditorHelpers && selected &&\s*\(\s*<TransformControls/);
  assert.match(characters, /showEditorHelpers && selected &&\s*\(\s*<mesh/);
  assert.match(shell, /onInspectChange=\{setInspectPropId\}/);
  assert.match(shell, /laptopContentViewerOpen=\{laptopContentViewerOpen\}/);
  assert.match(shell, /onLaptopViewerOpenChange=\{setLaptopContentViewerOpen\}/);
  const contentViewer = await readFile(new URL("../src/components/viewport/laptop-display-viewer.tsx", import.meta.url), "utf8");
  assert.match(contentViewer, /onOpenChange\(true\)/);
  assert.match(contentViewer, /onOpenChange\(false\)/);
  assert.match(viewport, /setLaptopPresentation\(false\)/, "leaving presentation restores normal editor state");
});
