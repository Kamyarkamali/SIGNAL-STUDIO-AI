"use client";

import { useMemo, useState } from "react";
import { ContextHelpTrigger } from "@/components/help/context-help";
import { getPreviewActionAvailability, type CharacterPreviewActionId } from "@/lib/characters/animation-preview";
import { characterModelRegistry } from "@/lib/characters/character-registry";
import { supportedGazeCapability } from "@/lib/characters/gaze-preview";
import type { CharacterProjectData } from "@/lib/characters/character-schema";
import { sceneActionLabels } from "@/lib/scenes/scene-action-labels";
import type { AudioClip } from "@/lib/audio/audio-schema";
import type { SceneActionEvent, SceneDefinition } from "@/lib/scenes/scene-schema";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import type { ActiveDialogueState } from "@/lib/scenes/audio-behavior";

const control = "min-h-10 w-full min-w-0 rounded-md border border-line bg-[#111a26] px-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-accent";
const choices = ["speaking", "listening", "explain", "quick-nod", "thinking", "laughing", "happy", "gaze-character", "gaze-camera"] as const;

export function AudioBehaviorPanel({ clip, scene, sceneStartFrame, fps, characters, speakerIdentityId, activeDialogue, onMode, onAdd, onPreview, onEditEvent, onHelp }: {
  clip: AudioClip;
  scene: SceneDefinition;
  sceneStartFrame: number;
  fps: number;
  characters: CharacterProjectData;
  speakerIdentityId: string | null;
  activeDialogue: ActiveDialogueState | null;
  onMode: (mode: NonNullable<SceneDefinition["behaviorMode"]>) => void;
  onAdd: (event: SceneActionEvent) => void;
  onPreview: () => void;
  onEditEvent: (eventId: string) => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  const actors = useMemo(() => Object.keys(scene.characters).flatMap((id) => {
    const instance = characters.characterInstances[id];
    const identity = instance && characters.characterIdentities[instance.characterId];
    const model = identity && characterModelRegistry.get(identity.modelId);
    if (!identity || !scene.characters[id]?.visible || !characters.characterStates[id]?.visible || !model || model.glb) return [];
    const capabilities = model.capabilities.animationCapabilities.filter((item): item is "head-rotation" | "arm-gesture" | "facial-expression" => item === "head-rotation" || item === "arm-gesture" || item === "facial-expression");
    const supported = new Set(getPreviewActionAvailability(capabilities, model.attachmentPoints).filter((item) => item.supported).map((item) => item.id));
    return [{ id, identityId: identity.id, name: identity.name, supported, canGaze: Boolean(supportedGazeCapability(model)) }];
  }), [characters, scene]);
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState<SceneActionEvent["action"]>("speaking");
  const [targetId, setTargetId] = useState("");
  const [startSeconds, setStartSeconds] = useState(String(Math.max(0, (sceneStartFrame - clip.startFrame) / fps)));
  const clipEndFrame = clip.startFrame + Math.round((clip.sourceEndSeconds - clip.sourceStartSeconds) * fps);
  const overlapFrames = Math.max(1, Math.min(sceneStartFrame + scene.durationFrames, clipEndFrame) - Math.max(sceneStartFrame, clip.startFrame));
  const [durationSeconds, setDurationSeconds] = useState(String(Math.min(2, overlapFrames / fps)));
  const [notice, setNotice] = useState("");
  const speaker = actors.find((item) => item.identityId === speakerIdentityId);
  const actor = actors.find((item) => item.id === actorId) ?? speaker ?? actors[0];
  const effectiveActorId = actor?.id ?? "";
  const options = choices.filter((item) => item.startsWith("gaze-") ? actor?.canGaze && (item === "gaze-camera" || actors.some((other) => other.id !== effectiveActorId)) : actor?.supported.has(item as CharacterPreviewActionId));
  const selectedAction = options.find((item) => item === action) ?? options[0];
  const targets = actors.filter((item) => item.id !== effectiveActorId);
  const selectedTargetId = targets.some((item) => item.id === targetId) ? targetId : targets[0]?.id ?? "";
  const startGlobal = clip.startFrame + Math.round(Number(startSeconds) * fps);
  const startLocal = startGlobal - sceneStartFrame;
  const durationFrames = Math.round(Number(durationSeconds) * fps);
  const clipEnd = clipEndFrame;
  const valid = Boolean(actor && selectedAction && Number.isFinite(startGlobal) && Number.isFinite(durationFrames) && durationFrames > 0 && startGlobal >= clip.startFrame && startGlobal >= sceneStartFrame && startGlobal + durationFrames <= clipEnd && startLocal + durationFrames <= scene.durationFrames && (selectedAction !== "gaze-character" || selectedTargetId));
  const relatedEvents = scene.actionEvents.filter((event) => event.startFrame + event.durationFrames > clip.startFrame - sceneStartFrame && event.startFrame < clipEnd - sceneStartFrame);
  const add = () => {
    if (!valid || !actor || !selectedAction) return;
    const event: SceneActionEvent = { id: crypto.randomUUID(), sceneId: scene.id, characterInstanceId: actor.id,
      action: selectedAction, startFrame: startLocal, durationFrames, enabled: true, priority: 0, intensity: 1, speed: 1,
      ...(selectedAction === "gaze-character" ? { targetKind: "character" as const, targetId: selectedTargetId } : selectedAction === "gaze-camera" ? { targetKind: "camera" as const } : {}),
    };
    onAdd(event);
    setNotice("رفتار روی ترک حرکت همین سکانس ذخیره شد.");
  };

  return <section className="grid min-w-0 gap-2 rounded-md border border-accent/30 bg-[#10202b] p-2.5 text-xs" aria-label="رفتارهای همگام با صدا">
    <header className="flex items-center justify-between gap-2"><strong>رفتارهای همگام با صدا</strong><ContextHelpTrigger topic="audioBehavior" onOpen={onHelp} /></header>
    <p data-active-speaker={activeDialogue?.clipId === clip.id ? activeDialogue.speakerInstanceId : ""} className="rounded border border-line px-2 py-1.5 leading-5 text-muted">{activeDialogue?.clipId === clip.id
      ? `در این لحظه: ${actors.find((item) => item.id === activeDialogue.speakerInstanceId)?.name ?? "گوینده"} صحبت می‌کند و ${activeDialogue.listenerInstanceIds.length} شخصیت گوش می‌دهد.`
      : "برای دیدن واکنش‌ها، نشانگر را روی بازهٔ گویندهٔ این کلیپ ببرید."}</p>
    <label className="grid gap-1">حالت رفتار سکانس
      <select className={control} value={scene.behaviorMode ?? "hybrid"} onChange={(event) => onMode(event.target.value as NonNullable<SceneDefinition["behaviorMode"]>)} title="خودکار فقط واکنش‌های گوینده و شنونده را از بازه‌های صدا می‌سازد؛ دستی فقط حرکت‌های ذخیره‌شده را اجرا می‌کند؛ ترکیبی هر دو را با اولویت حرکت دستی روی همان کانال اجرا می‌کند.">
        <option value="hybrid">ترکیبی · خودکار با اولویت حرکت دستی</option><option value="automatic">خودکار · فقط واکنش‌های صدا</option><option value="manual">دستی · فقط حرکت‌های ذخیره‌شده</option>
      </select>
    </label>
    <p className="leading-5 text-muted">{speaker ? `گوینده: ${speaker.name}` : "گویندهٔ قابل‌نمایش برای این کلیپ مشخص نیست؛ در بالا یک شخصیت را به بازهٔ صدا نسبت دهید."}</p>
    {actors.length ? <>
      <label className="grid gap-1">شخصیت
        <select className={control} value={effectiveActorId} onChange={(event) => setActorId(event.target.value)} title="شخصیتی را انتخاب می‌کند که رفتار زمان‌بندی‌شده در همین سکانس روی او اجرا شود.">{actors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
      <label className="grid gap-1">{actor?.id === speaker?.id ? "رفتار گوینده" : "واکنش شنونده"}
        <select className={control} value={selectedAction ?? ""} onChange={(event) => setAction(event.target.value as SceneActionEvent["action"])} title="تنها رفتارهایی نشان داده می‌شوند که اجزای واقعی مدل انتخاب‌شده پشتیبانی می‌کنند.">{options.map((item) => <option key={item} value={item}>{sceneActionLabels[item]}</option>)}</select>
      </label>
      {selectedAction === "gaze-character" && <label className="grid gap-1">هدف نگاه
        <select className={control} value={selectedTargetId} onChange={(event) => setTargetId(event.target.value)} title="شخصیت قابل‌نمایش دیگری را به‌عنوان هدف نگاه این رویداد انتخاب می‌کند.">{targets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>}
      <div className="grid grid-cols-2 gap-2" dir="rtl">
        <label className="grid gap-1">شروع در کلیپ · ثانیه<input className={control} dir="ltr" type="number" min="0" step={1 / fps} value={startSeconds} onChange={(event) => setStartSeconds(event.target.value)} title="زمان شروع از ابتدای کلیپ در خط زمان است؛ هنگام ذخیره به فریم صحیح همین سکانس تبدیل می‌شود." /></label>
        <label className="grid gap-1">مدت · ثانیه<input className={control} dir="ltr" type="number" min={1 / fps} step={1 / fps} value={durationSeconds} onChange={(event) => setDurationSeconds(event.target.value)} title="مدت رفتار باید داخل کلیپ و همین سکانس باقی بماند؛ برای ادامه در سکانس بعد یک رویداد جدا بسازید." /></label>
      </div>
      {!valid && <p className="text-amber-200">بازهٔ رفتار باید در بخش مشترک این کلیپ و سکانس باشد.</p>}
      <button type="button" className={control} disabled={!valid} onClick={add} title="رفتار انتخاب‌شده را با شناسهٔ پایدار در رویدادهای موجود همین سکانس ذخیره می‌کند؛ رویدادهای دیگر تغییر نمی‌کنند.">افزودن رفتار</button>
    </> : <p className="text-muted">برای ساخت رفتار، ابتدا یک شخصیت قابل‌نمایش به همین سکانس اضافه کنید.</p>}
    <button type="button" className={control} onClick={onPreview} title="نشانگر را به آغاز کلیپ می‌برد و صدا و رفتارهای همین سکانس را با ساعت پروژه پخش می‌کند.">پیش‌نمایش واکنش‌ها</button>
    {relatedEvents.length > 0 && <details><summary className="cursor-pointer py-1" title="حرکت‌های ذخیره‌شدهٔ هم‌پوشان با این کلیپ را برای ویرایش دقیق در بازرس حرکات نشان می‌دهد.">حرکت‌های این کلیپ ({relatedEvents.length})</summary><div className="grid gap-1 pt-1">{relatedEvents.map((event) => <button key={event.id} type="button" className={control} onClick={() => onEditEvent(event.id)} title="این رویداد را روی ترک حرکت انتخاب می‌کند؛ زمان، مدت، هدف و اولویت آن در بازرس حرکات قابل ویرایش‌اند.">{sceneActionLabels[event.action]} · {(event.startFrame / fps).toFixed(2)} ثانیه</button>)}</div></details>}
    {notice && <p role="status" className="text-accent">{notice}</p>}
  </section>;
}
