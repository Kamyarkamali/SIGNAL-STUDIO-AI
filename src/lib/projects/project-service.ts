import { randomUUID } from "node:crypto";
import { copyFile, lstat, mkdir, open, readFile, readdir, rename, stat, unlink } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import {
  assetDirectories, projectIdSchema, projectNameSchema, projectSchema, newProject,
  PROJECT_MAX_BYTES, type AssetRecord, type ProjectDocument, type ProjectSummary,
} from "./project-schema.ts";

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
    if (typeof value === "object" && value !== null && "schemaVersion" in value && value.schemaVersion !== 1) {
      throw new ProjectError("UNSUPPORTED_VERSION", "نسخهٔ این پروژه پشتیبانی نمی‌شود؛ فایل اصلی تغییر نکرده است.", 422);
    }
    const parsed = projectSchema.safeParse(value);
    if (!parsed.success || parsed.data.id !== id) throw new ProjectError("CORRUPT", "دادهٔ پروژه معتبر نیست.", 422);
    return parsed.data;
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

  async save(id: string, name: string, expectedRevision: number): Promise<ProjectDocument> {
    id = projectId(id);
    const title = projectName(name);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new ProjectError("INVALID_REVISION", "شمارهٔ بازبینی نامعتبر است.");
    return this.lock(id, async () => {
      const current = await this.readProject(id);
      if (current.revision !== expectedRevision) throw new ProjectError("STALE_WRITE", "پروژه در جای دیگری تغییر کرده است؛ دوباره آن را باز کنید.", 409);
      if (current.title === title) return current;
      const updated = projectSchema.parse({ ...current, title, revision: current.revision + 1, updatedAt: new Date().toISOString() });
      const backup = join(this.projectDir(id), "backups", `revision-${current.revision}-${randomUUID()}.json`);
      await copyFile(this.projectFile(id), backup, constants.COPYFILE_EXCL);
      await this.atomicWrite(this.projectFile(id), updated);
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
