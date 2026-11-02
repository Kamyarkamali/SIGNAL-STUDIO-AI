import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isElementFullscreen, toggleElementFullscreen } from "../src/components/viewport/fullscreen.ts";

test("fullscreen helper enters and exits only the requested viewport element", async () => {
  const element = {};
  const documentLike = {
    fullscreenElement: null,
    async exitFullscreen() { this.fullscreenElement = null; },
  };
  element.requestFullscreen = async () => { documentLike.fullscreenElement = element; };

  assert.equal(await toggleElementFullscreen(element, documentLike), "changed");
  assert.equal(isElementFullscreen(element, documentLike), true);
  assert.equal(await toggleElementFullscreen(element, documentLike), "changed");
  assert.equal(isElementFullscreen(element, documentLike), false);
});

test("fullscreen helper reports unsupported APIs and denied browser requests", async () => {
  assert.equal(await toggleElementFullscreen({}, { fullscreenElement: null }), "unsupported");
  const denied = { requestFullscreen: async () => { throw new Error("denied"); } };
  assert.equal(await toggleElementFullscreen(denied, { fullscreenElement: null }), "denied");
});

test("viewport follows browser fullscreen events without remounting the scene", async () => {
  const viewport = await readFile(new URL("../src/components/viewport/studio-viewport.tsx", import.meta.url), "utf8");
  assert.match(viewport, /ref=\{viewportRef\}/);
  assert.match(viewport, /addEventListener\("fullscreenchange"/);
  assert.match(viewport, /removeEventListener\("fullscreenchange"/);
  assert.match(viewport, /aria-label=\{isFullscreen \?/);
  assert.match(viewport, /role="status"/);
  assert.match(viewport, /status === "ready" && <CanvasErrorBoundary><SceneCanvas/);
  assert.doesNotMatch(viewport, /key=\{isFullscreen/);
});

test("fullscreen layout preserves the production aspect ratio and restores normal workspace sizing", async () => {
  const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
  const viewport = await readFile(new URL("../src/components/viewport/studio-viewport.tsx", import.meta.url), "utf8");
  assert.match(styles, /\.studio-viewport-card:fullscreen/);
  assert.match(styles, /width: min\(100%, calc\(\(100dvh - 120px\) \* 16 \/ 9\)\)/);
  assert.match(styles, /\.studio-viewport-card:fullscreen \.studio-viewport-preview/);
  assert.match(viewport, /aspect-video w-full/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
