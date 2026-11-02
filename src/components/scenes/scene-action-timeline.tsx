"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import { sceneActionLabels } from "@/lib/scenes/scene-action-labels";
import type { SceneActionEvent } from "@/lib/scenes/scene-schema";
import { getPreviewActionChannels, type CharacterPreviewActionId } from "@/lib/characters/animation-preview";

const categoryLabel = { gaze: "نگاه", head: "سر", expression: "چهره", gesture: "دست‌ها" } as const;
const colors = {
  gaze: "border-violet-300/70 bg-violet-400/20",
  head: "border-sky-300/70 bg-sky-400/20",
  expression: "border-pink-300/70 bg-pink-400/20",
  gesture: "border-amber-300/70 bg-amber-400/20",
} as const;

type Props = {
  events: SceneActionEvent[];
  characterNames: Record<string, string>;
  characterCapabilities: Record<string, readonly ("head-rotation" | "arm-gesture" | "facial-expression")[]>;
  gazeSupportedIds: readonly string[];
  durationFrames: number;
  localFrame: number;
  fps: number;
  selectedEventId: string | null;
  onHelp: (topic: ContextHelpId) => void;
  onSelect: (event: SceneActionEvent) => void;
  onMove: (eventId: string, startFrame: number) => void;
};

function formatSeconds(frame: number, fps: number) {
  return `${(frame / fps).toFixed(2)}s`;
}

export function SceneActionTimeline({ events, characterNames, characterCapabilities, gazeSupportedIds, durationFrames, localFrame, fps, selectedEventId, onHelp, onSelect, onMove }: Props) {
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState<{ eventId: string; originX: number; originFrame: number; frame: number } | null>(null);
  const grouped = useMemo(() => {
    const actors = new Map<string, Map<keyof typeof categoryLabel, SceneActionEvent[]>>();
    for (const event of events) {
      const actionCategories = event.action.startsWith("gaze-")
        ? ["gaze" as const]
        : event.action === "return-idle"
          ? ["head" as const, "gesture" as const]
          : getPreviewActionChannels(event.action as CharacterPreviewActionId).flatMap((channel) => channel === "head-rotation" ? ["head" as const] : channel === "arm-gesture" ? ["gesture" as const] : ["expression" as const]);
      const supported = new Set(characterCapabilities[event.characterInstanceId] ?? []);
      if (event.action.startsWith("gaze-") && !gazeSupportedIds.includes(event.characterInstanceId)) continue;
      const channels = actors.get(event.characterInstanceId) ?? new Map();
      for (const category of actionCategories) {
        const supportedChannel = category === "head" ? supported.has("head-rotation") : category === "gesture" ? supported.has("arm-gesture") : category === "expression" ? supported.has("facial-expression") : true;
        if (!supportedChannel) continue;
        const track = channels.get(category) ?? [];
        track.push(event);
        channels.set(category, track);
      }
      if (channels.size) actors.set(event.characterInstanceId, channels);
    }
    return [...actors.entries()];
  }, [characterCapabilities, events, gazeSupportedIds]);
  const pixelsPerFrame = 60 * zoom / fps;
  const timelineWidth = Math.max(520, Math.ceil(durationFrames * pixelsPerFrame));
  const playhead = Math.max(0, Math.min(durationFrames, localFrame));

  const movePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const deltaFrames = Math.round((event.clientX - drag.originX) / pixelsPerFrame);
    const selected = events.find((item) => item.id === drag.eventId);
    if (!selected) return;
    const frame = Math.max(0, Math.min(durationFrames - selected.durationFrames, drag.originFrame + deltaFrames));
    setDrag((current) => current ? { ...current, frame } : current);
  };
  const finishPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    const { eventId, frame } = drag;
    setDrag(null);
    onMove(eventId, frame);
  };

  return <section className="flex min-h-0 flex-col gap-2 p-2" aria-label="تایم‌لاین حرکت‌های سکانس">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><h3 className="text-xs font-bold">ترک‌های حرکت</h3><span className="text-[10px] text-muted">هر ردیف مستقل است؛ زمان با کشیدن دستگیره تغییر می‌کند.</span><ContextHelpTrigger topic="timelineActions" onOpen={onHelp} /></div>
      <label className="flex items-center gap-2 text-[10px] text-muted" title="بزرگ‌نمایی افقی ترک‌های همین سکانس را تغییر می‌دهد؛ زمان رویدادها ثابت می‌ماند.">
        بزرگ‌نمایی <input aria-label="بزرگ‌نمایی تایم‌لاین حرکت" type="range" min="1" max="4" step="0.25" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24 accent-[#4fd1c5]" />
      </label>
    </header>
    {!events.length || !grouped.length ? <p className="rounded border border-dashed border-line p-3 text-[11px] text-muted">{events.length ? "رویدادهای ذخیره‌شده برای کانال‌های این مدل قابل اجرا نیستند؛ کانال پشتیبانی‌نشده به‌عنوان ترک فعال نمایش داده نمی‌شود." : "برای ساخت ترک، از ابزار «حرکت‌ها» یک رویداد پشتیبانی‌شده به سکانس انتخاب‌شده اضافه کنید."}</p> :
      <div className="min-h-0 flex-1 overflow-auto rounded border border-line bg-[#0d141e]" dir="ltr">
        <div className="min-w-max">
          <div className="sticky top-0 z-[2] flex h-7 border-b border-line bg-[#141f2d]" dir="ltr" style={{ width: timelineWidth + 80 }} aria-label="خط‌کش تایم‌لاین حرکت">
            <span className="sticky left-0 z-[1] flex w-20 shrink-0 items-center border-r border-line bg-[#141f2d] px-2 text-[9px] text-muted" dir="rtl">ترک / زمان</span>
            <div className="relative h-full shrink-0" style={{ width: timelineWidth }}>
              {Array.from({ length: Math.min(9, Math.ceil(durationFrames / Math.max(1, Math.floor(fps * 5))) + 1) }, (_, index) => {
                const frame = Math.min(durationFrames, index * fps * 5);
                return <span key={frame} className="absolute top-1 font-mono text-[9px] text-[#9fb1c3]" style={{ left: frame * pixelsPerFrame }}>{formatSeconds(frame, fps)}</span>;
              })}
            </div>
          </div>
          {grouped.map(([actorId, tracks], actorIndex) => <details key={actorId} open={actorIndex === 0} className="border-b border-line/70">
            <summary className="sticky top-7 z-[1] flex h-7 cursor-pointer list-none items-center gap-2 bg-[#172333] px-2 text-[11px] font-semibold text-[#e1ebf4]" title="ترک‌های شخصیت را باز یا جمع می‌کند؛ زمان و اولویت رویدادها تغییر نمی‌کند.">{characterNames[actorId] ?? "شخصیت حذف‌شده"}<span className="text-[9px] font-normal text-muted">{[...tracks.values()].flat().length} حرکت</span></summary>
            {[...tracks.entries()].map(([category, trackEvents]) => <div key={category} className="flex h-9 items-stretch border-t border-line/50" dir="ltr">
              <span className="sticky left-0 z-[1] flex w-20 shrink-0 items-center border-r border-line bg-[#111a26] px-2 text-[10px] text-muted" dir="rtl">{categoryLabel[category]}</span>
              <div className="relative h-full" style={{ width: timelineWidth }} dir="ltr">
                <span className="pointer-events-none absolute inset-y-0 w-px bg-white/80" style={{ left: playhead * pixelsPerFrame }} aria-hidden="true" />
                {trackEvents.slice().sort((a, b) => a.priority - b.priority || a.startFrame - b.startFrame || a.id.localeCompare(b.id)).map((item) => {
                  const frame = drag?.eventId === item.id ? drag.frame : item.startFrame;
                  const left = frame * pixelsPerFrame;
                  const width = Math.max(6, item.durationFrames * pixelsPerFrame);
                  return <div key={item.id} className={`absolute inset-y-1 flex min-w-0 items-stretch overflow-hidden rounded border text-[9px] text-[#e8f1f8] ${colors[category]} ${selectedEventId === item.id ? "ring-2 ring-accent" : ""} ${item.enabled ? "" : "opacity-40"}`} style={{ left, width }}>
                    <button type="button" className="h-full shrink-0 cursor-grab touch-none border-r border-white/20 px-1 active:cursor-grabbing" aria-label={`کشیدن برای جابه‌جایی زمانی ${sceneActionLabels[item.action]}`} title="این دستگیره را افقی بکشید تا رویداد روی نزدیک‌ترین فریم جابه‌جا شود؛ ترتیب فهرست و اولویت تغییر نمی‌کند." onClick={(event) => { event.stopPropagation(); }} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setDrag({ eventId: item.id, originX: event.clientX, originFrame: item.startFrame, frame: item.startFrame }); }} onPointerMove={movePointer} onPointerUp={finishPointer} onPointerCancel={() => setDrag(null)}>⠿</button>
                    <button type="button" className="min-w-0 flex-1 truncate px-1 text-left focus-visible:outline-2 focus-visible:outline-accent" aria-pressed={selectedEventId === item.id} aria-label={`${characterNames[actorId] ?? "شخصیت"}، ${sceneActionLabels[item.action]}، شروع ${formatSeconds(frame, fps)}، مدت ${item.durationFrames} فریم`} onClick={() => onSelect(item)} title={`${sceneActionLabels[item.action]} · ${formatSeconds(frame, fps)} تا ${formatSeconds(frame + item.durationFrames, fps)}؛ کلیک برای انتخاب و رفتن به شروع.`}>{sceneActionLabels[item.action]}</button>
                  </div>;
                })}
              </div>
            </div>)}
          </details>)}
        </div>
      </div>}
  </section>;
}
