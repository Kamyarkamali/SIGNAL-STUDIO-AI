"use client";

import { Fragment, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import type { AudioProjectCollections } from "@/lib/audio/audio-schema";
import type { SceneDefinition } from "@/lib/scenes/scene-schema";
import { sceneActionCategory, sceneActionLabels } from "@/lib/scenes/scene-action-labels";
import { computeSceneOffsets } from "@/lib/scenes/scene-time";
import { audioClipFrameRange, speakerRegionFrameRange, speakerRegionsAtFrame } from "@/lib/scenes/timeline-projection";
import { clipSceneRelation } from "@/lib/audio/audio-placement";
import { canMergeAudioClips, mergeAudioClips, moveAudioClip, snapTimelineFrame, splitAudioClip, timelineClientXToFrame, trimAudioClip } from "@/lib/audio/timeline-editing";

type Props = {
  sceneOrder: string[];
  scenes: Record<string, SceneDefinition>;
  audio: AudioProjectCollections;
  assetNames: Readonly<Record<string, string>>;
  assetDurations: Readonly<Record<string, number>>;
  characterNames: Readonly<Record<string, string>>;
  identityNames: Readonly<Record<string, string>>;
  fps: number;
  currentFrame: number;
  totalFrames: number;
  activeSceneId: string | null;
  selectedEventId: string | null;
  selectedAudioClipId: string | null;
  selectedSpeakerRegionId: string | null;
  onHelp: (topic: ContextHelpId) => void;
  onSeek: (frame: number) => void;
  onSelectScene: (sceneId: string) => void;
  onSelectEvent: (sceneId: string, eventId: string, frame: number) => void;
  onMoveEvent: (sceneId: string, eventId: string, localFrame: number) => void;
  onSelectAudio: (assetId: string, clipId: string, frame: number, regionId?: string) => void;
  onEditAudio: (update: (current: AudioProjectCollections) => AudioProjectCollections) => void;
  onDropAudioFile: (file: File, sceneId: string, frame: number) => Promise<boolean>;
  onDropAudioAsset: (assetId: string, sceneId: string, frame: number) => boolean;
};

type EventTrack = { key: string; actorId: string; category: string; events: { sceneId: string; startFrame: number; event: SceneDefinition["actionEvents"][number] }[] };
const eventColors = { gaze: "border-violet-300/70 bg-violet-400/30", head: "border-sky-300/70 bg-sky-400/30", expression: "border-pink-300/70 bg-pink-400/30", gesture: "border-amber-300/70 bg-amber-400/30" } as const;
const categoryNames: Record<string, string> = { gaze: "نگاه", head: "سر", expression: "چهره", gesture: "دست‌ها" };
const speakerColors = ["bg-cyan-600/70", "bg-violet-600/75", "bg-amber-600/75", "bg-pink-600/75", "bg-blue-600/75", "bg-emerald-600/75"];

function speakerColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return speakerColors[Math.abs(hash) % speakerColors.length]!;
}

function clock(frame: number, fps: number) {
  const seconds = Math.floor(frame / fps);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function UnifiedTimelineTracks(props: Props) {
  const [zoom, setZoom] = useState(1);
  const offsets = useMemo(() => computeSceneOffsets(props.sceneOrder, props.scenes), [props.sceneOrder, props.scenes]);
  const offsetById = useMemo(() => new Map(offsets.map((entry) => [entry.sceneId, entry])), [offsets]);
  const fitWidth = Math.max(720, Math.min(6000, props.totalFrames * 0.16));
  const width = Math.max(360, Math.min(12000, fitWidth * zoom));
  const safeTotal = Math.max(1, props.totalFrames);
  const playhead = Math.min(props.totalFrames, Math.max(0, props.currentFrame));
  const tickCount = Math.max(2, Math.min(12, Math.floor(width / 140)));
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => Math.round(props.totalFrames * index / tickCount));
  const actionTracks = useMemo(() => {
    const groups = new Map<string, EventTrack>();
    for (const sceneId of props.sceneOrder) {
      const scene = props.scenes[sceneId];
      const offset = offsetById.get(sceneId)?.startFrame ?? 0;
      for (const event of scene?.actionEvents ?? []) {
        const category = sceneActionCategory(event.action);
        const key = `${event.characterInstanceId}:${category}`;
        const group = groups.get(key) ?? { key, actorId: event.characterInstanceId, category, events: [] };
        group.events.push({ sceneId, startFrame: offset + event.startFrame, event });
        groups.set(key, group);
      }
    }
    return [...groups.values()].sort((a, b) => a.actorId.localeCompare(b.actorId) || a.category.localeCompare(b.category));
  }, [offsetById, props.sceneOrder, props.scenes]);
  const clips = Object.values(props.audio.audioClips).sort((a, b) => a.startFrame - b.startFrame || a.id.localeCompare(b.id));
  const activeRegions = speakerRegionsAtFrame(clips, Object.values(props.audio.speakerRegions), playhead, props.fps);
  const activeSpeakerLabels = activeRegions.map(({ region }) => {
    if (region.status === "silence") return "سکوت";
    if (region.status === "unknown") return "نامشخص";
    const speaker = region.speakerId ? props.audio.speakers[region.speakerId] : null;
    return speaker?.kind === "character" ? props.identityNames[speaker.characterId] ?? speaker.name : speaker?.name ?? "گویندهٔ ناموجود";
  });
  const activeSpeakerLabel = activeSpeakerLabels.length ? activeSpeakerLabels.join("، ") : "بدون بازهٔ گوینده";
  const [drag, setDrag] = useState<{ sceneId: string; eventId: string; originX: number; originFrame: number; frame: number } | null>(null);
  const [audioDrag, setAudioDrag] = useState<{ clipId: string; mode: "move" | "start" | "end"; grabOffset: number; frame: number } | null>(null);
  const [dropSceneId, setDropSceneId] = useState<string | null>(null);
  const [multiSelectedAudioIds, setMultiSelectedAudioIds] = useState<string[] | null>(null);
  const selectedAudioIds = multiSelectedAudioIds && (!props.selectedAudioClipId || multiSelectedAudioIds.includes(props.selectedAudioClipId))
    ? new Set(multiSelectedAudioIds) : new Set(props.selectedAudioClipId ? [props.selectedAudioClipId] : []);
  const selectedClips = [...selectedAudioIds].map((id) => props.audio.audioClips[id]).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const mergeAllowed = selectedClips.length === 2 && canMergeAudioClips(selectedClips[0]!, selectedClips[1]!, props.fps);
  const [mergePrompt, setMergePrompt] = useState<{ firstId: string; secondId: string } | null>(null);
  const [undoAudio, setUndoAudio] = useState<AudioProjectCollections[]>([]);
  const [redoAudio, setRedoAudio] = useState<AudioProjectCollections[]>([]);
  const trackScroller = useRef<HTMLDivElement>(null);
  const commitAudio = (next: AudioProjectCollections) => {
    setUndoAudio((history) => [...history.slice(-49), props.audio]); setRedoAudio([]);
    props.onEditAudio(() => next);
  };
  const rememberExternalEdit = () => { setUndoAudio((history) => [...history.slice(-49), props.audio]); setRedoAudio([]); };
  const undo = () => {
    const previous = undoAudio.at(-1); if (!previous) return;
    setUndoAudio((history) => history.slice(0, -1)); setRedoAudio((history) => [...history, props.audio]); props.onEditAudio(() => previous);
  };
  const redo = () => {
    const next = redoAudio.at(-1); if (!next) return;
    setRedoAudio((history) => history.slice(0, -1)); setUndoAudio((history) => [...history, props.audio]); props.onEditAudio(() => next);
  };
  const timelineFrameAt = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return timelineClientXToFrame(clientX, rect.left, rect.width, props.totalFrames);
  };
  const sceneDrop = async (event: ReactDragEvent<HTMLButtonElement>, sceneId: string) => {
    event.preventDefault(); event.stopPropagation(); setDropSceneId(null);
    const sceneOffset = offsetById.get(sceneId); const scene = props.scenes[sceneId];
    if (!sceneOffset || !scene) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const frame = sceneOffset.startFrame + Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * scene.durationFrames);
    const file = [...event.dataTransfer.files].find((item) => /^(audio\/wav|audio\/mpeg|audio\/mp3)$/i.test(item.type) || /\.(wav|mp3)$/i.test(item.name));
    const assetId = event.dataTransfer.getData("application/x-signal-audio-asset");
    if (file) { if (await props.onDropAudioFile(file, sceneId, frame)) rememberExternalEdit(); return; }
    if (assetId && props.assetDurations[assetId] && props.onDropAudioAsset(assetId, sceneId, frame)) rememberExternalEdit();
  };
  const audioPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!audioDrag) return;
    const lane = event.currentTarget.closest("[data-audio-lane]");
    if (!(lane instanceof HTMLElement)) return;
    const frameAtPointer = timelineFrameAt(event.clientX, lane);
    if (frameAtPointer === null) return;
    const targets = [0, ...offsets.flatMap((entry) => [entry.startFrame, entry.startFrame + (props.scenes[entry.sceneId]?.durationFrames ?? 0)]), ...clips.filter((item) => item.id !== audioDrag.clipId).flatMap((item) => { const range = audioClipFrameRange(item, props.fps); return [range.startFrame, range.endFrame]; })].map((target) => audioDrag.mode === "move" ? target + audioDrag.grabOffset : target);
    const frame = snapTimelineFrame(frameAtPointer, targets);
    setAudioDrag((current) => current ? { ...current, frame } : null);
  };
  const audioPointerEnd = () => {
    if (!audioDrag) return;
    const clip = props.audio.audioClips[audioDrag.clipId];
    if (clip) {
      const range = audioClipFrameRange(clip, props.fps);
      const changed = audioDrag.mode === "move" ? Math.max(0, audioDrag.frame - audioDrag.grabOffset) !== clip.startFrame
        : audioDrag.mode === "start" ? audioDrag.frame !== range.startFrame : audioDrag.frame !== range.endFrame;
      if (changed) {
        const next = audioDrag.mode === "move" ? moveAudioClip(props.audio, clip.id, Math.max(0, audioDrag.frame - audioDrag.grabOffset))
          : trimAudioClip(props.audio, clip.id, audioDrag.mode, audioDrag.frame, props.fps);
        if (next !== props.audio) commitAudio(next);
      }
    }
    setAudioDrag(null);
  };
  const beginAudioDrag = (event: ReactPointerEvent<HTMLButtonElement>, clipId: string, mode: "move" | "start" | "end") => {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    const clip = props.audio.audioClips[clipId]; if (!clip) return;
    setMultiSelectedAudioIds(null);
    props.onSelectAudio(clip.assetId, clip.id, clip.startFrame);
    const range = audioClipFrameRange(clip, props.fps);
    const lane = event.currentTarget.closest("[data-audio-lane]");
    const pointerFrame = lane instanceof HTMLElement ? timelineFrameAt(event.clientX, lane) : clip.startFrame;
    const origin = mode === "end" ? range.endFrame : mode === "start" ? clip.startFrame : pointerFrame ?? clip.startFrame;
    setAudioDrag({ clipId, mode, grabOffset: mode === "move" ? (pointerFrame ?? clip.startFrame) - clip.startFrame : 0, frame: origin });
  };
  const movePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const change = Math.round((event.clientX - drag.originX) / (width / safeTotal));
    const scene = props.scenes[drag.sceneId];
    const action = scene?.actionEvents.find((item) => item.id === drag.eventId);
    const offset = offsetById.get(drag.sceneId)?.startFrame ?? 0;
    if (!scene || !action) return;
    const global = Math.max(offset, Math.min(offset + scene.durationFrames - action.durationFrames, drag.originFrame + change));
    setDrag((current) => current ? { ...current, frame: global } : current);
  };
  const finishPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    event.preventDefault(); event.stopPropagation();
    const offset = offsetById.get(drag.sceneId)?.startFrame ?? 0;
    props.onMoveEvent(drag.sceneId, drag.eventId, drag.frame - offset);
    setDrag(null);
  };

  const trackLabel = "sticky left-0 z-[2] flex w-36 shrink-0 items-center border-r border-line bg-[#111a26] px-2 text-[10px] font-medium text-[#b9c8d6]";
  const lane = "relative h-8 shrink-0 border-b border-line/70 bg-[#0c141e]";
  const laneRow = (label: string, content: ReactNode, title?: string, rowKey = label) => <div key={rowKey} className="flex min-h-8 items-stretch" dir="ltr">
    <span className={trackLabel} dir="rtl" title={title ?? label}>{label}</span>
    <div className={lane} data-audio-lane={rowKey.startsWith("clip:") ? "true" : undefined} style={{ width }}>
      <span className="pointer-events-none absolute inset-y-0 z-[1] w-px bg-white/70" style={{ left: `${playhead / safeTotal * 100}%` }} aria-hidden="true" />
      {content}
    </div>
  </div>;

  return <section className="unified-timeline-tracks flex min-h-0 flex-1 flex-col overflow-hidden border-t border-line" aria-label="تایم‌لاین چندترکی پروژه">
    {(undoAudio.length > 0 || redoAudio.length > 0 || selectedAudioIds.size > 0) && <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1" dir="rtl">
      <button type="button" data-timeline-action="undo" className="min-h-8 rounded border border-line bg-[#1d2939] px-2 text-xs disabled:opacity-40" title="آخرین ویرایش کلیپ در این جلسه را برمی‌گرداند." aria-label="برگرداندن ویرایش کلیپ" disabled={!undoAudio.length} onClick={undo}>واچرخانی</button>
      <button type="button" data-timeline-action="redo" className="min-h-8 rounded border border-line bg-[#1d2939] px-2 text-xs disabled:opacity-40" title="ویرایشی را که برگردانده‌اید دوباره اجرا می‌کند." aria-label="بازانجام ویرایش کلیپ" disabled={!redoAudio.length} onClick={redo}>بازانجام</button>
      {selectedAudioIds.size === 1 && <button type="button" data-timeline-action="split" className="min-h-8 rounded border border-line bg-[#1d2939] px-2 text-xs" title="کلیپ انتخاب‌شده را در محل نشانگر به دو بخش تقسیم می‌کند و فایل اصلی را حفظ می‌کند." onClick={() => { const id = [...selectedAudioIds][0]!; commitAudio(splitAudioClip(props.audio, id, props.currentFrame, props.fps, () => crypto.randomUUID())); }}>تقسیم در نشانگر</button>}
      {selectedAudioIds.size === 2 && <button type="button" data-timeline-action="merge" className="min-h-8 rounded border border-accent/60 bg-[#123b3b] px-2 text-xs disabled:cursor-not-allowed disabled:opacity-40" disabled={!mergeAllowed} title={mergeAllowed ? "دو کلیپ پی‌درپی از یک فایل را پیوند می‌دهد؛ گوینده‌ها قابل حفظ یا پاک‌سازی‌اند." : "برای ادغام، دو کلیپ از یک فایل با منبع پیوسته را انتخاب کنید. کلیپ‌های هم‌پوشان جدا می‌مانند و به‌صورت میکس پخش می‌شوند."} onClick={() => { if (mergeAllowed) setMergePrompt({ firstId: selectedClips[0]!.id, secondId: selectedClips[1]!.id }); }}>ادغام پی‌درپی</button>}
      {selectedAudioIds.size > 1 && <span className="text-[10px] text-muted" role="status">کلیپ‌های هم‌پوشان جدا می‌مانند و هم‌زمان پخش می‌شوند (میکس).</span>}
    </div>}
    <div className="flex min-h-8 flex-none items-center justify-between gap-2 border-b border-line px-2" dir="rtl">
      <div className="flex min-w-0 items-center gap-2"><h3 className="shrink-0 text-[11px] font-bold">ترک‌های پروژه</h3><span className="hidden truncate text-[10px] text-muted lg:inline">گوینده زیر نشانگر زمان: {activeSpeakerLabel} · پخش صدا از جایگاه نشانگر و با زمان فایل هماهنگ است</span><ContextHelpTrigger topic="timeline" onOpen={props.onHelp} /></div>
      <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[420px]" title="نشانگر را به فریم دلخواه پروژه می‌برد؛ داده‌های صحنه و کلیپ را تغییر نمی‌دهد.">
        <span className="shrink-0 font-mono text-[10px] tabular-nums" dir="ltr">{clock(playhead, props.fps)}</span>
        <input className="w-full accent-[#40d7c5]" type="range" min={0} max={props.totalFrames} step={1} value={playhead} disabled={!props.totalFrames} aria-label="جابه‌جایی در تایم‌لاین چندترکی" onChange={(event) => props.onSeek(Number(event.target.value))} />
      </label>
      <div className="flex shrink-0 items-center gap-1" dir="ltr" aria-label="کنترل مقیاس تایم‌لاین">
        <button type="button" className="min-h-7 min-w-7 max-[767px]:min-h-11 max-[767px]:min-w-11 rounded border border-line bg-[#1d2939] text-sm text-foreground hover:bg-[#28394b] focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40" title="نمایش بازهٔ زمانی گسترده‌تر؛ موقعیت رویدادها تغییر نمی‌کند." aria-label="کوچک‌نمایی تایم‌لاین" disabled={zoom <= 0.5} onClick={() => setZoom((value) => Math.max(0.5, Number((value / 1.25).toFixed(2))))}>−</button>
        <span className="min-w-10 text-center font-mono text-[10px] tabular-nums text-muted" aria-live="polite">{Math.round(zoom * 100)}٪</span>
        <button type="button" className="min-h-7 min-w-7 max-[767px]:min-h-11 max-[767px]:min-w-11 rounded border border-line bg-[#1d2939] text-sm text-foreground hover:bg-[#28394b] focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40" title="نمایش جزئیات زمانی بیشتر؛ موقعیت رویدادها تغییر نمی‌کند." aria-label="بزرگ‌نمایی تایم‌لاین" disabled={zoom >= 4} onClick={() => setZoom((value) => Math.min(4, Number((value * 1.25).toFixed(2))))}>+</button>
        <button type="button" className="min-h-7 max-[767px]:min-h-11 rounded border border-line bg-[#1d2939] px-2 text-[10px] text-foreground hover:bg-[#28394b] focus-visible:outline-2 focus-visible:outline-accent" title="مقیاس پایهٔ پروژه را بازمی‌گرداند؛ برای ادامهٔ زمان، افقی پیمایش کنید." onClick={() => setZoom(1)}>پروژه</button>
      </div>
    </div>
    {!props.sceneOrder.length ? <div className="grid flex-1 place-items-center p-4 text-center text-xs text-muted">برای نمایش ترک‌های صحنه و حرکت، ابتدا از بخش «سکانس‌ها» یک سکانس بسازید. کلیپ‌های صوتی را می‌توانید از بخش «صدا» وارد کنید.</div> :
      <div ref={trackScroller} className="min-h-0 flex-1 overflow-auto overscroll-contain" dir="ltr" aria-label="ردیف‌های قابل پیمایش تایم‌لاین">
        <div className="min-w-max">
          <div className="sticky top-0 z-[3] flex h-7 items-stretch border-b border-line bg-[#172333]" dir="ltr">
            <span className={`${trackLabel} top-0 bg-[#172333]`} dir="rtl">ترک / زمان</span>
            <div className="relative h-full shrink-0" style={{ width }} aria-label="خط‌کش LTR تایم‌لاین">
              {ticks.map((frame) => <span key={frame} className="absolute top-1 font-mono text-[9px] text-[#9fb1c3]" style={{ left: `${frame / safeTotal * 100}%` }}>{clock(frame, props.fps)}</span>)}
            </div>
          </div>
          {laneRow("سکانس‌ها", <>{offsets.map((entry, index) => {
            const scene = props.scenes[entry.sceneId];
            if (!scene) return null;
            return <button key={entry.sceneId} data-scene-drop-target={entry.sceneId} type="button" className={`absolute inset-y-1 min-w-0 truncate rounded border px-1 text-[9px] ${dropSceneId === entry.sceneId ? "border-emerald-300 bg-emerald-700 ring-2 ring-emerald-300" : props.activeSceneId === entry.sceneId ? "border-accent bg-[#1b5550] text-white" : "border-[#52677c] bg-[#355064] text-[#e8f1f8]"}`} style={{ left: `${entry.startFrame / safeTotal * 100}%`, width: `${scene.durationFrames / safeTotal * 100}%` }} aria-pressed={props.activeSceneId === entry.sceneId} title={`${index + 1}. ${scene.name} · شروع ${clock(entry.startFrame, props.fps)} · برای افزودن یا انتقال صدا روی سکانس رها کنید`} onDragEnter={(event) => { if (event.dataTransfer.files.length || event.dataTransfer.types.includes("Files") || event.dataTransfer.types.includes("application/x-signal-audio-asset")) setDropSceneId(entry.sceneId); }} onDragOver={(event) => { if (event.dataTransfer.files.length || event.dataTransfer.types.includes("Files") || event.dataTransfer.types.includes("application/x-signal-audio-asset")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDropSceneId(entry.sceneId); } }} onDragLeave={() => setDropSceneId((current) => current === entry.sceneId ? null : current)} onDrop={(event) => { void sceneDrop(event, entry.sceneId); }} onClick={() => props.onSelectScene(entry.sceneId)}>{dropSceneId === entry.sceneId ? "رها کنید تا صدا به این سکانس افزوده شود" : `${index + 1}. ${scene.name}`}</button>;
          })}</>)}
          {actionTracks.map((track) => laneRow(`${props.characterNames[track.actorId] ?? "شخصیت"} · ${categoryNames[track.category] ?? track.category}`, <>{track.events.map(({ sceneId, startFrame, event }) => {
            const globalFrame = drag?.eventId === event.id ? drag.frame : startFrame;
            const scene = props.scenes[sceneId];
            const offset = offsetById.get(sceneId)?.startFrame ?? 0;
            const color = eventColors[track.category as keyof typeof eventColors] ?? eventColors.head;
            return <div key={`${sceneId}:${event.id}`} className={`absolute inset-y-1 flex min-w-0 overflow-hidden rounded border ${color} ${props.selectedEventId === event.id ? "ring-2 ring-accent" : ""} ${event.enabled ? "" : "opacity-40"}`} style={{ left: `${globalFrame / safeTotal * 100}%`, width: `${Math.max(0.8, event.durationFrames / safeTotal * 100)}%` }}>
              <button type="button" className="min-h-full shrink-0 cursor-grab touch-none border-r border-white/20 px-1 text-[9px] active:cursor-grabbing" aria-label={`جابجایی ${sceneActionLabels[event.action]} با کشیدن یا کلیدهای چپ و راست`} title="این دستگیره را افقی بکشید یا با کلیدهای چپ و راست یک فریم جابه‌جا کنید؛ مدت ثابت می‌ماند." onKeyDown={(key) => { if (key.key === "ArrowLeft" || key.key === "ArrowRight") { key.preventDefault(); key.stopPropagation(); const next = Math.max(offset, Math.min(offset + (scene?.durationFrames ?? 1) - event.durationFrames, globalFrame + (key.key === "ArrowRight" ? 1 : -1))); props.onMoveEvent(sceneId, event.id, next - offset); } }} onPointerDown={(pointer) => { pointer.preventDefault(); pointer.stopPropagation(); pointer.currentTarget.setPointerCapture(pointer.pointerId); setDrag({ sceneId, eventId: event.id, originX: pointer.clientX, originFrame: startFrame, frame: startFrame }); }} onPointerMove={movePointer} onPointerUp={finishPointer} onPointerCancel={() => setDrag(null)}>⠿</button>
              <button type="button" className="min-w-0 flex-1 truncate px-1 text-left text-[9px] text-white focus-visible:outline-2 focus-visible:outline-accent" aria-pressed={props.selectedEventId === event.id} title={`${scene?.name ?? "سکانس"} · ${sceneActionLabels[event.action]} · انتخاب و رفتن به زمان رویداد`} aria-label={`${scene?.name ?? "سکانس"}، ${props.characterNames[track.actorId] ?? "شخصیت"}، ${sceneActionLabels[event.action]}، ${clock(globalFrame, props.fps)}`} onClick={() => props.onSelectEvent(sceneId, event.id, globalFrame)}>{sceneActionLabels[event.action]}</button>
            </div>;
          })}</>))}
          {!clips.length && laneRow("صدا", <span className="absolute inset-y-1 left-1 flex items-center rounded border border-dashed border-line px-2 text-[9px] text-muted">کلیپ صوتی در تایم‌لاین نیست · از بخش صدا اضافه کنید</span>)}
          {clips.map((clip, index) => {
            const clipRange = audioClipFrameRange(clip, props.fps);
            const durationFrames = clipRange.endFrame - clipRange.startFrame;
            const visualStartFrame = audioDrag?.clipId === clip.id ? (audioDrag.mode === "move" ? Math.max(0, audioDrag.frame - audioDrag.grabOffset) : audioDrag.mode === "start" ? audioDrag.frame : clip.startFrame) : clip.startFrame;
            const visualEndFrame = audioDrag?.clipId === clip.id && audioDrag.mode === "end" ? audioDrag.frame : audioDrag?.clipId === clip.id && audioDrag.mode === "start" ? clipRange.endFrame : audioDrag?.clipId === clip.id && audioDrag.mode === "move" ? audioDrag.frame - audioDrag.grabOffset + durationFrames : clipRange.endFrame;
            const selected = props.selectedAudioClipId === clip.id || selectedAudioIds.has(clip.id);
            const activeSceneEntry = props.activeSceneId ? offsetById.get(props.activeSceneId) : undefined;
            const activeScene = props.activeSceneId ? props.scenes[props.activeSceneId] : undefined;
            const relation = activeSceneEntry && activeScene ? clipSceneRelation(clip, activeSceneEntry.startFrame, activeScene.durationFrames, props.fps) : null;
            const relationLabel = relation === "inside" ? `داخل ${activeScene?.name}` : relation === "spans" ? `از مرز ${activeScene?.name} عبور می‌کند` : relation === "before" ? `پیش از ${activeScene?.name}` : relation === "after" ? `پس از ${activeScene?.name}` : "سکانس فعال نامشخص";
            const regions = Object.values(props.audio.speakerRegions).filter((item) => item.audioClipId === clip.id);
            const speakerLabels = regions.map((region) => {
              if (region.status === "silence") return "سکوت";
              if (region.status === "unknown") return "گوینده نامشخص";
              const speaker = region.speakerId ? props.audio.speakers[region.speakerId] : null;
              return speaker?.kind === "character" ? props.identityNames[speaker.characterId] ?? speaker.name : speaker?.name ?? "گوینده ناموجود";
            });
            return <div key={`clip:${clip.id}`}>
              {laneRow(`صدا ${String(index + 1).padStart(2, "0")} · ${props.assetNames[clip.assetId] ?? "فایل ناموجود"}`, <><span className="pointer-events-none absolute inset-y-0 z-0 border-x border-accent/30 bg-[#40d7c5]/5" style={{ left: `${(activeSceneEntry?.startFrame ?? 0) / safeTotal * 100}%`, width: `${(activeScene?.durationFrames ?? 0) / safeTotal * 100}%` }} aria-hidden="true" /><button type="button" className={`absolute inset-y-1 z-[2] flex min-w-0 items-center justify-between gap-2 truncate rounded border px-1 pb-2 text-left text-[9px] text-white ${clip.muted ? "border-slate-400 bg-slate-600/60 opacity-70" : "border-cyan-300/60 bg-cyan-700/70"} ${selected ? "ring-2 ring-accent" : ""}`} style={{ left: `${visualStartFrame / safeTotal * 100}%`, width: `${Math.max(1, visualEndFrame - visualStartFrame) / safeTotal * 100}%` }} aria-pressed={selected} title={`${props.assetNames[clip.assetId] ?? "فایل ناموجود"} · شروع ${clock(clipRange.startFrame, props.fps)} · پایان ${clock(clipRange.endFrame, props.fps)} · برش منبع ${clip.sourceStartSeconds.toFixed(2)} تا ${clip.sourceEndSeconds.toFixed(2)} ثانیه · ${relationLabel}؛ برای ویرایش انتخاب کنید`} aria-label={`انتخاب کلیپ صوتی ${props.assetNames[clip.assetId] ?? "ناموجود"}، گویندگان: ${speakerLabels.join("، ") || "ندارد"}، ترک ${index + 1}، از ${clock(clipRange.startFrame, props.fps)} تا ${clock(clipRange.endFrame, props.fps)}`} onClick={(event) => { if (event.ctrlKey || event.metaKey) { setMultiSelectedAudioIds((current) => { const next = new Set(current ?? (props.selectedAudioClipId ? [props.selectedAudioClipId] : [])); if (next.has(clip.id)) next.delete(clip.id); else next.add(clip.id); return [...next]; }); } else { setMultiSelectedAudioIds(null); props.onSelectAudio(clip.assetId, clip.id, clip.startFrame); } }} onPointerDown={(event) => beginAudioDrag(event, clip.id, "move")} onPointerMove={audioPointerMove} onPointerUp={audioPointerEnd} onPointerCancel={() => setAudioDrag(null)} onKeyDown={(key) => { if (key.key === "ArrowLeft" || key.key === "ArrowRight") { key.preventDefault(); key.stopPropagation(); const delta = (key.key === "ArrowRight" ? 1 : -1) * (key.shiftKey ? 10 : 1); commitAudio(moveAudioClip(props.audio, clip.id, snapTimelineFrame(Math.max(0, clip.startFrame + delta), [0, ...offsets.map((entry) => entry.startFrame), ...clips.filter((item) => item.id !== clip.id).flatMap((item) => { const range = audioClipFrameRange(item, props.fps); return [range.startFrame, range.endFrame]; })]))); } }}><span className="min-w-0 flex-1 truncate">{props.assetNames[clip.assetId] ?? "فایل ناموجود"}{speakerLabels.length ? ` · ${speakerLabels.join("، ")}` : ""}</span><span className="hidden shrink-0 font-mono md:inline">{clock(clipRange.startFrame, props.fps)}–{clock(clipRange.endFrame, props.fps)}</span>{clip.muted ? " · بی‌صدا" : ""}</button><button type="button" className="absolute inset-y-1 z-[4] w-2 cursor-ew-resize rounded-l border-l border-white/70 bg-sky-200/70" style={{ left: `${visualStartFrame / safeTotal * 100}%` }} aria-label={`برش آغاز ${props.assetNames[clip.assetId] ?? "کلیپ صوتی"}`} title="لبه را بکشید تا ابتدای کلیپ را کوتاه کنید؛ فایل اصلی حفظ می‌شود." onPointerDown={(event) => beginAudioDrag(event, clip.id, "start")} onPointerMove={audioPointerMove} onPointerUp={audioPointerEnd} onPointerCancel={() => setAudioDrag(null)} /><button type="button" className="absolute inset-y-1 z-[4] w-2 cursor-ew-resize rounded-r border-r border-white/70 bg-sky-200/70" style={{ left: `${visualEndFrame / safeTotal * 100}%` }} aria-label={`برش پایان ${props.assetNames[clip.assetId] ?? "کلیپ صوتی"}`} title="لبه را بکشید تا پایان کلیپ را کوتاه کنید؛ فایل اصلی حفظ می‌شود." onPointerDown={(event) => beginAudioDrag(event, clip.id, "end")} onPointerMove={audioPointerMove} onPointerUp={audioPointerEnd} onPointerCancel={() => setAudioDrag(null)} />{regions.map((region) => {
                const regionRange = speakerRegionFrameRange(clip, region, props.fps);
                const regionStart = regionRange.startFrame;
                const regionFrames = regionRange.endFrame - regionRange.startFrame;
                const speaker = region.speakerId ? props.audio.speakers[region.speakerId] : null;
                const speakerName = speaker?.kind === "character" ? props.identityNames[speaker.characterId] ?? speaker.name : speaker?.name;
                const label = region.status === "silence" ? "سکوت" : region.status === "unknown" ? "نامشخص" : speakerName ?? "گویندهٔ ناموجود";
                const regionSelected = props.selectedSpeakerRegionId === region.id;
                const colorKey = speaker?.kind === "character" ? speaker.characterId : speaker?.id;
                const color = colorKey ? speakerColor(colorKey) : region.status === "silence" ? "bg-slate-600/80" : "bg-gray-600/80";
                return <button key={region.id} type="button" className={`absolute bottom-1 z-[3] h-2 min-w-0 overflow-hidden rounded-sm border border-white/35 text-[7px] leading-[7px] text-white ${color} ${regionSelected ? "ring-2 ring-accent" : ""} ${clip.muted ? "opacity-60" : ""}`} style={{ left: `${regionStart / safeTotal * 100}%`, width: `${regionFrames / safeTotal * 100}%` }} aria-pressed={regionSelected} title={`گوینده: ${label} · فایل ${region.startSeconds.toFixed(2)} تا ${region.endSeconds.toFixed(2)} ثانیه · پروژه ${clock(regionRange.startFrame, props.fps)} تا ${clock(regionRange.endFrame, props.fps)}؛ برای ویرایش انتخاب کنید`} aria-label={`انتخاب بازه گوینده ${label}، ${clock(regionRange.startFrame, props.fps)} تا ${clock(regionRange.endFrame, props.fps)}`} onClick={() => props.onSelectAudio(clip.assetId, clip.id, regionStart, region.id)}><span className="hidden">{label}</span></button>;
              })}</>, undefined, `clip:${clip.id}`)}
            </div>;
          })}
          {laneRow("دوربین · آینده", <span className="absolute inset-y-1 left-1 flex items-center rounded border border-dashed border-line px-2 text-[9px] text-muted" title="رویدادهای دوربین هنوز در تایم‌لاین قابل اجرا نیستند.">در دسترس نیست · فاز ۰۹</span>)}
          {laneRow("زیرنویس · آینده", <span className="absolute inset-y-1 left-1 flex items-center rounded border border-dashed border-line px-2 text-[9px] text-muted" title="ترک زیرنویس هنوز پیاده‌سازی نشده است.">در دسترس نیست · فاز آینده</span>)}
        </div>
      </div>}
    {mergePrompt && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="audio-merge-title">
      <div className="grid w-full max-w-md gap-3 rounded-lg border border-line bg-[#111a25] p-4 text-right" dir="rtl">
        <h3 id="audio-merge-title" className="text-sm font-bold">ادغام کلیپ‌های پی‌درپی</h3>
        <p className="text-xs leading-6 text-muted">این دو کلیپ از یک فایل و پیوسته‌اند. اگر گوینده‌هایشان متفاوت است، بازه‌های فعلی حفظ می‌شوند یا می‌توانید گوینده را نامشخص کنید. فایل صوتی اصلی دست‌نخورده می‌ماند.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" data-timeline-action="merge-preserve-speakers" className="min-h-9 rounded border border-accent/60 bg-[#123b3b] px-3 text-xs" onClick={() => { const { firstId, secondId } = mergePrompt; commitAudio(mergeAudioClips(props.audio, firstId, secondId, props.fps, "preserve", () => crypto.randomUUID())); setMultiSelectedAudioIds([firstId]); setMergePrompt(null); }}>حفظ گوینده‌ها</button>
          <button type="button" data-timeline-action="merge-unknown-speaker" className="min-h-9 rounded border border-line bg-[#1d2939] px-3 text-xs" onClick={() => { const { firstId, secondId } = mergePrompt; commitAudio(mergeAudioClips(props.audio, firstId, secondId, props.fps, "unknown", () => crypto.randomUUID())); setMultiSelectedAudioIds([firstId]); setMergePrompt(null); }}>نامشخص‌کردن گوینده</button>
          <button type="button" className="min-h-9 rounded border border-line px-3 text-xs" onClick={() => setMergePrompt(null)}>انصراف</button>
        </div>
      </div>
    </div>}
  </section>;
}
