"use client";

export function WorkspaceHeader({ projectTitle, saveStatus, onHelp }: { projectTitle?: string; saveStatus: "saved" | "dirty" | "saving" | "error"; onHelp: () => void }) {
  const statusText = { saved: "ذخیره شد", dirty: "تغییر ذخیره‌نشده", saving: "در حال ذخیره", error: "خطا در ذخیره" }[saveStatus];
  return <header className="workspace-header flex h-[56px] flex-none items-center justify-between gap-4 border-b border-line bg-[#101722] px-4 max-[650px]:h-[52px] max-[650px]:px-3" dir="rtl">
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid size-8 shrink-0 rotate-[-10deg] place-items-center rounded-lg border border-accent/70 shadow-[0_0_16px_#36d7c31c]" aria-hidden="true"><span className="size-3.5 rounded-sm border-[3px] border-accent" /></div>
      <strong className="hidden whitespace-nowrap font-[Arial,sans-serif] text-[12px] font-extrabold tracking-[1px] min-[900px]:block" lang="en" dir="ltr">SIGNAL <span className="text-accent">STUDIO</span></strong>
      <span className="h-6 w-px shrink-0 bg-line" aria-hidden="true" />
      <div className="min-w-0"><span className="block max-w-[min(42vw,340px)] truncate text-[13px] font-semibold">{projectTitle || "پروژه‌ای باز نیست"}</span>
        <span role="status" aria-live="polite" className={`flex items-center gap-1.5 text-[10px] ${saveStatus === "error" ? "text-red-300" : "text-muted"}`}><i className={`size-1.5 rounded-full ${saveStatus === "saved" ? "bg-emerald-400" : saveStatus === "error" ? "bg-red-400" : "bg-amber-300"}`} aria-hidden="true" />{statusText}</span></div>
    </div>
    <div className="flex shrink-0 items-center gap-2"><span className="hidden rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] text-muted min-[850px]:inline-flex">اجرای محلی</span><button type="button" className="header-help-button" onClick={onHelp} aria-label="مرکز راهنمای برنامه" title="مرکز راهنمای فارسی همهٔ بخش‌های برنامه را باز می‌کند."><span aria-hidden="true">?</span><span className="max-[650px]:hidden">راهنما</span></button></div>
  </header>;
}
