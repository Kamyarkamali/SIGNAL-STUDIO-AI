import { test, expect } from "@playwright/test";

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

function makeWavBuffer(durationSeconds: number) {
  const dataLength = 32_000 * durationSeconds;
  const bytes = Buffer.alloc(44 + dataLength);
  bytes.write("RIFF", 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVE", 8);
  bytes.write("fmt ", 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(16_000, 24); bytes.writeUInt32LE(32_000, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write("data", 36); bytes.writeUInt32LE(dataLength, 40);
  return bytes;
}

test("workspace renders at target sizes without page-level horizontal overflow or runtime errors", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} (${request.failure()?.errorText ?? "failed"})`));

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const response = await page.goto("/");
    expect(response?.ok(), `HTTP response at ${viewport.width}×${viewport.height}`).toBeTruthy();
    await expect(page.locator("main")).toBeVisible();
    await page.waitForTimeout(1_200);
    const dimensions = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth }));
    expect(dimensions.documentWidth, `document overflow at ${viewport.width}×${viewport.height}`).toBeLessThanOrEqual(dimensions.width);
    await page.screenshot({ path: testInfo.outputPath(`workspace-${viewport.width}x${viewport.height}.png`), fullPage: true });
    if (viewport.width <= 1023) {
      const navigation = page.locator(".workspace-navigation");
      const picker = navigation.getByRole("combobox", { name: "انتخاب بخش فضای کار" });
      await expect(picker).toBeVisible();
      await expect(navigation.locator("[data-mobile-navigation]")).toHaveAttribute("dir", "rtl");
      const navigationWidths = await navigation.evaluate((element) => ({ scroll: element.scrollWidth, visible: element.clientWidth }));
      expect(navigationWidths.scroll).toBeLessThanOrEqual(navigationWidths.visible);
      await picker.focus();
      await expect(picker).toBeFocused();
      await page.keyboard.press("Tab");
      const sectionHelp = navigation.locator("[data-mobile-navigation] button");
      await expect(sectionHelp).toBeFocused();
      await expect(sectionHelp).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("Shift+Tab");
      await expect(picker).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(picker).toHaveValue("scenes");
      if (viewport.width <= 767) {
        const closeInspector = page.locator("[data-close-mobile-inspector]");
        await expect(closeInspector).toBeFocused();
        await closeInspector.click();
        await expect(picker).toBeFocused();
      }
      await picker.selectOption("projects");
      await expect(picker).toHaveValue("projects");
      await expect(navigation.getByRole("button", { name: /راهنما: انتخاب بخش فضای کار/ })).toBeVisible();
    }
  }

  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("audio editor survives empty library, scene changes, clip deletion, and final asset deletion", async ({ page, request }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const title = `Audio crash E2E ${Date.now()}`;
  try {
    await page.goto("/");
    await page.locator(".workspace-navigation .workspace-nav-link").nth(5).click();
    await expect(page.getByText("برای مدیریت صدا، ابتدا یک پروژه باز کنید.")).toBeVisible();
    expect(pageErrors).toEqual([]);

    await page.locator(".workspace-navigation .workspace-nav-link").first().click();
    await page.getByRole("button", { name: /پروژهٔ جدید|پروژه جدید/ }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog.getByLabel("نام پروژه").fill(title);
    await createDialog.getByRole("button", { name: "ساخت پروژه" }).click();
    await page.locator(".workspace-navigation .workspace-nav-link").nth(5).click();
    await expect(page.getByText(/هنوز فایلی وارد نشده است/)).toBeVisible();
    await expect(page.locator("#audio-asset")).toHaveCount(0);
    expect(pageErrors).toEqual([]);

    await page.locator(".workspace-navigation .workspace-nav-link").nth(1).click();
    const addScene = page.getByRole("button", { name: /\+ صحنه/ });
    await addScene.click();
    await addScene.click();
    const sceneTargets = page.locator("[data-scene-drop-target]");
    await expect(sceneTargets).toHaveCount(2);
    await page.locator(".workspace-navigation .workspace-nav-link").nth(5).click();
    await page.locator('input[type="file"][aria-label^="افزودن و اتصال فایل صوتی به سکانس"]').setInputFiles({
      name: "crash-repro.wav", mimeType: "audio/wav", buffer: makeWavBuffer(2),
    });
    await expect(page.locator("#audio-asset option")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "حذف کلیپ" })).toHaveCount(1);
    expect(pageErrors).toEqual([]);

    await sceneTargets.first().click();
    await page.locator(".workspace-navigation .workspace-nav-link").nth(5).click();
    await expect(page.locator("#audio-asset")).toBeVisible();
    await sceneTargets.nth(1).click();
    await page.locator(".workspace-navigation .workspace-nav-link").nth(5).click();
    await expect(page.locator("#audio-asset")).toBeVisible();
    expect(pageErrors).toEqual([]);

    await page.getByRole("button", { name: "حذف کلیپ" }).click();
    await expect(page.getByRole("button", { name: "حذف کلیپ" })).toHaveCount(0);
    await page.getByRole("button", { name: "حذف فایل" }).click();
    await expect(page.getByText(/هنوز فایلی وارد نشده است/)).toBeVisible();
    await expect(page.locator("#audio-asset")).toHaveCount(0);
    expect(pageErrors).toEqual([]);

    await page.reload();
    await page.locator(".workspace-navigation .workspace-nav-link").first().click();
    await page.locator("li").filter({ hasText: title }).locator("[data-project-action=open]").click();
    await page.locator(".workspace-navigation .workspace-nav-link").nth(5).click();
    await expect(page.getByText(/هنوز فایلی وارد نشده است/)).toBeVisible();
    expect(pageErrors).toEqual([]);
  } finally {
    const listing = await request.get("/api/projects");
    if (listing.ok()) {
      const body = await listing.json() as { projects: { id: string; title: string; revision: number }[] };
      const temporaryProject = body.projects.find((project) => project.title === title);
      if (temporaryProject) await request.delete(`/api/projects/${temporaryProject.id}`, { data: { expectedRevision: temporaryProject.revision } });
    }
  }
});

test("project creation and navigation are usable in the browser", async ({ page }) => {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} (${request.failure()?.errorText ?? "failed"})`));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    const players: HTMLAudioElement[] = [];
    Object.defineProperty(window, "__signalAudioPlayers", { configurable: true, value: players });
    window.Audio = new Proxy(NativeAudio, { construct(target, args, newTarget) {
      const player = Reflect.construct(target, args, newTarget) as HTMLAudioElement;
      players.push(player);
      return player;
    } });
  });
  await page.goto("/");
  await page.locator(".workspace-navigation .workspace-nav-link").first().click();
  const title = `E2E ${Date.now()}`;
  await page.getByRole("button", { name: /پروژهٔ جدید|پروژه جدید/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("نام پروژه").fill(title);
  await dialog.getByRole("button", { name: "ساخت پروژه" }).click();
  await expect(dialog).toBeHidden();
  await page.locator(".workspace-navigation .workspace-nav-link").nth(1).click();
  const addScene = page.getByRole("button", { name: /\+ صحنه/ });
  await addScene.click();
  await addScene.click();
  const sceneTargets = page.locator("[data-scene-drop-target]");
  await expect(sceneTargets).toHaveCount(2);

  await sceneTargets.nth(1).evaluate((target) => {
    const length = 64_000;
    const bytes = new Uint8Array(44 + length);
    const header = new DataView(bytes.buffer);
    header.setUint32(0, 0x52494646, false); header.setUint32(4, bytes.length - 8, true); header.setUint32(8, 0x57415645, false);
    header.setUint32(12, 0x666d7420, false); header.setUint32(16, 16, true); header.setUint16(20, 1, true);
    header.setUint16(22, 1, true); header.setUint32(24, 16_000, true); header.setUint32(28, 32_000, true);
    header.setUint16(32, 2, true); header.setUint16(34, 16, true); header.setUint32(36, 0x64617461, false); header.setUint32(40, length, true);
    const file = new File([bytes], "scene-two.wav", { type: "audio/wav" });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const bounds = target.getBoundingClientRect();
    for (const type of ["dragenter", "dragover", "drop"]) target.dispatchEvent(new DragEvent(type, {
      bubbles: true, cancelable: true, dataTransfer: transfer, clientX: bounds.left + bounds.width / 2, clientY: bounds.top + bounds.height / 2,
    }));
  });
  const clipButton = page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-two.wav"]');
  await expect(clipButton).toHaveCount(1);
  await clipButton.scrollIntoViewIfNeeded();
  const projectFrameStyle = await clipButton.getAttribute("style");
  await page.getByRole("button", { name: "بزرگ‌نمایی تایم‌لاین" }).click();
  await expect(clipButton).toHaveAttribute("style", projectFrameStyle!);
  await page.getByRole("button", { name: "کوچک‌نمایی تایم‌لاین" }).click();
  await page.locator("button[title^='مقیاس پایهٔ پروژه']").click();
  await expect(clipButton).toHaveAttribute("style", projectFrameStyle!);
  const originalTitle = await clipButton.getAttribute("title");
  const originalStyle = await clipButton.getAttribute("style");
  const clipBox = await clipButton.boundingBox();
  expect(clipBox).not.toBeNull();
  await page.mouse.move(clipBox!.x + clipBox!.width / 2, clipBox!.y + clipBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(clipBox!.x + clipBox!.width / 2 + 24, clipBox!.y + clipBox!.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => clipButton.getAttribute("style")).not.toBe(originalStyle);

  const endHandle = page.locator(".unified-timeline-tracks [data-audio-lane] > button").nth(2);
  const endBox = await endHandle.boundingBox();
  expect(endBox).not.toBeNull();
  await page.mouse.move(endBox!.x + endBox!.width / 2, endBox!.y + endBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(endBox!.x + endBox!.width / 2 - 12, endBox!.y + endBox!.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => clipButton.getAttribute("title")).not.toBe(originalTitle);

  await page.locator(".unified-timeline-tracks input[type=range]").evaluate((input: HTMLInputElement) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "450");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const playButton = page.locator("#scene-timeline-panel > section > header button").nth(3);
  await expect(playButton).toBeEnabled();
  await playButton.scrollIntoViewIfNeeded();
  await playButton.click({ timeout: 5_000 });
  await page.waitForTimeout(500);
  await page.waitForFunction(() => (window as Window & { __signalAudioPlayers?: HTMLAudioElement[] }).__signalAudioPlayers?.some((player) => player.currentTime > 0.1), null, { timeout: 8_000 });
  const playbackSync = await page.evaluate(() => {
    const player = (window as Window & { __signalAudioPlayers?: HTMLAudioElement[] }).__signalAudioPlayers?.find((item) => item.src.includes("/audio-assets/"));
    const frame = Number(document.querySelector<HTMLInputElement>(".unified-timeline-tracks input[type=range]")?.value ?? 0);
    return player ? { frame, sourceTime: player.currentTime } : null;
  });
  expect(playbackSync).not.toBeNull();
  expect(Math.abs(playbackSync!.sourceTime - Math.max(0, (playbackSync!.frame - 470) / 30))).toBeLessThan(0.35);
  await page.locator("#scene-timeline-panel > section > header button").nth(4).click();

  await page.locator(".unified-timeline-tracks input[type=range]").evaluate((input: HTMLInputElement, value: number) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, String(value));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, 475);
  await page.locator("[data-timeline-action=split]").click();
  const splitClips = page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-two.wav"]');
  await expect(splitClips).toHaveCount(2);
  await splitClips.nth(1).click({ modifiers: ["Control"] });
  await page.locator("[data-timeline-action=merge]").click();
  const mergeDialog = page.getByRole("dialog");
  await expect(mergeDialog).toBeVisible();
  await mergeDialog.locator("[data-timeline-action=merge-preserve-speakers]").click();
  await expect(splitClips).toHaveCount(1);
  await page.locator("[data-timeline-action=undo]").click();
  await expect(splitClips).toHaveCount(2);
  await page.locator("[data-timeline-action=redo]").click();
  await expect(splitClips).toHaveCount(1);
  await page.waitForTimeout(1_100);
  await page.reload();
  await page.locator(".workspace-navigation .workspace-nav-link").first().click();
  const openRow = page.locator("li").filter({ hasText: title });
  await openRow.locator("[data-project-action=open]").click();
  await page.locator(".workspace-navigation .workspace-nav-link").nth(1).click();
  await expect(splitClips).toHaveCount(1);

  await page.locator(".workspace-navigation .workspace-nav-link").nth(5).click();
  const libraryUpload = page.locator('input[type="file"][aria-label="افزودن فایل صوتی WAV یا MP3 به کتابخانهٔ پروژه"]');
  await libraryUpload.setInputFiles({ name: "scene-one.wav", mimeType: "audio/wav", buffer: makeWavBuffer(2) });
  await page.locator("details summary").filter({ hasText: "کتابخانهٔ صدا" }).click();
  const libraryAsset = page.getByRole("button", { name: /scene-one\.wav/ });
  await expect(libraryAsset).toBeVisible();
  await libraryAsset.dragTo(sceneTargets.first());
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-one.wav"], .unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-two.wav"]')).toHaveCount(2);
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-one.wav"]')).toHaveCount(1);
  await page.waitForTimeout(1_100);
  await page.reload();
  await page.locator(".workspace-navigation .workspace-nav-link").first().click();
  await page.locator("li").filter({ hasText: title }).locator("[data-project-action=open]").click();
  await page.locator(".workspace-navigation .workspace-nav-link").nth(1).click();
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-one.wav"], .unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-two.wav"]')).toHaveCount(2);
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-two.wav"]')).toHaveCount(1);
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-one.wav"]')).toHaveCount(1);
  await page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-one.wav"]').click();
  await page.getByRole("button", { name: "حذف کلیپ" }).first().click();
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-one.wav"]')).toHaveCount(0);
  await page.waitForTimeout(1_100);
  await page.reload();
  await page.locator(".workspace-navigation .workspace-nav-link").first().click();
  await page.locator("li").filter({ hasText: title }).locator("[data-project-action=open]").click();
  await page.locator(".workspace-navigation .workspace-nav-link").nth(1).click();
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-two.wav"]')).toHaveCount(1);
  await expect(page.locator('.unified-timeline-tracks [data-audio-lane] > button[aria-pressed][title*="scene-one.wav"]')).toHaveCount(0);

  await page.locator(".workspace-navigation .workspace-nav-link").first().click();
  const projectRow = page.locator("li").filter({ hasText: title });
  await projectRow.locator("[data-project-action=delete]").click();
  const deleteDialog = page.getByRole("dialog");
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.locator("button[type=submit]").click();
  await expect(page.getByText(title)).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
