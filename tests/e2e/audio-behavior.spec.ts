import { expect, test } from "@playwright/test";

function tone(seconds: number, frequency: number) {
  const sampleRate = 16_000;
  const samples = seconds * sampleRate;
  const bytes = Buffer.alloc(44 + samples * 2);
  bytes.write("RIFF", 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write("WAVE", 8);
  bytes.write("fmt ", 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36); bytes.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) bytes.writeInt16LE(Math.round(Math.sin(index * 2 * Math.PI * frequency / sampleRate) * 7000), 44 + index * 2);
  return bytes;
}

test("two speakers drive existing scene actions and preserve authored clip behaviors", async ({ page, request }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${message.text()} [${message.location().url}]`); });
  const title = `Behavior E2E ${Date.now()}`;
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator('.workspace-navigation [data-section="projects"]').click();
    await page.getByRole("button", { name: /پروژهٔ جدید|پروژه جدید/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("نام پروژه").fill(title);
    await dialog.getByRole("button", { name: "ساخت پروژه" }).click();
    await page.locator('.workspace-navigation [data-section="scenes"]').click();
    await page.getByRole("button", { name: /\+ صحنه/ }).click();
    await page.locator("[data-scene-drop-target]").first().click();

    await page.locator('.workspace-navigation [data-section="characters"]').click();
    await page.getByLabel("نام شخصیت", { exact: true }).fill("کامیار");
    await page.locator("#character-model").selectOption("character-model:kamyar");
    await page.getByRole("button", { name: "ساخت هویت" }).click();
    await page.getByRole("button", { name: "افزودن به صحنه" }).first().click();
    await page.getByLabel("نام شخصیت", { exact: true }).fill("حمید");
    await page.locator("#character-model").selectOption("character-model:hamid");
    await page.getByRole("button", { name: "ساخت هویت" }).click();
    await page.getByRole("button", { name: "افزودن به صحنه" }).last().click();

    await page.locator('.workspace-navigation [data-section="audio"]').click();
    await page.locator('input[type="file"][aria-label^="افزودن و اتصال فایل صوتی به سکانس"]').setInputFiles({ name: "kamyar.wav", mimeType: "audio/wav", buffer: tone(4, 440) });
    await page.getByRole("combobox", { name: "گویندهٔ کلیپ انتخاب‌شده" }).selectOption({ label: "کامیار" });
    const behavior = page.getByRole("region", { name: "رفتارهای همگام با صدا" });
    await expect(behavior).toBeVisible();
    await behavior.getByLabel("رفتار گوینده").selectOption("explain");
    await behavior.getByLabel("شروع در کلیپ · ثانیه").fill("1");
    await behavior.getByLabel("مدت · ثانیه").fill("1");
    await behavior.getByRole("button", { name: "افزودن رفتار" }).click();
    await behavior.getByLabel("رفتار گوینده").selectOption("thinking");
    await behavior.getByLabel("شروع در کلیپ · ثانیه").fill("2");
    await behavior.getByRole("button", { name: "افزودن رفتار" }).click();
    await behavior.getByLabel("شخصیت", { exact: true }).selectOption({ label: "حمید" });
    await behavior.getByLabel("واکنش شنونده").selectOption("gaze-character");
    await behavior.getByRole("button", { name: "افزودن رفتار" }).click();
    await expect(behavior.getByText("حرکت‌های این کلیپ (3)")).toBeVisible();
    await behavior.getByRole("button", { name: "پیش‌نمایش واکنش‌ها" }).click();
    await expect(behavior.getByText(/در این لحظه: کامیار صحبت می‌کند/)).toBeVisible();
    await page.waitForTimeout(1_200);
    await page.screenshot({ path: testInfo.outputPath("kamyar-speaking-and-hamid-listening.png"), fullPage: true });
    await page.getByRole("button", { name: "توقف" }).click();

    await page.locator('.workspace-navigation [data-section="scenes"]').click();
    await page.getByRole("button", { name: /\+ صحنه/ }).click();
    await page.locator("[data-scene-drop-target]").nth(1).click();
    await page.locator('.workspace-navigation [data-section="characters"]').click();
    await page.getByRole("button", { name: "افزودن به صحنه" }).first().click();
    await page.getByRole("button", { name: "افزودن به صحنه" }).last().click();
    await page.locator('.workspace-navigation [data-section="audio"]').click();
    await page.locator('input[type="file"][aria-label^="افزودن و اتصال فایل صوتی به سکانس"]').setInputFiles({ name: "hamid.wav", mimeType: "audio/wav", buffer: tone(4, 660) });
    await page.getByRole("combobox", { name: "گویندهٔ کلیپ انتخاب‌شده" }).selectOption({ label: "حمید" });
    await page.getByRole("region", { name: "رفتارهای همگام با صدا" }).getByRole("button", { name: "پیش‌نمایش واکنش‌ها" }).click();
    await expect(page.getByText(/در این لحظه: حمید صحبت می‌کند/)).toBeVisible();
    await page.waitForTimeout(900);
    await page.screenshot({ path: testInfo.outputPath("hamid-speaking-and-kamyar-listening.png"), fullPage: true });
    await page.getByRole("button", { name: "توقف" }).click();

    await page.reload();
    await page.locator('.workspace-navigation [data-section="projects"]').click();
    await page.locator("li").filter({ hasText: title }).locator("[data-project-action=open]").click();
    await page.locator('.workspace-navigation [data-section="scenes"]').click();
    await page.locator("[data-scene-drop-target]").first().click();
    await page.locator('.workspace-navigation [data-section="audio"]').click();
    await expect(page.locator(".unified-timeline-tracks [data-audio-lane]")).toContainText("kamyar.wav");
    await expect(page.getByRole("region", { name: "رفتارهای همگام با صدا" }).getByText("حرکت‌های این کلیپ (3)")).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    const listing = await request.get("/api/projects");
    if (listing.ok()) {
      const body = await listing.json() as { projects: { id: string; title: string; revision: number }[] };
      const temporary = body.projects.find((project) => project.title === title);
      if (temporary) await request.delete(`/api/projects/${temporary.id}`, { data: { expectedRevision: temporary.revision } });
    }
  }
});
