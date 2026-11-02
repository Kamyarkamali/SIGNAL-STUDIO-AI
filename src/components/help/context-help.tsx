"use client";

import { useEffect, useRef, useState } from "react";
import { contextHelp, type ContextHelpId } from "@/lib/help/context-help-content";

export function ContextHelpTrigger({ topic, onOpen, label }: { topic: ContextHelpId; onOpen: (topic: ContextHelpId) => void; label?: string }) {
  const title = contextHelp[topic].title;
  return <button type="button" className="context-help-trigger" aria-label={`راهنما: ${label ?? title}`} title={`راهنما: ${label ?? title}`} aria-haspopup="dialog" onClick={(event) => { event.stopPropagation(); onOpen(topic); }}>
    <span aria-hidden="true">?</span>
  </button>;
}

export function ContextHelpDrawer({ topic, onClose }: { topic: ContextHelpId | "all" | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const content = topic && topic !== "all" ? contextHelp[topic] : null;
  const topics = (Object.keys(contextHelp) as ContextHelpId[]).filter((id) => {
    const item = contextHelp[id];
    return `${item.title} ${item.purpose} ${item.when} ${item.steps.join(" ")}`.includes(query.trim());
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (topic && !dialog.open) dialog.showModal();
    if (!topic && dialog.open) dialog.close();
  }, [topic]);

  return <dialog ref={dialogRef} className="context-help-drawer" aria-labelledby="context-help-title" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {topic === "all" && <div className="flex max-h-dvh flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div><p className="text-[11px] font-semibold text-accent">مرکز راهنمای سیگنال استودیو</p><h2 id="context-help-title" className="mt-1 text-lg font-bold">راهنمای کار با برنامه</h2><p className="mt-1 text-xs text-muted">برای شروع، پروژه بسازید؛ سپس صحنه، شخصیت و دوربین تولید را تنظیم کنید.</p></div>
        <button type="button" className="context-help-close" aria-label="بستن راهنما" title="این پنل راهنما را می‌بندد و به فضای کار برمی‌گردد." onClick={onClose}>×</button>
      </header>
      <div className="border-b border-line px-5 py-3"><label className="block text-xs text-muted" htmlFor="help-search">جست‌وجوی راهنما</label><input id="help-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="مثلاً دوربین یا سکانس" title="موضوع‌های راهنما را بر اساس واژهٔ واردشده پیدا می‌کند." className="mt-1 w-full rounded-md border border-line bg-[#0d141d] px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent" /></div>
      <div className="min-h-0 overflow-y-auto px-5 py-3 text-sm leading-7">
        {topics.length === 0 && <p role="status" className="py-4 text-muted">موضوعی پیدا نشد. واژهٔ دیگری را امتحان کنید.</p>}
        {topics.map((id) => <details key={id} className="help-topic border-b border-line py-2"><summary className="flex cursor-pointer items-center justify-between gap-2 py-1 font-semibold focus-visible:outline-2 focus-visible:outline-accent"><span>{contextHelp[id].title}</span><span className={`text-[10px] ${contextHelp[id].status === "available" ? "text-emerald-300" : "text-amber-300"}`}>{contextHelp[id].status === "available" ? "در دسترس" : "آینده"}</span></summary><HelpBody content={contextHelp[id]} /></details>)}
      </div>
    </div>}
    {content && <div className="flex max-h-[min(86dvh,760px)] flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div><p className="text-[11px] font-semibold text-accent">راهنمای بخش</p><h2 id="context-help-title" className="mt-1 text-lg font-bold">{content.title}</h2><span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] ${content.status === "available" ? "border-emerald-800 bg-emerald-950/40 text-emerald-200" : "border-amber-800 bg-amber-950/40 text-amber-200"}`}>{content.status === "available" ? "در دسترس" : "برنامه‌ریزی‌شده"}</span></div>
        <button type="button" className="context-help-close" aria-label="بستن راهنما" title="بستن" onClick={onClose}>×</button>
      </header>
      <div className="min-h-0 overflow-y-auto px-5 py-4 text-sm leading-7"><HelpBody content={content} /></div>
    </div>}
  </dialog>;
}

function HelpBody({ content }: { content: (typeof contextHelp)[ContextHelpId] }) {
  return <div className="pb-3"><HelpParagraph title="این بخش چه‌کاری می‌کند؟" text={content.purpose} />
    <HelpParagraph title="چه‌وقت از آن استفاده کنم؟" text={content.when} />
    <section className="mt-4"><h3 className="font-bold text-foreground">روش استفاده</h3><ol className="mt-1 list-decimal space-y-1 pr-5 text-muted">{content.steps.map((step) => <li key={step}>{step}</li>)}</ol></section>
    <section className="mt-4"><h3 className="font-bold text-foreground">کنترل‌های اصلی</h3><ul className="mt-1 list-disc space-y-1 pr-5 text-muted">{content.controls.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <HelpParagraph title="مثال" text={content.example} /><HelpParagraph title="محدودیت‌ها و نکته‌ها" text={content.limits} /></div>;
}

function HelpParagraph({ title, text }: { title: string; text: string }) {
  return <section className="mt-4 first:mt-0"><h3 className="font-bold text-foreground">{title}</h3><p className="mt-1 text-muted">{text}</p></section>;
}
