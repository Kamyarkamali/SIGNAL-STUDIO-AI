"use client";

import { useState } from "react";
import { ContextHelpTrigger } from "@/components/help/context-help";
import { characterModelRegistry } from "@/lib/characters/character-registry";
import { isPreviewActionSupported, type CharacterPreviewActionId } from "@/lib/characters/animation-preview";
import { supportedGazeCapability } from "@/lib/characters/gaze-preview";
import type { CharacterProjectData } from "@/lib/characters/character-schema";
import { propDisplayLabel, type EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import { sceneActionLabels } from "@/lib/scenes/scene-action-labels";
import { sceneActionTypes, type SceneActionEvent, type SceneDefinition } from "@/lib/scenes/scene-schema";
import { EventTimeRangeInput } from "./event-timing-input";

const actionOptions = sceneActionTypes.filter((action) => action !== "gaze-character" && action !== "gaze-prop");
const field = "min-h-9 rounded-md border border-line bg-[#101722] px-2 text-xs text-foreground";
const btn = "min-h-8 rounded-md border border-line bg-[#1b2736] px-2 text-xs hover:bg-[#28394b] focus-visible:outline-2 focus-visible:outline-accent";

export function SceneActionInspector({ scene, event, characters, arrangement, fps, onUpdate, onDelete, onPreview, onHelp }: {
  scene: SceneDefinition | null;
  event: SceneActionEvent | null;
  characters: CharacterProjectData;
  arrangement: EnvironmentArrangement | null;
  fps: number;
  onUpdate: (id: string, change: Partial<Omit<SceneActionEvent, "id">>) => void;
  onDelete: (id: string) => void;
  onPreview: (event: SceneActionEvent) => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!scene || !event) return <section className="p-3" aria-label="بازرس حرکت">
    <header className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">ویژگی‌های حرکت</h2><ContextHelpTrigger topic="timelineActions" onOpen={onHelp} /></header>
    <p className="rounded-lg border border-line bg-[#111a26] p-3 text-xs leading-6 text-muted">یک رویداد را از فهرست حرکت‌ها یا تایم‌لاین انتخاب کنید تا تنظیمات همان سکانس نمایش داده شود.</p>
  </section>;
  const instance = characters.characterInstances[event.characterInstanceId];
  const identity = instance && characters.characterIdentities[instance.characterId];
  const model = identity && characterModelRegistry.get(identity.modelId);
  const capabilities = model && !model.glb ? model.capabilities.animationCapabilities.filter((item): item is "head-rotation" | "arm-gesture" | "facial-expression" => item === "head-rotation" || item === "arm-gesture" || item === "facial-expression") : [];
  const canGaze = Boolean(model && supportedGazeCapability(model));
  const allowedActions = [
    ...actionOptions.filter((item) => item === "return-idle" || isPreviewActionSupported(item as CharacterPreviewActionId, capabilities)),
    ...(canGaze && Object.keys(scene.characters).some((id) => id !== event.characterInstanceId) ? ["gaze-character" as const] : []),
    ...(canGaze && arrangement?.props.some((prop) => prop.visible) ? ["gaze-prop" as const] : []),
  ];
  const allTargetOptions = [
    ...Object.keys(scene.characters).filter((id) => id !== event.characterInstanceId && scene.characters[id]?.visible).map((id) => {
      const item = characters.characterInstances[id];
      const targetIdentity = item && characters.characterIdentities[item.characterId];
      return targetIdentity ? { id, kind: "character" as const, label: targetIdentity.name } : null;
    }).filter((item): item is { id: string; kind: "character"; label: string } => Boolean(item)),
    ...(arrangement?.props ?? []).filter((prop) => prop.visible).map((prop) => ({ id: prop.id, kind: "prop" as const, label: arrangement ? propDisplayLabel(arrangement, prop) : prop.id })),
  ];
  const targetOptions = allTargetOptions.filter((item) => item.kind === event.targetKind);
  const needsTarget = event.action === "gaze-character" || event.action === "gaze-prop";
  const setAction = (action: SceneActionEvent["action"]) => {
    const targetKind = action === "gaze-character" ? "character" : action === "gaze-prop" ? "prop" : undefined;
    const target = targetKind ? allTargetOptions.find((item) => item.kind === targetKind) : undefined;
    onUpdate(event.id, { action, ...(targetKind && target ? { targetKind, targetId: target.id } : targetKind ? { targetKind, targetId: undefined } : { targetKind: undefined, targetId: undefined }) });
  };
  return <section className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3" aria-label="بازرس رویداد حرکتی">
    <header className="flex items-center justify-between gap-2 border-b border-line pb-2"><div><h2 className="text-sm font-bold">ویژگی‌های حرکت</h2><p className="mt-1 text-[11px] text-muted">{identity?.name ?? "شخصیت حذف‌شده"} · {scene.name}</p></div><ContextHelpTrigger topic="timelineActions" onOpen={onHelp} /></header>
    <label className="grid min-w-0 gap-1 text-xs"><span>نوع حرکت</span><select className={`${field} w-full min-w-0`} value={event.action} onChange={(e) => setAction(e.target.value as SceneActionEvent["action"])} title="نوع حرکتی را تغییر می‌دهد که همین رویداد روی شخصیت انتخاب‌شده اجرا می‌کند.">
      {allowedActions.map((action) => <option key={action} value={action}>{sceneActionLabels[action]}</option>)}
      {!allowedActions.includes(event.action) && <option value={event.action}>{sceneActionLabels[event.action]} · پشتیبانی نمی‌شود</option>}
    </select></label>
    {needsTarget && <label className="grid min-w-0 gap-1 text-xs"><span>هدف نگاه</span><select className={`${field} w-full min-w-0`} value={event.targetId ?? ""} onChange={(e) => onUpdate(event.id, { targetId: e.target.value || undefined })} title="هدف موجود در همین سکانس را برای جهت نگاه انتخاب می‌کند.">
      <option value="">هدف در دسترس نیست</option>{targetOptions.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
    </select></label>}
    <section className="grid min-w-0 gap-2 rounded-lg border border-line bg-[#111a26] p-2" aria-label="تنظیم زمان حرکت">
      <div><h3 className="text-xs font-semibold">زمان‌بندی حرکت</h3><p className="text-[10px] leading-5 text-muted">پایان انحصاری است؛ تغییرها فقط روی همین رویداد و سکانس ذخیره می‌شوند.</p></div>
      <EventTimeRangeInput key={event.id} idPrefix={`event-${event.id}`} startFrame={event.startFrame} durationFrames={event.durationFrames} sceneDurationFrames={scene.durationFrames} fps={fps}
        onCommit={(startFrame, durationFrames) => onUpdate(event.id, { startFrame, durationFrames })} />
    </section>
    <label className="flex min-h-9 items-center justify-between gap-2 rounded-md border border-line bg-[#111a26] px-2 text-xs"><span>اجرای رویداد فعال باشد</span><input type="checkbox" checked={event.enabled} onChange={(e) => onUpdate(event.id, { enabled: e.target.checked })} title="اجرای این رویداد را در پیش‌نمایش و تایم‌لاین روشن یا خاموش می‌کند؛ دادهٔ آن حذف نمی‌شود." /></label>
    <label className="grid min-w-0 gap-1 rounded-md border border-line bg-[#111a26] p-2 text-[11px]"><span>اولویت تعارض در کانال مشترک</span><input className={`${field} w-full min-w-0 text-left`} dir="ltr" type="number" min="-100" max="100" value={event.priority} onChange={(e) => { const value = Number(e.target.value); if (Number.isInteger(value)) onUpdate(event.id, { priority: Math.max(-100, Math.min(100, value)) }); }} title="فقط هنگام هم‌زمانی روی یک کانال مشترک اثر دارد؛ مقدار بالاتر برندهٔ آن کانال است و نگاه، چهره و دست‌های مستقل همچنان ترکیب می‌شوند." /><span className="leading-4 text-muted">اولویت فقط ترتیب حل تعارض کانال یکسان را تعیین می‌کند؛ زمان و ترتیب فهرست را تغییر نمی‌دهد.</span></label>
    <details className="rounded-md border border-line bg-[#111a26] px-2">
      <summary className="cursor-pointer list-none py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-accent" title="تنظیمات شدت و اولویت را فقط هنگام نیاز باز می‌کند.">تنظیمات پیشرفتهٔ حرکت</summary>
      <div className="flex flex-col gap-3 border-t border-line py-3">
    {!needsTarget && <>
      <label className="grid gap-1 text-[11px]"><span>شدت · {event.intensity.toFixed(2)}</span><input type="range" min="0.25" max="1.5" step="0.05" value={event.intensity} onChange={(e) => onUpdate(event.id, { intensity: Number(e.target.value) })} title="شدت همین حرکت را بدون تغییر مکان ذخیره‌شدهٔ شخصیت تنظیم می‌کند." /></label>
      <label className="grid gap-1 text-[11px]"><span>سرعت · {event.speed.toFixed(2)}</span><input type="range" min="0.5" max="2" step="0.1" value={event.speed} onChange={(e) => onUpdate(event.id, { speed: Number(e.target.value) })} title="سرعت اجرای حرکت را در بازهٔ پشتیبانی‌شده تغییر می‌دهد." /></label>
    </>}
      </div>
    </details>
    <div className="flex flex-wrap gap-2 border-t border-line pt-3">
      <button type="button" className={btn} onClick={() => onPreview(event)} title="playhead را به شروع این رویداد می‌برد و پیش‌نمایش پخش را از همان فریم آغاز می‌کند.">پیش‌نمایش حرکت</button>
      {confirmDelete ? <><button type="button" className={`${btn} border-red-500/50 text-red-200`} onClick={() => { onDelete(event.id); setConfirmDelete(false); }} title="پس از تأیید، فقط این رویداد را از سکانس جاری حذف می‌کند.">تأیید حذف</button><button type="button" className={btn} onClick={() => setConfirmDelete(false)} title="حذف را لغو می‌کند و رویداد را نگه می‌دارد.">لغو</button></> : <button type="button" className={`${btn} text-red-200`} onClick={() => setConfirmDelete(true)} title="برای جلوگیری از حذف ناخواسته، تأیید حذف همین رویداد را باز می‌کند.">حذف حرکت</button>}
    </div>
    {needsTarget && !targetOptions.length && <p className="text-[11px] leading-5 text-amber-200">هدف معتبر در این سکانس موجود نیست؛ رویداد تا انتخاب هدف معتبر قابل اجرا نیست.</p>}
  </section>;
}
