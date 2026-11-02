"use client";

import { useState } from "react";
import type { SceneDefinition } from "@/lib/scenes/scene-schema";
import { computeSceneOffsets, formatTimecode } from "@/lib/scenes/scene-time";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import type { AudioProjectCollections } from "@/lib/audio/audio-schema";
import { UnifiedTimelineTracks } from "./unified-timeline-tracks";

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
  audio: AudioProjectCollections;
  assetNames: Record<string, string>;
  selectedAudioClipId: string | null;
  selectedSpeakerRegionId: string | null;
  onSelectAudio: (assetId: string, clipId: string, frame: number, regionId?: string) => void;
  onEditAudio: (update: (current: AudioProjectCollections) => AudioProjectCollections) => void;
  onDropAudioFile: (file: File, sceneId: string, frame: number) => Promise<boolean>;
  onDropAudioAsset: (assetId: string, sceneId: string, frame: number) => boolean;
  assetDurations: Readonly<Record<string, number>>;
  identityNames: Record<string, string>;
  activeWorkspace?: "scenes" | "animations";
  onSelectEvent: (sceneId: string, id: string, frame: number) => void;
  onMoveEvent: (sceneId: string, id: string, startFrame: number) => void;
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
  const [focusedByWorkspace, setFocusedByWorkspace] = useState({ scenes: true, animations: true });
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
          <label
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
          </label>
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
          <button type="button" className={`${button} ${!animationFocused ? "border-accent bg-[#17343a]" : ""}`} aria-expanded={!animationFocused} aria-controls="timeline-scene-management" onClick={() => setFocusedByWorkspace((current) => ({ ...current, [workspaceKey]: !current[workspaceKey] }))} title="جزئیات و کارت‌های مدیریت سکانس را در بالای تایم‌لاین باز یا جمع می‌کند؛ داده و زمان‌بندی تغییر نمی‌کند.">{animationFocused ? "نمایش جزئیات سکانس‌ها" : "جمع‌کردن جزئیات سکانس‌ها"}</button>
          {props.playbackStatus === "playing" ? (
            <button
              type="button"
              className={button}
              title="مکث؛ زمان فعلی حفظ می‌شود"
              data-transport="pause"
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
              data-transport="play"
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
            data-transport="stop"
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

      <div id="timeline-scene-management" hidden={animationFocused}
        className="workspace-scene-cards grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(220px,280px)] gap-2 px-2 py-2 max-[650px]:grid-cols-1"
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

      <UnifiedTimelineTracks sceneOrder={props.sceneOrder} scenes={props.scenes} audio={props.audio} assetNames={props.assetNames} assetDurations={props.assetDurations} characterNames={props.characterNames} identityNames={props.identityNames} fps={props.fps} currentFrame={props.currentFrame} totalFrames={props.totalFrames} activeSceneId={props.activeSceneId} selectedEventId={props.selectedEventId} selectedAudioClipId={props.selectedAudioClipId} selectedSpeakerRegionId={props.selectedSpeakerRegionId} onHelp={props.onHelp} onSeek={props.onSeek} onSelectScene={props.onSelect} onSelectEvent={props.onSelectEvent} onMoveEvent={props.onMoveEvent} onSelectAudio={props.onSelectAudio} onEditAudio={props.onEditAudio} onDropAudioFile={props.onDropAudioFile} onDropAudioAsset={props.onDropAudioAsset} />
    </section>
  );
}
