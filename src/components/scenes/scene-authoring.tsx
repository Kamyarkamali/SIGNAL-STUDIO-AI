"use client";

import { useState } from "react";
import type { SceneDefinition } from "@/lib/scenes/scene-schema";
import { computeSceneOffsets, formatTimecode } from "@/lib/scenes/scene-time";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import { sceneActionCategory, sceneActionLabels } from "@/lib/scenes/scene-action-labels";
import { SceneActionTimeline } from "./scene-action-timeline";
import type { SceneActionEvent } from "@/lib/scenes/scene-schema";

const button =
  "min-h-8 rounded-md border border-[#354355] bg-[#1d2939] px-2 text-xs text-[#d8e4ef] transition-colors hover:bg-[#28394b] focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45";
const iconButton = `${button} min-w-8 px-1`;
type Content = Partial<
  Pick<SceneDefinition, "description" | "directionNotes" | "sceneType">
>;
type Props = {
  canEdit: boolean;
  sceneOrder: string[];
  scenes: Record<string, SceneDefinition>;
  fps: number;
  currentFrame: number;
  totalFrames: number;
  activeSceneId: string | null;
  playbackStatus: "stopped" | "playing" | "paused" | "ended";
  onHelp: (topic: ContextHelpId) => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onContentChange: (id: string, content: Content) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, index: number) => void;
  onDurationChange: (id: string, seconds: number) => void;
  onFrameRateChange: (fps: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (frame: number) => void;
  onPreviousScene: () => void;
  onNextScene: () => void;
  selectedEventId: string | null;
  characterNames: Record<string, string>;
  characterCapabilities: Record<string, readonly ("head-rotation" | "arm-gesture" | "facial-expression")[]>;
  gazeSupportedIds: string[];
  activeWorkspace?: "scenes" | "animations";
  localFrame: number;
  onReorderEvent: (id: string, index: number) => void;
  onMoveEvent: (id: string, startFrame: number) => void;
  onSelectEvent: (id: string) => void;
  onSeekEvent: (frame: number) => void;
};

function timeLabel(frame: number, fps: number) {
  const seconds = Math.floor(frame / fps);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const sceneTypeLabels = {
  dialogue: "گفت‌وگو",
  educational: "ارائهٔ آموزشی",
  reaction: "واکنش شخصیت",
  establishing: "نمای معرفی فضا",
} as const;

export function SceneAuthoring(props: Props) {
  const [focusedByWorkspace, setFocusedByWorkspace] = useState({ scenes: false, animations: true });
  const workspaceKey = props.activeWorkspace ?? "scenes";
  const animationFocused = focusedByWorkspace[workspaceKey];
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [durationDraft, setDurationDraft] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const offsets = computeSceneOffsets(props.sceneOrder, props.scenes);
  const offsetById = new Map(offsets.map((entry) => [entry.sceneId, entry]));
  const selectedIndex = props.activeSceneId
    ? props.sceneOrder.indexOf(props.activeSceneId)
    : -1;
  const selected = props.activeSceneId
    ? props.scenes[props.activeSceneId]
    : undefined;
  const selectedOffset = selected ? offsetById.get(selected.id) : undefined;

  return (
    <section
      className="overflow-hidden rounded-xl border border-line bg-surface"
      aria-label="استوری‌بورد و تایم‌لاین پروژه"
    >
      <header className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2 text-xs font-bold">
          <span className="h-3.5 w-[3px] rounded bg-accent" />
          <span>استوری‌بورد و تایم‌لاین</span>
          <ContextHelpTrigger topic="timeline" onOpen={props.onHelp} />
          {!animationFocused && <label
            className="flex items-center gap-1 font-normal text-[#b7c6d5]"
            title="نرخ فریم پروژه؛ مدت‌ها برای حفظ زمان واقعی تبدیل می‌شوند"
          >
            <span>FPS</span>
            <select
              className="h-7 rounded border border-line bg-[#111a26] px-1 text-xs text-foreground"
              value={props.fps}
              onChange={(event) =>
                props.onFrameRateChange(Number(event.target.value))
              }
              aria-label="نرخ فریم پروژه"
            >
              {[24, 25, 30, 50, 60].map((fps) => (
                <option key={fps} value={fps}>
                  {fps}
                </option>
              ))}
            </select>
          </label>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            dir="ltr"
            className="min-w-[126px] text-center font-mono text-xs tabular-nums text-[#d5e2ed]"
          >
            {formatTimecode(props.currentFrame, props.fps)} /{" "}
            {formatTimecode(props.totalFrames, props.fps)}
          </span>
          {animationFocused && <label className="sr-only" htmlFor="animation-active-scene">سکانس فعال ترک‌های حرکت</label>}
          {animationFocused && <select id="animation-active-scene" className="h-8 max-w-40 rounded border border-line bg-[#111a26] px-2 text-xs text-foreground" value={props.activeSceneId ?? ""} onChange={(event) => { if (event.target.value) props.onSelect(event.target.value); }} title="سکانسی را برای ویرایش ترک‌های حرکت انتخاب می‌کند؛ رویدادهای سکانس‌های دیگر دست‌نخورده می‌مانند." aria-label="انتخاب سکانس برای ویرایش حرکت‌ها">
            {props.sceneOrder.map((id) => <option key={id} value={id}>{props.scenes[id]?.name ?? "سکانس"}</option>)}
          </select>}
          <button
            type="button"
            className={iconButton}
            title="صحنهٔ قبلی"
            aria-label="رفتن به صحنهٔ قبلی"
            disabled={selectedIndex <= 0}
            onClick={props.onPreviousScene}
          >
            ◀◀
          </button>
          <button type="button" className={`${button} ${animationFocused ? "border-accent bg-[#17343a]" : ""}`} aria-pressed={animationFocused} onClick={() => setFocusedByWorkspace((current) => ({ ...current, [workspaceKey]: !current[workspaceKey] }))} title="نمای ترک‌های حرکت را از نمای مدیریت و ترتیب صحنه‌ها جدا می‌کند؛ زمان‌بندی و محتوای صحنه تغییر نمی‌کند.">{animationFocused ? "نمای کلی صحنه‌ها" : "ترک‌های حرکت"}</button>
          {props.playbackStatus === "playing" ? (
            <button
              type="button"
              className={button}
              title="مکث؛ زمان فعلی حفظ می‌شود"
              onClick={props.onPause}
            >
              مکث
            </button>
          ) : (
            <button
              type="button"
              className={button}
              title="پخش از زمان فعلی"
              disabled={!props.totalFrames}
              onClick={props.onPlay}
            >
              پخش
            </button>
          )}
          <button
            type="button"
            className={button}
            title="توقف و بازگشت به ابتدای پروژه"
            disabled={
              !props.totalFrames ||
              (props.playbackStatus === "stopped" && props.currentFrame === 0)
            }
            onClick={props.onStop}
          >
            توقف
          </button>
          {!animationFocused && <button
            type="button"
            className={iconButton}
            title="صحنهٔ بعدی"
            aria-label="رفتن به صحنهٔ بعدی"
            disabled={
              selectedIndex < 0 || selectedIndex >= props.sceneOrder.length - 1
            }
            onClick={props.onNextScene}
          >
            ▶▶
          </button>}
          {!animationFocused && <button
            type="button"
            className={`${button} border-[#21635b] text-accent`}
            title="ایجاد صحنه در انتهای پروژه"
            disabled={!props.canEdit || props.sceneOrder.length >= 500}
            onClick={props.onCreate}
          >
            ＋ صحنه
          </button>}
        </div>
      </header>

      <div hidden={animationFocused}
        className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(220px,280px)] gap-2 px-2 py-2 max-[650px]:grid-cols-1"
        dir="rtl"
      >
        <div
          className="flex min-w-0 gap-2 overflow-x-auto pb-1"
          aria-label="کارت‌های صحنه"
        >
          {props.sceneOrder.map((id, index) => {
            const scene = props.scenes[id];
            const entry = offsetById.get(id);
            if (!scene || !entry) return null;
            const selectedCard = props.activeSceneId === id;
            const duration = scene.durationFrames / props.fps;
            return (
              <article
                key={id}
                onDragOver={(event) => {
                  if (draggedId) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDropIndex(index);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const movedId =
                    event.dataTransfer.getData("text/plain") || draggedId;
                  if (movedId) props.onReorder(movedId, index);
                  setDraggedId(null);
                  setDropIndex(null);
                }}
                className={`w-[min(230px,72vw)] min-w-[190px] shrink-0 rounded-lg border p-2 transition-[border-color,background-color,opacity] duration-150 ${selectedCard ? "border-accent bg-[#17343a]" : "border-line bg-[#121b27]"} ${draggedId === id ? "opacity-45" : ""} ${dropIndex === index && draggedId !== id ? "ring-2 ring-accent" : ""}`}
              >
                <div className="flex items-start gap-1.5">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-right"
                    aria-pressed={selectedCard}
                    title="انتخاب صحنه و رفتن به آغاز آن"
                    onClick={() => props.onSelect(id)}
                  >
                    <span className="block truncate text-xs font-bold text-[#edf4fa]">
                      {index + 1}. {scene.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#9fb1c3]">
                      {scene.sceneType
                        ? sceneTypeLabels[scene.sceneType]
                        : "بدون نوع"}{" "}
                      · شروع {timeLabel(entry.startFrame, props.fps)} ·{" "}
                      {duration.toFixed(1)} ثانیه
                    </span>
                    {scene.description && (
                      <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-[#b7c6d5]">
                        {scene.description}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    draggable
                    aria-label={`گرفتن و جابه‌جایی صحنه ${scene.name}`}
                    title="برای جابه‌جایی بکشید؛ با صفحه‌کلید از دکمه‌های جهت‌دار استفاده کنید"
                    className={`${iconButton} cursor-grab active:cursor-grabbing`}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", id);
                      setDraggedId(id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDropIndex(null);
                    }}
                  >
                    ⠿
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-1 border-t border-line/70 pt-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={iconButton}
                      title="انتقال به چپ"
                      aria-label={`انتقال ${scene.name} به قبل`}
                      disabled={index === 0}
                      onClick={() => props.onReorder(id, index - 1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      title="انتقال به راست"
                      aria-label={`انتقال ${scene.name} به بعد`}
                      disabled={index === props.sceneOrder.length - 1}
                      onClick={() => props.onReorder(id, index + 1)}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      title="تکثیر صحنه"
                      aria-label={`تکثیر ${scene.name}`}
                      disabled={props.sceneOrder.length >= 500}
                      onClick={() => props.onDuplicate(id)}
                    >
                      ⧉
                    </button>
                  </div>
                  {deletingId === id ? (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        className={`${iconButton} text-red-200`}
                        onClick={() => {
                          props.onDelete(id);
                          setDeletingId(null);
                        }}
                      >
                        حذف
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => setDeletingId(null)}
                      >
                        لغو
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`${iconButton} text-red-200`}
                      title="حذف صحنه"
                      aria-label={`حذف ${scene.name}`}
                      onClick={() => setDeletingId(id)}
                    >
                      ⌫
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {!props.sceneOrder.length && (
            <div className="flex min-h-[90px] min-w-full items-center justify-center rounded-lg border border-dashed border-[#46566a] text-xs text-[#aebdca]">
              برای شروع، «＋ صحنه» را انتخاب کنید.
            </div>
          )}
        </div>

        {selected ? (
          <aside
            className="grid min-w-0 grid-cols-2 gap-x-2 gap-y-1 rounded-lg border border-line bg-[#101822] p-2 text-[10px]"
            aria-label="ویژگی‌های صحنهٔ انتخاب‌شده"
          >
            <label className="col-span-2 flex flex-col gap-1 text-[#aebdca]">
              عنوان صحنه
              <input
                key={`${selected.id}:${selected.name}`}
                className="h-7 rounded border border-line bg-[#0b111a] px-2 text-xs text-foreground"
                defaultValue={selected.name}
                maxLength={80}
                aria-label="عنوان صحنه"
                onBlur={(event) => {
                  const name = event.currentTarget.value.trim();
                  if (name && name !== selected.name)
                    props.onRename(selected.id, name);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-[#aebdca]">
              شرح صحنه
              <textarea
                className="h-10 resize-y rounded border border-line bg-[#0b111a] px-2 py-1 text-xs text-foreground"
                value={selected.description}
                maxLength={1000}
                aria-label="شرح صحنه"
                onChange={(event) =>
                  props.onContentChange(selected.id, {
                    description: event.target.value,
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-[#aebdca]">
              نوع صحنه
              <select
                className="h-7 rounded border border-line bg-[#0b111a] px-1 text-xs text-foreground"
                value={selected.sceneType ?? ""}
                aria-label="نوع صحنه"
                onChange={(event) =>
                  props.onContentChange(selected.id, {
                    sceneType: event.target.value
                      ? (event.target.value as SceneDefinition["sceneType"])
                      : undefined,
                  })
                }
              >
                <option value="">بدون نوع</option>
                <option value="dialogue">گفت‌وگو</option>
                <option value="educational">ارائهٔ آموزشی</option>
                <option value="reaction">واکنش شخصیت</option>
                <option value="establishing">نمای معرفی فضا</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[#aebdca]">
              مدت (ثانیه)
              <input
                className="h-7 rounded border border-line bg-[#0b111a] px-2 text-center font-mono text-xs tabular-nums text-foreground"
                type="number"
                min={1 / props.fps}
                max={Math.floor(1_000_000 / props.fps)}
                step="0.1"
                value={
                  durationDraft ||
                  (selected.durationFrames / props.fps).toFixed(1)
                }
                aria-label="مدت صحنه به ثانیه"
                onFocus={() =>
                  setDurationDraft(
                    (value) =>
                      value || (selected.durationFrames / props.fps).toFixed(1),
                  )
                }
                onChange={(event) => setDurationDraft(event.target.value)}
                onBlur={() => {
                  const value = Number(durationDraft);
                  if (Number.isFinite(value) && value > 0)
                    props.onDurationChange(selected.id, value);
                  setDurationDraft("");
                }}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-[#aebdca]">
              یادداشت کارگردان
              <textarea
                className="h-10 resize-y rounded border border-line bg-[#0b111a] px-2 py-1 text-xs text-foreground"
                value={selected.directionNotes}
                maxLength={4000}
                aria-label="یادداشت کارگردان"
                onChange={(event) =>
                  props.onContentChange(selected.id, {
                    directionNotes: event.target.value,
                  })
                }
              />
            </label>
          </aside>
        ) : (
          <aside className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-line px-3 text-center text-xs text-[#8fa1b4]">
            برای ویرایش، یک صحنه را انتخاب کنید.
          </aside>
        )}
      </div>

      <div hidden={animationFocused} className="grid grid-cols-[minmax(120px,180px)_minmax(0,1fr)] items-center gap-3 border-t border-line px-3 py-1.5 max-[650px]:grid-cols-1 max-[650px]:gap-1">
        <div className="flex items-center justify-between gap-2 text-[10px] text-[#b7c6d5]">
          <span>خط‌کش زمان · جابه‌جایی</span>
          <span dir="ltr" className="font-mono tabular-nums">
            {formatTimecode(props.currentFrame, props.fps)}
          </span>
        </div>
        <div className="min-w-0" dir="ltr">
          <div
            className="relative mb-1 flex h-3 overflow-hidden rounded-sm border border-[#314153] bg-[#0b111a] cursor-pointer"
            aria-label="خط‌کش و مرز صحنه‌ها"
            onPointerDown={(event) => {
              if (!props.totalFrames) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const ratio = Math.max(
                0,
                Math.min(1, (event.clientX - bounds.left) / bounds.width),
              );
              props.onSeek(Math.round(ratio * props.totalFrames));
            }}
          >
            {props.sceneOrder.map((id, index) => {
              const scene = props.scenes[id];
              const entry = offsetById.get(id);
              if (!scene || !entry || !props.totalFrames) return null;
              return (
                <div
                  key={id}
                  title={`${index + 1}. ${scene.name} · شروع ${timeLabel(entry.startFrame, props.fps)}`}
                  className={`h-full border-r border-[#09111a] ${id === props.activeSceneId ? "bg-accent/80" : "bg-[#355064]"}`}
                  style={{
                    width: `${(scene.durationFrames / props.totalFrames) * 100}%`,
                  }}
                />
              );
            })}
            {props.totalFrames > 0 && (
              <span
                className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_4px_1px_#fff8]"
                style={{
                  left: `${Math.min(100, (props.currentFrame / props.totalFrames) * 100)}%`,
                }}
              />
            )}
          </div>
          <div
            className="mb-0.5 flex justify-between px-0.5 font-mono text-[9px] tabular-nums text-[#8fa1b4]"
            aria-hidden="true"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <span key={ratio}>
                {timeLabel(Math.round(props.totalFrames * ratio), props.fps)}
              </span>
            ))}
          </div>
          <input
            className="timeline-playhead w-full accent-[#4fd1c5]"
            type="range"
            min={0}
            max={Math.max(0, props.totalFrames)}
            step={1}
            value={Math.min(props.currentFrame, props.totalFrames)}
            aria-label="جابه‌جایی در خط زمان پروژه"
            title="پخش‌نما را به فریم انتخاب‌شده می‌برد و وضعیت همان لحظه را در نمای سه‌بعدی ارزیابی می‌کند؛ دادهٔ پروژه تغییر نمی‌کند."
            disabled={!props.totalFrames}
            onChange={(event) => props.onSeek(Number(event.target.value))}
          />
        </div>
      </div>
      <div hidden={animationFocused} className="border-t border-line px-3 py-2" dir="rtl">
        <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-muted">
          <span>رویدادهای حرکتی · {selected?.name ?? "سکانسی انتخاب نشده"}</span>
          <ContextHelpTrigger topic="timelineActions" onOpen={props.onHelp} />
        </div>
        {selected && <div className="relative h-8 overflow-hidden rounded border border-line bg-[#101722]" dir="ltr" aria-label="رویدادهای حرکتی سکانس فعال">
          {selected.actionEvents.map((event) => {
            const start = Math.max(0, Math.min(100, event.startFrame / selected.durationFrames * 100));
            const width = Math.max(1.2, Math.min(100 - start, event.durationFrames / selected.durationFrames * 100));
            const category = sceneActionCategory(event.action);
            const color = category === "gaze" ? "border-violet-400/70 bg-violet-500/25" : category === "gesture" ? "border-amber-300/70 bg-amber-400/25" : category === "expression" ? "border-pink-300/70 bg-pink-400/25" : "border-sky-300/70 bg-sky-400/25";
            return <button key={event.id} type="button" className={`absolute inset-y-0.5 truncate rounded border px-1 text-[9px] text-[#e8f1f8] transition-colors focus-visible:outline-2 focus-visible:outline-accent ${color} ${props.selectedEventId === event.id ? "ring-2 ring-accent" : ""} ${event.enabled ? "" : "opacity-40"}`} style={{ left: `${start}%`, width: `${width}%` }} onClick={() => { props.onSelectEvent(event.id); props.onSeekEvent((selectedOffset?.startFrame ?? 0) + event.startFrame); }} title={`${sceneActionLabels[event.action]} · شروع ${timeLabel(event.startFrame, props.fps)} · ${event.durationFrames} فریم؛ برای انتخاب و رفتن به زمان شروع کلیک کنید.`} aria-label={`انتخاب رویداد ${sceneActionLabels[event.action]} در ${timeLabel(event.startFrame, props.fps)}`}>
              {props.characterNames[event.characterInstanceId] ?? "شخصیت"} · {sceneActionLabels[event.action]}
            </button>;
          })}
          {props.activeSceneId === selected.id && <span className="pointer-events-none absolute inset-y-0 w-px bg-white/80" style={{ left: `${Math.max(0, Math.min(100, ((props.currentFrame - (selectedOffset?.startFrame ?? 0)) / selected.durationFrames) * 100))}%` }} aria-hidden="true" />}
        </div>}
        {selected && !selected.actionEvents.length && <p className="rounded border border-dashed border-line px-2 py-1.5 text-[10px] text-muted">حرکت‌های افزوده‌شده در این نوار دیده می‌شوند؛ playhead را جابه‌جا کنید و از بخش «حرکت‌ها» رویداد بسازید.</p>}
      </div>
      <div hidden={!animationFocused} className="min-h-[170px] flex-1 overflow-hidden border-t border-line">
        {selected ? <SceneActionTimeline events={selected.actionEvents} characterNames={props.characterNames} characterCapabilities={props.characterCapabilities} gazeSupportedIds={props.gazeSupportedIds} durationFrames={selected.durationFrames} localFrame={props.localFrame} fps={props.fps} selectedEventId={props.selectedEventId} onHelp={props.onHelp}
          onSelect={(event: SceneActionEvent) => { props.onSelectEvent(event.id); props.onSeekEvent((selectedOffset?.startFrame ?? 0) + event.startFrame); }} onMove={props.onMoveEvent} />
          : <p className="p-3 text-xs text-muted">برای ویرایش حرکت‌ها ابتدا یک صحنه بسازید یا انتخاب کنید.</p>}
      </div>
    </section>
  );
}
