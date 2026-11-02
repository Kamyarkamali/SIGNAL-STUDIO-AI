"use client";

import { useMemo, useRef, useState } from "react";
import { ContextHelpTrigger } from "@/components/help/context-help";
import { characterModelRegistry } from "@/lib/characters/character-registry";
import { getPreviewActionAvailability, type CharacterPreviewActionId } from "@/lib/characters/animation-preview";
import { supportedGazeCapability } from "@/lib/characters/gaze-preview";
import type { CharacterProjectData } from "@/lib/characters/character-schema";
import { propDisplayLabel } from "@/lib/environments/arrangement";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import { sceneActionLabels } from "@/lib/scenes/scene-action-labels";
import { EventTimeRangeInput } from "./event-timing-input";
import { sceneActionTypes, type SceneActionEvent, type SceneDefinition } from "@/lib/scenes/scene-schema";

const actionOptions = sceneActionTypes.filter((action) => action !== "gaze-character" && action !== "gaze-prop");
const button = "min-h-9 rounded-md border border-line bg-[#1b2736] px-3 text-xs font-semibold text-foreground transition-colors hover:bg-[#26364a] focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45";

export function SceneActionEditor({ scene, characters, arrangement, fps, localFrame, onAdd, onSelectEvent, onReorderEvent, selectedEventId, onHelp }: {
  scene: SceneDefinition | null;
  characters: CharacterProjectData;
  arrangement: EnvironmentArrangement | null;
  fps: number;
  localFrame: number;
  selectedEventId: string | null;
  onAdd: (event: SceneActionEvent) => void;
  onSelectEvent: (id: string) => void;
  onReorderEvent: (id: string, index: number) => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  const [characterId, setCharacterId] = useState("");
  const [action, setAction] = useState<SceneActionEvent["action"]>("head-nod");
  const [targetValue, setTargetValue] = useState("");
  const [creationRange, setCreationRange] = useState<{ startFrame: number; endFrame: number } | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const creationRangeRef = useRef<{ startFrame: number; endFrame: number } | null>(null);
  const characterOptions = useMemo(() => scene ? Object.keys(scene.characters).flatMap((id) => {
    const instance = characters.characterInstances[id];
    const identity = instance && characters.characterIdentities[instance.characterId];
    const model = identity && characterModelRegistry.get(identity.modelId);
    if (!instance || !identity || !scene.characters[id]?.visible) return [];
    return [{ id, name: identity.name, capabilities: model && !model.glb ? model.capabilities.animationCapabilities.filter((item): item is "head-rotation" | "arm-gesture" | "facial-expression" => item === "head-rotation" || item === "arm-gesture" || item === "facial-expression") : [], joints: model?.attachmentPoints ?? [], canGaze: Boolean(model && supportedGazeCapability(model)) }];
  }) : [], [scene, characters]);
  const actor = characterOptions.find((item) => item.id === characterId) ?? characterOptions[0];
  const effectiveCharacterId = actor?.id ?? "";
  const targetOptions = useMemo(() => [
    ...characterOptions.filter((item) => item.id !== effectiveCharacterId).map((item) => ({ value: `character:${item.id}`, label: item.name })),
    ...(arrangement?.props ?? []).filter((prop) => prop.visible).map((prop) => ({ value: `prop:${prop.id}`, label: arrangement ? propDisplayLabel(arrangement, prop) : prop.id })),
  ], [arrangement, characterOptions, effectiveCharacterId]);
  const availableActions = useMemo(() => {
    if (!actor) return [] as SceneActionEvent["action"][];
    const supported = new Set(getPreviewActionAvailability(actor.capabilities, actor.joints).filter((item) => item.supported).map((item) => item.id));
    return [
      ...actionOptions.filter((item) => item === "return-idle" || supported.has(item as CharacterPreviewActionId)),
      ...(actor.canGaze && targetOptions.some((item) => item.value.startsWith("character:")) ? ["gaze-character" as const] : []),
      ...(actor.canGaze && targetOptions.some((item) => item.value.startsWith("prop:")) ? ["gaze-prop" as const] : []),
    ];
  }, [actor, targetOptions]);
  const normalizedAction = availableActions.includes(action) ? action : availableActions[0] ?? "head-nod";
  const localStart = scene ? Math.max(0, Math.min(scene.durationFrames - 1, Math.floor(localFrame))) : 0;
  const durationFrames = Math.min(45, Math.max(1, (scene?.durationFrames ?? 1) - localStart));
  const creationStart = creationRange?.startFrame ?? localStart;
  const creationEnd = creationRange?.endFrame ?? localStart + durationFrames;
  const targetRequired = normalizedAction === "gaze-character" || normalizedAction === "gaze-prop";
  const compatibleTargets = targetOptions.filter((item) => item.value.startsWith(normalizedAction === "gaze-character" ? "character:" : "prop:"));
  const activeTarget = compatibleTargets.some((item) => item.value === targetValue) ? targetValue : compatibleTargets[0]?.value ?? "";

  const addEvent = () => {
    if (!scene || !actor || !availableActions.includes(normalizedAction) || targetRequired && !activeTarget) return;
    const startFrame = creationRangeRef.current?.startFrame ?? creationStart;
    const endFrame = creationRangeRef.current?.endFrame ?? creationEnd;
    if (startFrame < 0 || endFrame > scene.durationFrames || endFrame <= startFrame) return;
    const [targetKind, targetId] = activeTarget ? activeTarget.split(":", 2) : [];
    onAdd({ id: crypto.randomUUID(), sceneId: scene.id, characterInstanceId: actor.id, action: normalizedAction, startFrame, durationFrames: endFrame - startFrame,
      enabled: true, priority: 0, intensity: 1, speed: 1,
      ...(targetRequired && targetId ? { targetKind: targetKind as "character" | "prop", targetId } : {}),
    });
  };

  return <section className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3" aria-label="ویرایش حرکت‌های زمان‌بندی‌شده">
    <header className="flex items-center justify-between gap-2 border-b border-line pb-2">
      <div><h2 className="text-sm font-bold">حرکت‌های سکانس</h2><p className="mt-1 text-[11px] text-muted">{scene ? scene.name : "ابتدا یک سکانس بسازید یا انتخاب کنید."}</p></div>
      <ContextHelpTrigger topic="timelineActions" onOpen={onHelp} />
    </header>
    {!scene ? <p className="rounded-lg border border-line bg-[#111a26] p-3 text-xs leading-6 text-muted">برای ساخت حرکت، یک پروژه و سکانس فعال لازم است. انتخاب سکانس در storyboard، تایم‌لاین و نمای سه‌بعدی مشترک است.</p> : <>
      {!characterOptions.length ? <p className="rounded-lg border border-line bg-[#111a26] p-3 text-xs leading-6 text-muted">در این سکانس شخصیت قابل‌نمایشی وجود ندارد. ابتدا از بخش «شخصیت‌ها» یک شخصیت به سکانس اضافه کنید.</p> : <>
        <label className="grid min-w-0 gap-1 text-xs"><span>شخصیت</span><select className="min-h-9 w-full min-w-0 rounded-md border border-line bg-[#101722] px-2" value={effectiveCharacterId} onChange={(event) => setCharacterId(event.target.value)} title="شخصیتی را تعیین می‌کند که رویداد جدید فقط روی نمونهٔ همین سکانس اجرا شود.">
          {characterOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label className="grid min-w-0 gap-1 text-xs"><span>حرکت پشتیبانی‌شده</span><select className="min-h-9 w-full min-w-0 rounded-md border border-line bg-[#101722] px-2" value={normalizedAction} onChange={(event) => setAction(event.target.value as SceneActionEvent["action"])} title="فقط حرکت‌هایی را نشان می‌دهد که کانال‌های مدل این شخصیت پشتیبانی می‌کنند.">
          {availableActions.map((item) => <option key={item} value={item}>{sceneActionLabels[item]}</option>)}
        </select></label>
        {targetRequired && <label className="grid min-w-0 gap-1 text-xs"><span>هدف نگاه</span><select className="min-h-9 w-full min-w-0 rounded-md border border-line bg-[#101722] px-2" value={activeTarget} onChange={(event) => setTargetValue(event.target.value)} title="هدف ثابت و شناسه‌دار نگاه را برای همین رویداد انتخاب می‌کند.">
          {compatibleTargets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select></label>}
        <EventTimeRangeInput idPrefix="new-event-time" startFrame={creationStart} durationFrames={creationEnd - creationStart} sceneDurationFrames={scene.durationFrames} fps={fps}
          onCommit={(startFrame, committedDuration) => {
            const next = { startFrame, endFrame: startFrame + committedDuration };
            creationRangeRef.current = next;
            setCreationRange(next);
          }} />
        <button type="button" className={button} onClick={addEvent} disabled={!availableActions.length || targetRequired && !activeTarget} title="حرکت انتخاب‌شده را با زمان شروع و مدت واردشده فقط در سکانس فعلی ثبت می‌کند.">افزودن حرکت به سکانس</button>
      </>}
      <details className="border-t border-line pt-3">
        <summary className="cursor-pointer list-none rounded-md px-1 py-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-accent" title="فهرست رویدادهای همین سکانس را باز یا جمع می‌کند؛ ترتیب اصلی تایم‌لاین تغییر نمی‌کند.">رویدادهای این سکانس <span className="text-muted">({scene.actionEvents.length})</span></summary>
        <ul className="mt-2 flex max-h-52 min-w-0 flex-col gap-1.5 overflow-y-auto">{scene.actionEvents.map((event, index) => {
          const actorName = characterOptions.find((item) => item.id === event.characterInstanceId)?.name ?? "شخصیت حذف‌شده";
          return <li key={event.id} className={`flex min-w-0 items-stretch gap-1 rounded-md border p-1 ${selectedEventId === event.id ? "border-accent bg-[#17343a]" : "border-line bg-[#121b27]"} ${draggedEventId === event.id ? "opacity-50" : ""}`} onDragOver={(nativeEvent) => { if (draggedEventId) nativeEvent.preventDefault(); }} onDrop={(nativeEvent) => { nativeEvent.preventDefault(); const id = nativeEvent.dataTransfer.getData("text/plain") || draggedEventId; if (id) onReorderEvent(id, index); setDraggedEventId(null); }}>
            <button type="button" draggable className="cursor-grab px-1 text-muted active:cursor-grabbing" aria-label={`گرفتن برای تغییر ترتیب رویداد ${index + 1}`} title="برای تغییر ترتیب فهرست بکشید؛ زمان اجرا و اولویت رویداد تغییر نمی‌کند." onDragStart={(nativeEvent) => { nativeEvent.dataTransfer.effectAllowed = "move"; nativeEvent.dataTransfer.setData("text/plain", event.id); setDraggedEventId(event.id); }} onDragEnd={() => setDraggedEventId(null)}>⠿</button>
            <button type="button" className="min-w-0 flex-1 px-1 py-1 text-right text-xs" onClick={() => onSelectEvent(event.id)} title="رویداد را برای ویرایش انتخاب می‌کند؛ جایگاه زمانی را تغییر نمی‌دهد.">
              <span className="block truncate font-semibold">{index + 1}. {actorName} · {sceneActionLabels[event.action]}{event.enabled ? "" : " · غیرفعال"}</span>
              <span className="mt-1 block font-mono text-[10px] text-muted" dir="ltr">{(event.startFrame / fps).toFixed(2)}s · {event.durationFrames}f</span>
            </button>
            <span className="flex flex-col justify-center gap-0.5">
              <button type="button" className="h-5 w-6 rounded text-[10px] hover:bg-[#29394a] disabled:opacity-35" aria-label={`انتقال رویداد ${index + 1} به بالای فهرست`} title="ترتیب نمایشی رویداد را یک ردیف بالا می‌برد؛ زمان اجرا ثابت می‌ماند." disabled={index === 0} onClick={() => onReorderEvent(event.id, index - 1)}>↑</button>
              <button type="button" className="h-5 w-6 rounded text-[10px] hover:bg-[#29394a] disabled:opacity-35" aria-label={`انتقال رویداد ${index + 1} به پایین فهرست`} title="ترتیب نمایشی رویداد را یک ردیف پایین می‌برد؛ زمان اجرا ثابت می‌ماند." disabled={index === scene.actionEvents.length - 1} onClick={() => onReorderEvent(event.id, index + 1)}>↓</button>
            </span>
          </li>;
        })}</ul>
        {!scene.actionEvents.length && <p className="text-[11px] leading-5 text-muted">هنوز حرکتی زمان‌بندی نشده است.</p>}
      </details>
    </>}
  </section>;
}
