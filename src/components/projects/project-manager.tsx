"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectSummary } from "@/lib/projects/project-client";
import { useProjects, type SaveStatus } from "./use-projects";

export type ProjectManagerState = ReturnType<typeof useProjects>;
type Modal = { kind: "create" } | { kind: "rename" | "delete"; project: ProjectSummary };

const buttonClass = "min-h-10 cursor-pointer rounded-lg border border-[#354355] bg-[#1d2939] px-3 py-2 text-sm text-foreground hover:bg-[#28394b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#65e6d7] disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = "min-h-10 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-bold text-[#061315] hover:bg-[#65e6d7] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#65e6d7] disabled:cursor-not-allowed disabled:opacity-50";
const inputClass = "min-h-11 w-full rounded-lg border border-[#536276] bg-[#101722] px-3 text-foreground outline-none focus-visible:border-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#65e6d7]";
const statusLabels: Record<SaveStatus, string> = { saved: "ذخیره شد", saving: "در حال ذخیره", dirty: "تغییرات ذخیره‌نشده", error: "خطا در ذخیره" };

function ProjectDialog({ modal, onClose, projects }: { modal: Modal; onClose: () => void; projects: ProjectManagerState }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(modal.kind === "rename" ? modal.project.title : "");
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    let success = false;
    if (modal.kind === "create") success = await projects.create(name);
    if (modal.kind === "rename") success = await projects.rename(modal.project, name);
    if (modal.kind === "delete") success = await projects.remove(modal.project);
    if (success) { dialog.current?.close(); onClose(); }
  };
  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="project-dialog-title" className="m-auto w-[min(92vw,440px)] rounded-xl border border-line bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/70">
      <form onSubmit={(event) => { void submit(event); }} className="space-y-4">
        <h2 id="project-dialog-title" className="text-lg font-bold">{modal.kind === "create" ? "پروژهٔ جدید" : modal.kind === "rename" ? "تغییر نام پروژه" : "انتقال پروژه به سطل بازیابی"}</h2>
        {projects.error && <p role="alert" className="rounded-lg border border-red-500/50 bg-red-950/40 p-2 text-sm text-red-100">{projects.error}</p>}
        {modal.kind === "delete" ? (
          <p className="text-sm leading-7 text-[#bac8d7]">پروژهٔ «{modal.project.title}» و پوشهٔ دارایی‌های آن از فهرست خارج می‌شود و در پوشهٔ بازیابی محلی نگه داشته می‌شود. این کار روی پروژه‌های دیگر اثر ندارد.</p>
        ) : (
          <label className="block space-y-2 text-sm"><span>نام پروژه</span><input autoFocus className={inputClass} value={name} maxLength={80} required onChange={(event) => setName(event.target.value)} /></label>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button className={buttonClass} type="button" onClick={() => { dialog.current?.close(); onClose(); }}>انصراف</button>
          <button className={modal.kind === "delete" ? `${buttonClass} border-red-500/60 text-red-200` : primaryClass} type="submit" disabled={projects.busy || (modal.kind !== "delete" && !name.trim())}>{modal.kind === "create" ? "ساخت پروژه" : modal.kind === "rename" ? "ثبت نام" : "انتقال به سطل بازیابی"}</button>
        </div>
      </form>
    </dialog>
  );
}

export function ProjectManager({ projects }: { projects: ProjectManagerState }) {
  const [modal, setModal] = useState<Modal | null>(null);
  const date = (timestamp: string) => new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
  return (
    <section className="section-background min-h-[180px] rounded-xl border border-line px-[23px] py-[19px] max-[650px]:p-[15px]" aria-labelledby="section-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><span className="text-xs font-extrabold text-[#55d8c7]">مدیریت محلی / فاز ۰۲</span><h1 className="mt-0.5 text-[21px] font-bold" id="section-title">پروژه‌ها</h1></div>
        <div className="flex flex-wrap gap-2"><button className={buttonClass} type="button" disabled={projects.busy} onClick={() => { projects.setError(""); void projects.refresh().catch((cause: unknown) => projects.setError(cause instanceof Error ? cause.message : "خطا در خواندن فهرست")); }}>تازه‌سازی</button><button className={primaryClass} type="button" disabled={projects.busy} onClick={() => { projects.setError(""); setModal({ kind: "create" }); }}>پروژهٔ جدید</button></div>
      </div>
      {projects.error && <div role="alert" className="mt-4 rounded-lg border border-red-500/50 bg-red-950/40 p-3 text-sm text-red-100">{projects.error}</div>}
      {projects.list.issues.length > 0 && <div role="alert" className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-100">{projects.list.issues.length} پروژه به دلیل فایل آسیب‌دیده یا نسخهٔ پشتیبانی‌نشده نمایش داده نشد. فایل‌های اصلی تغییر نکرده‌اند.</div>}
      {projects.active && <div className="mt-5 rounded-xl border border-[#21635b] bg-[#153535]/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">پروژهٔ باز: {projects.active.title}</h2><span role="status" aria-live="polite" className={`text-sm ${projects.saveStatus === "error" ? "text-red-200" : projects.saveStatus === "saved" ? "text-accent" : "text-amber-200"}`}>{statusLabels[projects.saveStatus]}</span></div>
        <label className="mt-3 block space-y-2 text-sm"><span>نام پروژه</span><input className={inputClass} value={projects.draftName} maxLength={80} onChange={(event) => projects.editName(event.target.value)} /></label>
        <p className="mt-2 text-xs text-[#bac8d7]">تغییر نام پس از مکث کوتاه به‌طور خودکار ذخیره می‌شود. می‌توانید آن را فوراً هم ذخیره کنید.</p>
        <div className="mt-3 flex flex-wrap gap-2"><button className={primaryClass} type="button" disabled={projects.saveStatus === "saving" || projects.saveStatus === "saved" || !projects.draftName.trim()} onClick={() => { void projects.saveNow().catch(() => undefined); }}>ذخیره</button><button className={buttonClass} type="button" disabled={projects.busy || projects.saveStatus === "saving"} onClick={() => { void projects.close(); }}>بستن پروژه</button></div>
      </div>}
      <div className="mt-5">
        <h2 className="mb-3 text-sm font-bold">پروژه‌های ذخیره‌شده</h2>
        {projects.loading ? <p role="status" className="text-sm text-[#bac8d7]">در حال خواندن پروژه‌ها…</p> : projects.list.projects.length === 0 ? <p className="rounded-lg border border-dashed border-[#536276] p-5 text-sm text-[#bac8d7]">هنوز پروژه‌ای ندارید. با «پروژهٔ جدید» یک فضای خالی بسازید.</p> : (
          <ul className="grid grid-cols-1 gap-3">
            {projects.list.projects.map((project) => <li key={project.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><strong className="break-words text-sm">{project.title}</strong>{projects.active?.id === project.id && <span className="rounded-full border border-[#21635b] px-2 py-0.5 text-xs text-accent">باز است</span>}</div>
              <p className="mt-1 text-xs text-[#bac8d7]">آخرین تغییر: {date(project.updatedAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2"><button className={primaryClass} type="button" disabled={projects.busy} onClick={() => { void projects.open(project.id); }}>باز کردن</button><button className={buttonClass} type="button" disabled={projects.busy} onClick={() => { projects.setError(""); setModal({ kind: "rename", project }); }}>تغییر نام</button><button className={buttonClass} type="button" disabled={projects.busy} onClick={() => { void projects.duplicate(project); }}>تکثیر</button><button className={`${buttonClass} text-red-200`} type="button" disabled={projects.busy} onClick={() => { projects.setError(""); setModal({ kind: "delete", project }); }}>حذف</button></div>
            </li>)}
          </ul>
        )}
      </div>
      {modal && <ProjectDialog key={`${modal.kind}-${modal.kind === "create" ? "new" : modal.project.id}`} modal={modal} projects={projects} onClose={() => setModal(null)} />}
    </section>
  );
}
