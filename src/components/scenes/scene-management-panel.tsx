"use client";

import { useState } from "react";
import type { SceneDefinition } from "@/lib/scenes/scene-schema";
import { computeSceneOffsets, formatTimecode } from "@/lib/scenes/scene-time";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";

type Props = {
  canEdit: boolean;
  sceneOrder: string[];
  scenes: Record<string, SceneDefinition>;
  fps: number;
  activeSceneId: string | null;
  onHelp: (topic: ContextHelpId) => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, index: number) => void;
};

const sceneTypes: Record<NonNullable<SceneDefinition["sceneType"]>, string> = {
  dialogue: "گفت‌وگو", educational: "آموزشی", reaction: "واکنش", establishing: "معرفی فضا",
};

export function SceneManagementPanel(props: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const offsets = computeSceneOffsets(props.sceneOrder, props.scenes);
  const offsetById = new Map(offsets.map((entry) => [entry.sceneId, entry]));

  return <section className="flex h-full min-h-0 flex-col gap-2 p-2" aria-labelledby="scene-manager-title">
    <header className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5"><h2 id="scene-manager-title" className="truncate text-sm font-bold">مدیریت سکانس‌ها</h2><ContextHelpTrigger topic="scenes" onOpen={props.onHelp} /></div>
      <button type="button" disabled={!props.canEdit || props.sceneOrder.length >= 500} title="یک سکانس تازه به پروژه می‌افزاید و آن را برای ویرایش انتخاب می‌کند." className="min-h-8 shrink-0 rounded-md border border-accent bg-[#17343a] px-2 text-xs text-[#c9fff7] disabled:opacity-45" onClick={props.onCreate}>+ صحنه</button>
    </header>
    {!props.canEdit && <p className="rounded-md border border-dashed border-line p-2 text-xs leading-6 text-muted">برای ساخت و مدیریت سکانس‌ها، ابتدا یک پروژه را باز کنید.</p>}
    {props.canEdit && !props.sceneOrder.length && <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-line p-3 text-center text-xs leading-6 text-muted">هنوز سکانسی در این پروژه نیست. با «+ صحنه» اولین سکانس را بسازید؛ سپس می‌توانید محیط، شخصیت‌ها و دوربین آن را جداگانه تنظیم کنید.</div>}
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto" aria-label="فهرست سکانس‌های پروژه">
      {props.sceneOrder.map((id, index) => {
        const scene = props.scenes[id]; const timing = offsetById.get(id); if (!scene || !timing) return null;
        const selected = props.activeSceneId === id;
        return <article key={id} onDragOver={(event) => { if (!draggedId) return; event.preventDefault(); setDropIndex(index); }}
          onDrop={(event) => { event.preventDefault(); const moving = event.dataTransfer.getData("text/plain") || draggedId; if (moving) props.onReorder(moving, index); setDraggedId(null); setDropIndex(null); }}
          className={`rounded-lg border p-2 ${selected ? "border-accent bg-[#17343a]" : "border-line bg-[#121b27]"} ${dropIndex === index && draggedId !== id ? "ring-2 ring-accent" : ""} ${draggedId === id ? "opacity-50" : ""}`}>
          <div className="flex items-start gap-1.5">
            <button type="button" className="min-w-0 flex-1 text-right" aria-pressed={selected} title="این سکانس را انتخاب می‌کند و نمای صحنه و نشانگر زمان را با آن هماهنگ می‌کند." onClick={() => props.onSelect(id)}>
              <span className="block truncate text-xs font-bold">{index + 1}. {scene.name}</span>
              <span className="mt-1 block text-[10px] text-muted">{scene.sceneType ? sceneTypes[scene.sceneType] : "بدون نوع"} · شروع {formatTimecode(timing.startFrame, props.fps)} · {formatTimecode(scene.durationFrames, props.fps)}</span>
              {scene.description && <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-[#b7c6d5]">{scene.description}</span>}
            </button>
            <button type="button" draggable={props.sceneOrder.length > 1} aria-label={`جابجایی سکانس ${scene.name}`} title="برای جابجایی این سکانس بکشید؛ دکمه‌های جهت‌دار نیز برای صفحه‌کلید در دسترس‌اند." className="min-h-8 min-w-8 cursor-grab rounded border border-line px-1 text-sm active:cursor-grabbing"
              onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id); setDraggedId(id); }} onDragEnd={() => { setDraggedId(null); setDropIndex(null); }}>⠿</button>
          </div>
          <label className="mt-2 block text-[10px] text-muted">عنوان سکانس
            <input key={`${id}:${scene.name}`} className="mt-1 h-8 w-full rounded border border-line bg-[#0b111a] px-2 text-xs text-foreground" defaultValue={scene.name} maxLength={80} aria-label={`عنوان سکانس ${index + 1}`} title="نام این سکانس را در همین پروژه تغییر می‌دهد؛ با خروج از کادر ذخیره می‌شود."
              onBlur={(event) => { const value = event.currentTarget.value.trim(); if (value && value !== scene.name) props.onRename(id, value); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
          </label>
          <div className="mt-2 flex items-center justify-between gap-1 border-t border-line/70 pt-1.5">
            <div className="flex gap-1">
              <button type="button" className="min-h-8 min-w-8 rounded border border-line px-1 disabled:opacity-40" title="این سکانس را یک جایگاه به عقب می‌برد و زمان شروع را دوباره محاسبه می‌کند." aria-label={`انتقال سکانس ${scene.name} به قبل`} disabled={index === 0} onClick={() => props.onReorder(id, index - 1)}>←</button>
              <button type="button" className="min-h-8 min-w-8 rounded border border-line px-1 disabled:opacity-40" title="این سکانس را یک جایگاه به جلو می‌برد و زمان شروع را دوباره محاسبه می‌کند." aria-label={`انتقال سکانس ${scene.name} به بعد`} disabled={index === props.sceneOrder.length - 1} onClick={() => props.onReorder(id, index + 1)}>→</button>
              <button type="button" className="min-h-8 min-w-8 rounded border border-line px-1 disabled:opacity-40" title="یک نسخه مستقل از این سکانس همراه با تنظیماتش می‌سازد." aria-label={`تکثیر سکانس ${scene.name}`} disabled={props.sceneOrder.length >= 500} onClick={() => props.onDuplicate(id)}>⧉</button>
            </div>
            {deletingId === id ? <span className="flex gap-1">
              <button type="button" className="min-h-8 rounded border border-red-900 px-2 text-[10px] text-red-200" title="حذف سکانس انتخاب‌شده را تأیید می‌کند؛ شخصیت‌ها و دارایی‌های پروژه باقی می‌مانند." onClick={() => { props.onDelete(id); setDeletingId(null); }}>تأیید حذف</button>
              <button type="button" className="min-h-8 rounded border border-line px-2 text-[10px]" title="درخواست حذف را لغو می‌کند و سکانس را نگه می‌دارد." onClick={() => setDeletingId(null)}>لغو</button>
            </span> : <button type="button" className="min-h-8 min-w-8 rounded border border-line px-1 text-red-200" title="ابتدا درخواست حذف این سکانس را برای تأیید نمایش می‌دهد." aria-label={`حذف سکانس ${scene.name}`} onClick={() => setDeletingId(id)}>×</button>}
          </div>
        </article>;
      })}
    </div>
    {props.activeSceneId && props.scenes[props.activeSceneId] && <p className="shrink-0 rounded-md border border-line bg-[#101822] p-2 text-[10px] leading-5 text-muted">سکانس فعال: <strong className="text-foreground">{props.scenes[props.activeSceneId].name}</strong>. تنظیمات محیط، حضور شخصیت‌ها و دوربین را از زبانهٔ «ویژگی‌ها» ویرایش کنید.</p>}
  </section>;
}
