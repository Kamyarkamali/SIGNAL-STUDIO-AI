import { createHash, randomUUID } from "node:crypto";
import { copyFile, lstat, mkdir, open, readFile, readdir, rename, stat, unlink } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import {
  assetDirectories, projectIdSchema, projectNameSchema, projectSchema, migrateProject, newProject,
  PROJECT_MAX_BYTES, type AssetRecord, type ProjectDocument, type ProjectSummary,
} from "./project-schema.ts";
import type { EnvironmentArrangement } from "../environments/arrangement.ts";
import type { z } from "zod";
import { displayAssignmentsSchema } from "./project-schema.ts";
import type { CharacterProjectData } from "../characters/character-schema.ts";
import { createImportedCharacterModel } from "../characters/character-registry.ts";
import { validateCharacterGlbUpload, type CharacterGlbMetadata } from "../characters/character-glb.ts";

export class ProjectError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function defaultDataRoot(): string {
  const override = process.env.SIGNAL_STUDIO_DATA_DIR;
  if (override) {
    if (!isAbsolute(override)) throw new ProjectError("CONFIG", "مسیر داده باید مطلق باشد.", 500);
    return resolve(override);
  }
  if (platform() === "win32") return join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "SignalStudioAI");
  return join(process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"), "SignalStudioAI");
}

function projectId(id: string): string {
  const parsed = projectIdSchema.safeParse(id);
  if (!parsed.success) throw new ProjectError("INVALID_ID", "شناسهٔ پروژه نامعتبر است.");
  return parsed.data;
}

function projectName(name: string): string {
  const parsed = projectNameSchema.safeParse(name);
  if (!parsed.success) throw new ProjectError("INVALID_NAME", parsed.error.issues[0]?.message || "نام پروژه نامعتبر است.");
  return parsed.data;
}

function summary(project: ProjectDocument): ProjectSummary {
  const { id, title, createdAt, updatedAt, revision } = project;
  return { id, title, createdAt, updatedAt, revision };
}

export class ProjectService {
  private readonly root: string;
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(dataRoot = defaultDataRoot()) { this.root = resolve(/* turbopackIgnore: true */ dataRoot); }
  get dataRoot() { return this.root; }
  private projectsRoot() { return join(this.root, "projects"); }
  private projectDir(id: string) { return join(this.projectsRoot(), projectId(id)); }
  private projectFile(id: string) { return join(this.projectDir(id), "project.json"); }

  private async lock<T>(id: string, action: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(id) ?? Promise.resolve();
    const running = previous.catch(() => undefined).then(action);
    const settled = running.then(() => undefined, () => undefined);
    this.locks.set(id, settled);
    try { return await running; }
    finally { if (this.locks.get(id) === settled) this.locks.delete(id); }
  }

  private async ensureRoot() {
    await mkdir(this.projectsRoot(), { recursive: true });
    await mkdir(join(this.root, "trash"), { recursive: true });
  }

  private async assertProjectDirectory(id: string) {
    try {
      const info = await lstat(this.projectDir(id));
      if (!info.isDirectory() || info.isSymbolicLink()) throw new ProjectError("INVALID_DIRECTORY", "پوشهٔ پروژه نامعتبر است.", 409);
    } catch (error) {
      if (error instanceof ProjectError) throw error;
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new ProjectError("NOT_FOUND", "پروژه پیدا نشد.", 404);
      throw error;
    }
  }

  private async readProject(id: string): Promise<ProjectDocument> {
    await this.assertProjectDirectory(id);
    const file = this.projectFile(id);
    let content: string;
    try {
      const info = await lstat(file);
      if (!info.isFile() || info.isSymbolicLink() || info.size > PROJECT_MAX_BYTES) throw new ProjectError("CORRUPT", "فایل پروژه نامعتبر یا بیش از حد بزرگ است.", 422);
      content = await readFile(file, "utf8");
    } catch (error) {
      if (error instanceof ProjectError) throw error;
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new ProjectError("MISSING_FILE", "فایل پروژه پیدا نشد.", 422);
      throw error;
    }
    let value: unknown;
    try { value = JSON.parse(content); }
    catch { throw new ProjectError("CORRUPT", "فایل پروژه آسیب دیده است.", 422); }
    if (typeof value === "object" && value !== null && "schemaVersion" in value && value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3 && value.schemaVersion !== 4 && value.schemaVersion !== 5) {
      throw new ProjectError("UNSUPPORTED_VERSION", "نسخهٔ این پروژه پشتیبانی نمی‌شود؛ فایل اصلی تغییر نکرده است.", 422);
    }
    const parsed = migrateProject(value);
    if (!parsed || parsed.id !== id) throw new ProjectError("CORRUPT", "دادهٔ پروژه معتبر نیست.", 422);
    return parsed;
  }

  private async atomicWrite(file: string, project: ProjectDocument) {
    const content = JSON.stringify(project, null, 2) + "\n";
    if (Buffer.byteLength(content) > PROJECT_MAX_BYTES) throw new ProjectError("TOO_LARGE", "حجم دادهٔ پروژه بیش از حد مجاز است.", 413);
    const temporary = join(dirname(file), `.project-${randomUUID()}.tmp`);
    const handle = await open(temporary, "wx", 0o600);
    let closed = false;
    try {
      await handle.writeFile(content, "utf8");
      await handle.sync();
      await handle.close();
      closed = true;
      await rename(temporary, file);
    }
    catch (error) {
      if (!closed) await handle.close().catch(() => undefined);
      await unlink(temporary).catch(() => undefined);
      throw error;
    }
  }

  async create(name: string): Promise<ProjectDocument> {
    const title = projectName(name);
    await this.ensureRoot();
    const id = randomUUID();
    const directory = this.projectDir(id);
    await mkdir(directory);
    await mkdir(join(directory, "backups"));
    for (const folder of Object.values(assetDirectories)) await mkdir(join(directory, "assets", folder), { recursive: true });
    const project = newProject(id, title);
    await this.atomicWrite(this.projectFile(id), project);
    return project;
  }

  async list(): Promise<{ projects: ProjectSummary[]; issues: { id: string; message: string }[] }> {
    await this.ensureRoot();
    const entries = await readdir(this.projectsRoot(), { withFileTypes: true });
    const projects: ProjectSummary[] = [];
    const issues: { id: string; message: string }[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !projectIdSchema.safeParse(entry.name).success) continue;
      try { projects.push(summary(await this.readProject(entry.name))); }
      catch (error) { issues.push({ id: entry.name, message: error instanceof ProjectError ? error.message : "خواندن پروژه ممکن نیست." }); }
    }
    projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { projects, issues };
  }

  async open(id: string): Promise<ProjectDocument> { return this.readProject(projectId(id)); }

  async save(id: string, name: string, expectedRevision: number, environmentArrangement?: EnvironmentArrangement,
    displayAssignments?: z.infer<typeof displayAssignmentsSchema>, characterIdentities?: CharacterProjectData["characterIdentities"],
    characterInstances?: CharacterProjectData["characterInstances"], characterStates?: CharacterProjectData["characterStates"]): Promise<ProjectDocument> {
    id = projectId(id);
    const title = projectName(name);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new ProjectError("INVALID_REVISION", "شمارهٔ بازبینی نامعتبر است.");
    return this.lock(id, async () => {
      const current = await this.readProject(id);
      if (current.revision !== expectedRevision) throw new ProjectError("STALE_WRITE", "پروژه در جای دیگری تغییر کرده است؛ دوباره آن را باز کنید.", 409);
      const arrangement = environmentArrangement ?? current.environmentArrangement;
      const displays = displayAssignments ?? current.displayAssignments;
      const identities = characterIdentities ?? current.characterIdentities;
      const instances = characterInstances ?? current.characterInstances;
      const states = characterStates ?? current.characterStates;
      const raw = JSON.parse(await readFile(this.projectFile(id), "utf8")) as { schemaVersion?: number };
      if (current.title === title && JSON.stringify(current.environmentArrangement) === JSON.stringify(arrangement) &&
        JSON.stringify(current.displayAssignments) === JSON.stringify(displays) &&
        JSON.stringify(current.characterIdentities) === JSON.stringify(identities) &&
        JSON.stringify(current.characterInstances) === JSON.stringify(instances) &&
        JSON.stringify(current.characterStates) === JSON.stringify(states) && raw.schemaVersion === 5) return current;
      const updated = projectSchema.parse({ ...current, title, environmentArrangement: arrangement, displayAssignments: displays,
        characterIdentities: identities, characterInstances: instances, characterStates: states,
        revision: current.revision + 1, updatedAt: new Date().toISOString() });
      const backup = join(this.projectDir(id), "backups", `revision-${current.revision}-${randomUUID()}.json`);
      await copyFile(this.projectFile(id), backup, constants.COPYFILE_EXCL);
      await this.atomicWrite(this.projectFile(id), updated);
      return updated;
    });
  }

  async importCharacterModel(id: string, input: { name: string; heightMeters: number; rotationRadians: number; seatingOffsetY: number; inspection: CharacterGlbMetadata }, bytes: Uint8Array): Promise<ProjectDocument> {
    id = projectId(id);
    if (!bytes.length || bytes.length > 64 * 1024 * 1024) throw new ProjectError("INVALID_MODEL", "حجم فایل مدل باید کمتر از ۶۴ مگابایت باشد.", 413);
    try {
      const copy = new Uint8Array(bytes);
      validateCharacterGlbUpload(copy.buffer);
    } catch { throw new ProjectError("INVALID_MODEL", "فایل GLB معتبر نیست یا بافت‌ها و داده‌های آن درون فایل قرار ندارند.", 415); }
    return this.lock(id, async () => {
      const current = await this.readProject(id);
      const assetId = randomUUID();
      let definition;
      try {
        definition = createImportedCharacterModel({ assetId, projectId: id, displayName: input.name.trim(), heightMeters: input.heightMeters,
          rotationRadians: input.rotationRadians, seatingOffsetY: input.seatingOffsetY, inspection: input.inspection });
      } catch { throw new ProjectError("INVALID_MODEL_CONFIG", "تنظیمات مدل یا اطلاعات خوانده‌شدهٔ آن معتبر نیست.", 422); }
      const relativePath = `assets/${assetDirectories["character-model"]}/${assetId}.glb`;
      const target = join(this.projectDir(id), ...relativePath.split("/"));
      await mkdir(dirname(target), { recursive: true });
      const asset: AssetRecord = { id: assetId, kind: "character-model", displayName: definition.displayName, mediaType: "model/gltf-binary", relativePath,
        fileSizeBytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), origin: "imported", characterModel: definition };
      const updated = projectSchema.parse({ ...current, assetManifest: { ...current.assetManifest, [assetId]: asset }, revision: current.revision + 1, updatedAt: new Date().toISOString() });
      const backup = join(this.projectDir(id), "backups", `revision-${current.revision}-${randomUUID()}.json`);
      await copyFile(this.projectFile(id), backup, constants.COPYFILE_EXCL);
      const handle = await open(target, "wx", 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); } catch (error) { await handle.close(); await unlink(target).catch(() => undefined); throw error; }
      await handle.close();
      try { await this.atomicWrite(this.projectFile(id), updated); } catch (error) { await unlink(target).catch(() => undefined); throw error; }
      return updated;
    });
  }

  async removeCharacterModel(id: string, assetId: string): Promise<ProjectDocument> {
    id = projectId(id);
    if (!/^[0-9a-f-]{36}$/.test(assetId)) throw new ProjectError("NOT_FOUND", "مدل پیدا نشد.", 404);
    return this.lock(id, async () => {
      const current = await this.readProject(id);
      const asset = current.assetManifest[assetId];
      if (!asset || asset.kind !== "character-model" || !asset.characterModel) throw new ProjectError("NOT_FOUND", "مدل واردشده پیدا نشد.", 404);
      if (Object.values(current.characterIdentities).some((identity) => identity.modelId === asset.characterModel!.id)) throw new ProjectError("MODEL_IN_USE", "این مدل در یک یا چند هویت استفاده می‌شود؛ ابتدا هویت‌ها را به مدل دیگری تغییر دهید.", 409);
      const path = await this.resolveAssetFile(id, asset);
      const assetManifest = { ...current.assetManifest }; delete assetManifest[assetId];
      const updated = projectSchema.parse({ ...current, assetManifest, revision: current.revision + 1, updatedAt: new Date().toISOString() });
      const backup = join(this.projectDir(id), "backups", `revision-${current.revision}-${randomUUID()}.json`);
      await copyFile(this.projectFile(id), backup, constants.COPYFILE_EXCL);
      await this.atomicWrite(this.projectFile(id), updated);
      await unlink(path);
      return updated;
    });
  }

  async importDisplayAsset(id: string, name: string, mediaType: string, bytes: Uint8Array): Promise<ProjectDocument> {
    id = projectId(id);
    const formats = {
      "image/png": { kind: "display-image", ext: "png", valid: Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
      "image/jpeg": { kind: "display-image", ext: "jpg", valid: bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 },
      "image/webp": { kind: "display-image", ext: "webp", valid: Buffer.from(bytes).toString("ascii", 0, 4) === "RIFF" && Buffer.from(bytes).toString("ascii", 8, 12) === "WEBP" },
      "video/mp4": { kind: "display-video", ext: "mp4", valid: Buffer.from(bytes).toString("ascii", 4, 8) === "ftyp" },
      "video/webm": { kind: "display-video", ext: "webm", valid: bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3 },
    } as const;
    const format = formats[mediaType as keyof typeof formats];
    if (!format?.valid || bytes.length === 0 || bytes.length > 64 * 1024 * 1024) {
      throw new ProjectError("INVALID_MEDIA", "فرمت یا اندازهٔ رسانه پشتیبانی نمی‌شود. تصویر PNG/JPEG/WebP یا ویدیوی MP4/WebM تا ۶۴ مگابایت انتخاب کنید.", 415);
    }
    return this.lock(id, async () => {
      const current = await this.readProject(id);
      const assetId = randomUUID();
      const relativePath = `assets/${assetDirectories[format.kind]}/${assetId}.${format.ext}`;
      const target = join(this.projectDir(id), ...relativePath.split("/"));
      await mkdir(dirname(target), { recursive: true });
      const asset: AssetRecord = { id: assetId, kind: format.kind, displayName: name.slice(0, 120) || "رسانهٔ نمایشگر",
        mediaType, relativePath, fileSizeBytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), origin: "imported" };
      const updated = projectSchema.parse({ ...current, assetManifest: { ...current.assetManifest, [assetId]: asset },
        revision: current.revision + 1, updatedAt: new Date().toISOString() });
      const backup = join(this.projectDir(id), "backups", `revision-${current.revision}-${randomUUID()}.json`);
      await copyFile(this.projectFile(id), backup, constants.COPYFILE_EXCL);
      const handle = await open(target, "wx", 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); }
      catch (error) { await handle.close(); await unlink(target).catch(() => undefined); throw error; }
      await handle.close();
      try { await this.atomicWrite(this.projectFile(id), updated); }
      catch (error) { await unlink(target).catch(() => undefined); throw error; }
      return updated;
    });
  }

  async duplicate(id: string): Promise<ProjectDocument> {
    const source = await this.open(id);
    const sources = await Promise.all(Object.values(source.assetManifest).map((asset) => this.resolveAssetFile(source.id, asset)));
    const suffix = " - کپی";
    const duplicate = await this.create(`${source.title.slice(0, 80 - suffix.length).trimEnd()}${suffix}`);
    // Phase 02 has no asset import UI. Preserve future references with independent bytes.
    try {
      for (const [index, asset] of Object.values(source.assetManifest).entries()) {
        const destination = join(this.projectDir(duplicate.id), ...asset.relativePath.split("/"));
        await copyFile(sources[index], destination, constants.COPYFILE_EXCL);
      }
      const cloned = projectSchema.parse({
        ...structuredClone(source), id: duplicate.id, title: duplicate.title, createdAt: duplicate.createdAt,
        updatedAt: duplicate.updatedAt, revision: 0,
        assetManifest: Object.fromEntries(Object.entries(source.assetManifest).map(([assetId, asset]) => [assetId, asset.characterModel ? {
          ...asset, characterModel: { ...asset.characterModel, glb: { ...asset.characterModel.glb!, url: `/api/projects/${duplicate.id}/character-assets/${assetId}` } },
        } : asset])),
      });
      await this.atomicWrite(this.projectFile(duplicate.id), cloned);
      return cloned;
    } catch (error) {
      await this.ensureRoot();
      await rename(this.projectDir(duplicate.id), join(this.root, "trash", `${duplicate.id}-${Date.now()}`)).catch(() => undefined);
      throw error;
    }
  }

  async delete(id: string, expectedRevision: number): Promise<void> {
    id = projectId(id);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new ProjectError("INVALID_REVISION", "شمارهٔ بازبینی نامعتبر است.");
    await this.lock(id, async () => {
      const project = await this.readProject(id);
      if (project.revision !== expectedRevision) throw new ProjectError("STALE_WRITE", "پروژه تغییر کرده است؛ فهرست را تازه‌سازی کنید.", 409);
      await this.ensureRoot();
      await rename(this.projectDir(id), join(this.root, "trash", `${id}-${Date.now()}`));
    });
  }

  async resolveAssetFile(id: string, asset: AssetRecord): Promise<string> {
    id = projectId(id);
    const project = await this.readProject(id);
    const registered = project.assetManifest[asset.id];
    if (!registered || registered.relativePath !== asset.relativePath) throw new ProjectError("INVALID_ASSET", "دارایی ثبت نشده است.", 404);
    const base = this.projectDir(id);
    const target = resolve(base, ...asset.relativePath.split("/"));
    if (!target.startsWith(base + sep)) throw new ProjectError("INVALID_ASSET", "مسیر دارایی نامعتبر است.");
    const segments = [join(base, "assets"), dirname(target), target];
    for (const segment of segments) {
      const info = await lstat(segment).catch(() => null);
      if (!info || info.isSymbolicLink()) throw new ProjectError("MISSING_ASSET", "فایل دارایی پیدا نشد یا امن نیست.", 422);
    }
    const info = await stat(target);
    if (!info.isFile() || info.size !== asset.fileSizeBytes) throw new ProjectError("MISSING_ASSET", "فایل دارایی معتبر نیست.", 422);
    return target;
  }
}

export const projectService = new ProjectService();
