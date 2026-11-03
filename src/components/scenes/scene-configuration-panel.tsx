"use client";

import type { CharacterProjectData } from "@/lib/characters/character-schema";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { SceneCameraConfig, SceneCharacterConfig, SceneDefinition, ScenePropOverride } from "@/lib/scenes/scene-schema";
import type { SceneCameraPresetId } from "@/lib/scenes/scene-camera-presets";
import type { Vec3 } from "@/lib/environments/environment-registry";
import { environmentRegistry } from "@/lib/environments/registry";
import { propDisplayLabel } from "@/lib/environments/arrangement";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";

const field = "min-w-0 rounded-md border border-line bg-[#101722] px-2 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-accent";
const button = "min-h-8 rounded-md border border-line bg-[#1d2939] px-2 py-1 text-xs hover:bg-[#28394b] focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";
const axisNames = ["X", "Y", "Z"] as const;
type Lighting = EnvironmentArrangement["lighting"];

function VectorFields({ label, value, onChange, tooltip, rotation = false, scale = false }: { label: string; value: Vec3; onChange: (next: Vec3) => void; tooltip: string; rotation?: boolean; scale?: boolean }) {
  const minimum = scale ? 0.05 : rotation ? -360 : -100;
  const maximum = scale ? 20 : rotation ? 360 : 100;
  return <fieldset className="mt-2 min-w-0"><legend className="mb-1 text-[11px] font-semibold text-[#c3d0dc]" title={tooltip}>{label}</legend>
    <div className="grid grid-cols-3 gap-1.5" dir="ltr">{axisNames.map((axis, index) => <label key={`${label}-${axis}`} className="min-w-0 text-center text-[10px] text-muted" title={`${tooltip} · محور ${axis}`}>
      <span>{axis}</span><input aria-label={`${label} ${axis}`} title={`${tooltip} · محور ${axis}`} className={`mt-0.5 w-full ${field} text-center`} type="number" min={minimum} max={maximum} step={rotation ? "1" : "0.1"} value={rotation ? +(value[index] * 180 / Math.PI).toFixed(1) : value[index]}
        onChange={(event) => { const next = [...value] as Vec3; const raw = Number(event.target.value); if (!Number.isFinite(raw)) return; const bounded = Math.max(minimum, Math.min(maximum, raw)); next[index] = rotation ? bounded * Math.PI / 180 : bounded; onChange(next); }} />
    </label>)}</div>
  </fieldset>;
}

export function SceneConfigurationPanel({ scene, characters, baseArrangement, arrangement, resolutionWarning, anchors, view = "scene", fps = 30, onRename, onDurationChange, onEnvironmentChange, onCharacterAdd, onCharacterRemove, onCharacterChange, onPropChange, onLightingChange, onCameraChange, onCameraPreset, onSaveEditorView, previewing, inspectionActive = false, onPreviewChange, onHelp }: {
  scene: SceneDefinition | null; characters: CharacterProjectData; baseArrangement: EnvironmentArrangement | null; arrangement: EnvironmentArrangement | null;
  view?: "scene" | "camera"; fps?: number;
  onRename?: (id: string, name: string) => void; onDurationChange?: (id: string, seconds: number) => void;
  resolutionWarning?: string;
  anchors: readonly { id: string; displayName?: string; kind?: string }[];
  onEnvironmentChange: (environmentId: string) => void;
  onCharacterAdd: (id: string) => void; onCharacterRemove: (id: string) => void;
  onCharacterChange: (id: string, change: Partial<SceneCharacterConfig>) => void;
  onPropChange: (id: string, change: ScenePropOverride) => void;
  onLightingChange: (lighting: Lighting | undefined) => void;
  onCameraChange: (camera: SceneCameraConfig) => void;
  onCameraPreset: (preset: SceneCameraPresetId) => void;
  onSaveEditorView: () => void; previewing: boolean; inspectionActive?: boolean; onPreviewChange: (previewing: boolean) => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  const environments = environmentRegistry.list();
  if (!scene) return <section className="scene-config-panel p-3" aria-label={view === "camera" ? "تنظیم دوربین" : "تنظیم سکانس"}><header className="flex items-center gap-2"><h2 className="text-sm font-bold">{view === "camera" ? "دوربین تولید" : "تنظیمات سکانس"}</h2><ContextHelpTrigger topic={view === "camera" ? "productionCamera" : "sceneConfiguration"} onOpen={onHelp} /></header><p className="mt-3 text-xs leading-6 text-muted">برای ویرایش، ابتدا در بخش سکانس‌ها یک سکانس بسازید یا انتخاب کنید.</p></section>;
  const sceneCharacters = Object.entries(scene.characters).flatMap(([id, config]) => {
    const instance = characters.characterInstances[id]; const identity = instance && characters.characterIdentities[instance.characterId];
    return instance && identity ? [{ id, config, state: characters.characterStates[id], identity }] : [];
  });
  const camera = scene.productionCamera;
  const visibleCharacterCount = sceneCharacters.filter((item) => item.config.visible).length;
  const laptopAvailable = Boolean(arrangement?.props.some((prop) => prop.id === "studio-01:laptop" && prop.visible));
  const presets: { id: SceneCameraPresetId; label: string; tooltip: string }[] = [
    { id: "wide", label: "باز", tooltip: "نمای باز ثبت‌شده برای محیط انتخاب‌شده را روی دوربین تولید این سکانس اعمال می‌کند." },
    { id: "medium", label: "متوسط", tooltip: "نمای متوسط واقعی محیط را به‌عنوان دوربین تولید همین سکانس انتخاب می‌کند." },
    { id: "character-close-up", label: "نمای نزدیک", tooltip: "نمای نزدیکِ جایگاه شخصیت حاضر را روی دوربین تولید اعمال می‌کند." },
    { id: "two-character", label: "دو شخصیت", tooltip: "کادر گفت‌وگوی دونفرهٔ ثبت‌شده در محیط را برای این سکانس انتخاب می‌کند." },
    { id: "group", label: "گروهی", tooltip: "نمای گروهی موجود در محیط را برای دوربین تولید این سکانس اعمال می‌کند." },
    { id: "laptop-focused", label: "لپ‌تاپ", tooltip: "دوربین را بر پایهٔ موقعیت واقعی نمایشگر لپ‌تاپ فعلی تنظیم می‌کند." },
  ];
  const cameraTargetRef = camera.targetRef;
  const targetExists = !cameraTargetRef || cameraTargetRef.kind === "character-instance"
    ? !cameraTargetRef || Boolean(scene.characters[cameraTargetRef.id] && characters.characterInstances[cameraTargetRef.id])
    : Boolean(arrangement?.props.some((prop) => prop.id === cameraTargetRef.id && prop.visible));
  return <section className="scene-config-panel flex min-h-full flex-col rounded-xl border border-line bg-surface p-3" aria-labelledby="scene-config-title">
    <header className="flex items-center justify-between gap-2"><div className="min-w-0"><h2 id="scene-config-title" className="truncate text-sm font-bold">{view === "camera" ? "دوربین تولید" : "ویژگی‌های سکانس"} · {scene.name}</h2><p className="mt-0.5 text-xs text-muted">تغییرها فقط برای همین سکانس ذخیره می‌شوند.</p></div><ContextHelpTrigger topic={view === "camera" ? "productionCamera" : "sceneConfiguration"} onOpen={onHelp} /></header>
    {view === "scene" && <>
      <div className="mt-3 grid gap-3 rounded-lg border border-line bg-[#111b26] p-3">
        <label className="text-xs font-semibold">نام سکانس
          <input key={`${scene.id}:${scene.name}`} className={`mt-1 w-full ${field}`} defaultValue={scene.name} maxLength={80}
            title="نام همین سکانس را تغییر می‌دهد؛ با خروج از کادر یا Enter ثبت می‌شود."
            onBlur={(event) => { const name = event.currentTarget.value.trim(); if (name && name !== scene.name) onRename?.(scene.id, name); }}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        </label>
        <label className="text-xs font-semibold">مدت سکانس · ثانیه
          <input key={`${scene.id}:${scene.durationFrames}`} className={`mt-1 w-full ${field}`} type="number" min={1 / fps} max={3600} step={1 / fps} defaultValue={+(scene.durationFrames / fps).toFixed(3)}
            title="مدت همین سکانس را بر حسب ثانیه تغییر می‌دهد؛ زمان سکانس‌های بعدی دوباره محاسبه می‌شود."
            onBlur={(event) => { const seconds = Number(event.currentTarget.value); if (Number.isFinite(seconds) && seconds > 0 && Math.round(seconds * fps) !== scene.durationFrames) onDurationChange?.(scene.id, seconds); }}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        </label>
      </div>
    <details className="mt-3 border-t border-line pt-2"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold focus-visible:outline-2 focus-visible:outline-accent" title="حضور شخصیت، چیدمان وسایل و نور همین سکانس را نشان می‌دهد.">تنظیمات پیشرفتهٔ محیط و شخصیت‌ها <ContextHelpTrigger topic="sceneEnvironment" onOpen={onHelp} /></summary>
      <label className="mt-2 block text-[11px] text-muted" title="محیط سه‌بعدی این سکانس را از محیط‌های واقعاً ثبت‌شده انتخاب می‌کند.">محیط این سکانس
        <select className={`mt-1 w-full ${field}`} value={scene.environmentId ?? baseArrangement?.environmentId ?? ""} disabled={!environments.length || environments.length === 1}
          title="محیط سه‌بعدی ذخیره‌شده برای همین سکانس را انتخاب می‌کند؛ کتابخانه فعلاً یک محیط آماده دارد."
          onChange={(event) => onEnvironmentChange(event.target.value)}>{environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.displayName}</option>)}</select>
      </label>
      {environments.length === 1 && <p className="mt-1 text-[10px] leading-5 text-muted">در حال حاضر فقط استودیوی پادکست آماده است؛ محیط دیگری به‌عنوان گزینهٔ ساختگی نمایش داده نمی‌شود.</p>}
      <div className="mt-3"><h3 className="flex items-center gap-1 text-[11px] font-semibold">حضور شخصیت‌ها <ContextHelpTrigger topic="characterPlacement" onOpen={onHelp} /></h3>
        {Object.values(characters.characterInstances).map((instance) => {
          const identity = characters.characterIdentities[instance.characterId]; if (!identity) return null;
          const member = scene.characters[instance.id];
          return <div key={instance.id} className="mt-2 rounded-lg border border-line/80 p-2">
            <div className="flex items-center justify-between gap-2"><label className="flex min-w-0 items-center gap-2 text-xs" title={member ? "حضور این نمونه را فقط در سکانس فعلی روشن یا خاموش می‌کند." : "این نمونهٔ ذخیره‌شده را به سکانس فعلی اضافه می‌کند؛ هویت و ظاهر مشترک حفظ می‌شوند."}>
              <input type="checkbox" checked={Boolean(member)} onChange={(event) => event.target.checked ? onCharacterAdd(instance.id) : onCharacterRemove(instance.id)} aria-label={`${member ? "حضور" : "افزودن"} ${identity.name} در سکانس ${scene.name}`} title={member ? "با برداشتن تیک، شخصیت فقط از این سکانس حذف می‌شود؛ پروژه و هویت آن باقی می‌ماند." : "شخصیت موجود را با تنظیم پیش‌فرض پروژه به این سکانس اضافه می‌کند."} />
              <span className="truncate">{identity.name}</span></label>
              {member && <label className="flex shrink-0 items-center gap-1 text-[10px]" title="نمایش یا پنهان‌بودن این شخصیت را فقط در همین سکانس تنظیم می‌کند."><input type="checkbox" checked={member.visible} onChange={(event) => onCharacterChange(instance.id, { visible: event.target.checked })} aria-label={`نمایش ${identity.name} در این سکانس`} title="حضور دیداری شخصیت در همین سکانس را روشن یا خاموش می‌کند." />نمایش</label>}
            </div>
            {member && <>
              <label className="mt-2 block text-[10px] text-muted" title="جایگاه سازگار این شخصیت را در محیط فعلی انتخاب می‌کند.">جایگاه
                <select className={`mt-1 w-full ${field}`} value={member.placementAnchorId ?? "free"} onChange={(event) => onCharacterChange(instance.id, { placementAnchorId: event.target.value === "free" ? null : event.target.value })} aria-label={`جایگاه ${identity.name}`} title="جایگاه نشستن یا ایستادن را در همین سکانس انتخاب می‌کند؛ جایگاه آزاد از تبدیل فعلی استفاده می‌کند.">
                  <option value="free">جای‌گذاری آزاد</option>{anchors.map((anchor) => <option key={anchor.id} value={anchor.id}>{anchor.displayName ?? anchor.id}</option>)}
                </select></label>
              <VectorFields label="موقعیت" value={member.transform.position} tooltip="موقعیت شخصیت در فضای همین سکانس را بر حسب X، Y و Z تغییر می‌دهد." onChange={(position) => onCharacterChange(instance.id, { transform: { ...member.transform, position } })} />
              <VectorFields label="چرخش · درجه" value={member.transform.rotation} rotation tooltip="چرخش شخصیت را فقط در همین سکانس تغییر می‌دهد." onChange={(rotation) => onCharacterChange(instance.id, { transform: { ...member.transform, rotation } })} />
              <VectorFields label="مقیاس" value={member.transform.scale} scale tooltip="اندازهٔ شخصیت را در همین سکانس تغییر می‌دهد؛ مقیاس مثبت و محدود است." onChange={(scale) => onCharacterChange(instance.id, { transform: { ...member.transform, scale } })} />
              <button type="button" className={`${button} mt-2 w-full`} title="موقعیت، چرخش و مقیاس این شخصیت را در همین سکانس به مقدار پیش‌فرض پروژه برمی‌گرداند." disabled={!characters.characterStates[instance.id]} onClick={() => { const state = characters.characterStates[instance.id]; if (state) onCharacterChange(instance.id, { transform: structuredClone(state.initialTransform), placementAnchorId: state.placementAnchorId ?? null }); }}>بازگردانی جای‌گذاری در این سکانس</button>
            </>}
          </div>;
        })}
        {!Object.keys(characters.characterInstances).length && <p className="mt-2 text-[10px] leading-5 text-muted">ابتدا در بخش شخصیت‌ها یک نمونهٔ پروژه بسازید؛ سپس آن را از همین‌جا به این سکانس اضافه کنید.</p>}
      </div>
      <div className="mt-3"><h3 className="flex items-center gap-1 text-[11px] font-semibold">وسایل این سکانس <ContextHelpTrigger topic="sceneProps" onOpen={onHelp} /></h3>
        {resolutionWarning && <p role="status" className="mt-1 rounded-md border border-amber-700/50 bg-amber-950/30 p-2 text-[10px] leading-5 text-amber-200">{resolutionWarning}</p>}
        {(arrangement?.props ?? []).map((prop) => {
          const override = scene.propOverrides[prop.id]; const effectiveVisible = override?.visible ?? prop.visible; const effectiveTransform = override?.transform ?? prop.transform;
          const definition = environmentRegistry.get(arrangement?.environmentId ?? "")?.propDefinitions.find((item) => item.id === prop.definitionId);
          const fixed = definition?.editable === false;
          return <details key={prop.id} className="mt-1.5 rounded-lg border border-line/80 px-2 py-1.5"><summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] focus-visible:outline-2 focus-visible:outline-accent"><span>{propDisplayLabel(arrangement!, prop)}{fixed && <span className="ms-1 text-[10px] text-muted">(سازهٔ ثابت)</span>}</span><label title={fixed ? "این سازه بخشی ثابت از اتاق است و فقط برای چیدمان داخلی مجاز قابل تغییر است." : "نمایش این وسیله را فقط در سکانس فعلی تغییر می‌دهد."} onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={effectiveVisible} disabled={fixed} onChange={(event) => onPropChange(prop.id, { ...override, visible: event.target.checked })} aria-label={`نمایش وسیله ${propDisplayLabel(arrangement!, prop)} در این سکانس`} title={fixed ? "سازهٔ اتاق در این سکانس قابل تغییر نیست." : "این وسیله را فقط در همین سکانس نشان می‌دهد یا پنهان می‌کند."} /></label></summary>
            {fixed ? <p className="mt-2 text-[10px] leading-5 text-muted">این بخش از ساختار اتاق ثابت است و تنظیمات سکانس روی آن اعمال نمی‌شود.</p> : <>
              <VectorFields label="موقعیت" value={effectiveTransform.position} tooltip="موقعیت این وسیله را فقط در سکانس فعلی تغییر می‌دهد." onChange={(position) => onPropChange(prop.id, { ...override, transform: { ...effectiveTransform, position } })} />
              <VectorFields label="چرخش · درجه" value={effectiveTransform.rotation} rotation tooltip="چرخش این وسیله را فقط در همین سکانس تغییر می‌دهد." onChange={(rotation) => onPropChange(prop.id, { ...override, transform: { ...effectiveTransform, rotation } })} />
              <VectorFields label="مقیاس" value={effectiveTransform.scale} scale tooltip="اندازهٔ وسیله را فقط در همین سکانس تغییر می‌دهد." onChange={(scale) => onPropChange(prop.id, { ...override, transform: { ...effectiveTransform, scale } })} />
            </>}
          </details>;
        })}
      </div>
      {arrangement && <div className="mt-3"><h3 className="text-[11px] font-semibold">نورپردازی استودیو</h3>{(["keyIntensity", "fillIntensity", "accentIntensity"] as const).map((key) => <label key={key} className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted" title="شدت نور را فقط برای این سکانس ذخیره می‌کند.">{key === "keyIntensity" ? "نور اصلی" : key === "fillIntensity" ? "نور پرکننده" : "نور تأکیدی"}<input className={`w-24 ${field}`} type="number" min="0" max={key === "keyIntensity" ? 3 : key === "fillIntensity" ? 2 : 1.5} step="0.05" value={(scene.lightingOverride ?? arrangement.lighting)[key]} aria-label={`${key} در این سکانس`} title="شدت نور استودیو را فقط در همین سکانس تغییر می‌دهد." onChange={(event) => { const value = Number(event.target.value); const max = key === "keyIntensity" ? 3 : key === "fillIntensity" ? 2 : 1.5; if (Number.isFinite(value)) onLightingChange({ ...(scene.lightingOverride ?? arrangement.lighting), [key]: Math.max(0, Math.min(max, value)) }); }} /></label>)}
        {scene.lightingOverride && <button type="button" className={`${button} mt-2 w-full`} title="تنظیم نور این سکانس را پاک می‌کند و نور پیش‌فرض پروژه را دوباره به ارث می‌برد." onClick={() => onLightingChange(undefined)}>بازگشت به نور پروژه</button>}
      </div>}
    </details>
    </>}
    {view === "camera" && <div className="mt-3 border-t border-line pt-3">
      <p className="mt-1 text-xs leading-5 text-muted">این دوربین برای نمای تولید همین سکانس است؛ حرکت دوربین ویرایش را هنگام پیش‌نمایش موقتاً جایگزین می‌کند و موقعیت شخصیت‌ها را تغییر نمی‌دهد.</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">{presets.map((preset) => { const disabled = preset.id === "two-character" && visibleCharacterCount < 2 || preset.id === "group" && visibleCharacterCount < 3 || preset.id === "character-close-up" && visibleCharacterCount < 1 || preset.id === "laptop-focused" && !laptopAvailable; return <button key={preset.id} type="button" className={button} disabled={disabled} title={disabled ? "برای استفاده از این نما، محتوای لازم را به همین سکانس اضافه یا نمایان کنید." : preset.tooltip} onClick={() => onCameraPreset(preset.id)}>{preset.label}</button>; })}</div>
      <details className="mt-3 rounded-md border border-line p-2"><summary className="cursor-pointer text-xs font-semibold focus-visible:outline-2 focus-visible:outline-accent" title="مختصات، هدف، قاب و بزرگ‌نمایی دقیق دوربین تولید را نشان می‌دهد.">تنظیمات پیشرفتهٔ دوربین</summary>
      <VectorFields label="موقعیت دوربین" value={camera.position} tooltip="موقعیت دوربین تولید این سکانس را بر حسب X، Y و Z ذخیره می‌کند." onChange={(position) => onCameraChange({ ...camera, position })} />
      <VectorFields label="هدف نگاه»" value={camera.target} tooltip="نقطه‌ای را تعیین می‌کند که دوربین تولید این سکانس به آن نگاه می‌کند." onChange={(target) => onCameraChange({ ...camera, target, orientationMode: "look-at" })} />
      <VectorFields label="چرخش دوربین · درجه" value={camera.rotation} rotation tooltip="چرخش محلی دوربین تولید را نگه می‌دارد و فقط در حالت جهت‌گیری چرخشی به‌کار می‌رود." onChange={(rotation) => onCameraChange({ ...camera, rotation, orientationMode: "rotation" })} />
      <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[10px] text-muted" title="میدان دید دوربین تولید را بر حسب درجه تنظیم می‌کند.">میدان دید<input className={`mt-1 w-full ${field}`} type="number" min="10" max="100" value={camera.fov} aria-label="میدان دید دوربین تولید" title="میدان دید دوربین تولید این سکانس را بر حسب درجه تنظیم می‌کند." onChange={(event) => { const fov = Number(event.target.value); if (Number.isFinite(fov)) onCameraChange({ ...camera, fov: Math.max(10, Math.min(100, fov)) }); }} /></label>
        <label className="text-[10px] text-muted" title="ضریب بزرگ‌نمایی را برای همین دوربین ذخیره می‌کند.">بزرگ‌نمایی<input className={`mt-1 w-full ${field}`} type="number" min="0.1" max="10" step="0.1" value={camera.zoom} aria-label="بزرگ‌نمایی دوربین تولید" title="ضریب بزرگ‌نمایی دوربین تولید همین سکانس را تنظیم می‌کند." onChange={(event) => { const zoom = Number(event.target.value); if (Number.isFinite(zoom)) onCameraChange({ ...camera, zoom: Math.max(0.1, Math.min(10, zoom)) }); }} /></label></div>
      <label className="mt-2 block text-[10px] text-muted" title="نسبت قاب ویدیوی هدف را ذخیره می‌کند؛ برش قاب در پیش‌نمایش فعلی اعمال نمی‌شود.">قاب آیندهٔ ویدیو
        <select className={`mt-1 w-full ${field}`} value={camera.framing} title="نسبت قاب هدف را برای سازگاری بعدی ذخیره می‌کند؛ پیش‌نمایش فعلی همچنان نسبت نمای ویرایشگر را دارد." onChange={(event) => onCameraChange({ ...camera, framing: event.target.value as SceneCameraConfig["framing"] })}><option value="landscape-16:9">افقی ۱۶:۹</option><option value="portrait-9:16">عمودی ۹:۱۶</option></select></label>
      <label className="mt-2 block text-[10px] text-muted" title="هدف پایدار دوربین را به شخصیت یا وسیلهٔ همین سکانس پیوند می‌دهد.">هدف مرجع
        <select className={`mt-1 w-full ${field}`} value={camera.targetRef ? `${camera.targetRef.kind}:${camera.targetRef.id}` : "none"} title="شناسهٔ پایدار هدف را ذخیره می‌کند؛ اگر هدف حذف شود، دوربین از نقطهٔ ثابت ذخیره‌شده استفاده می‌کند." onChange={(event) => { const [kind, ...parts] = event.target.value.split(":"); const id = parts.join(":"); const targetRef = kind === "character-instance" && id ? { kind: "character-instance" as const, id } : kind === "prop-instance" && id ? { kind: "prop-instance" as const, id } : undefined; const next = { ...camera, ...(targetRef ? { targetRef } : {}) }; if (!targetRef) delete (next as Partial<SceneCameraConfig>).targetRef; onCameraChange(next); }}>
          <option value="none">نقطهٔ ثابت دوربین</option>{sceneCharacters.filter((item) => item.config.visible).map((item) => <option key={item.id} value={`character-instance:${item.id}`}>شخصیت: {item.identity.name}</option>)}{(arrangement?.props ?? []).filter((prop) => prop.visible).map((prop) => <option key={prop.id} value={`prop-instance:${prop.id}`}>وسیله: {prop.id}</option>)}
        </select></label>
      {cameraTargetRef && !targetExists && <p role="status" className="mt-1 text-[10px] text-amber-200">هدف ذخیره‌شده پیدا نشد؛ پیش‌نمایش از نقطهٔ ثابت دوربین استفاده می‌کند.</p>}
      </details>
      <div className="mt-2 grid grid-cols-2 gap-1.5"><button type="button" className={button} disabled={previewing} title="موقعیت و هدف دوربین ویرایشگر را به تنظیم تولید همین سکانس کپی می‌کند؛ دوربین ویرایشگر دست‌نخورده می‌ماند." onClick={onSaveEditorView}>ذخیره نمای فعلی</button><button type="button" className={button} aria-pressed={previewing} disabled={!previewing && inspectionActive} title={inspectionActive && !previewing ? "ابتدا نمایش نزدیک لپ‌تاپ یا وسیله را ببندید؛ سپس دوربین تولید را پیش‌نمایش کنید." : previewing ? "پیش‌نمایش دوربین تولید را می‌بندد و نمای ویرایشگر قبلی را برمی‌گرداند." : "دوربین تولید ذخیره‌شده برای همین سکانس را موقتاً در نما نشان می‌دهد."} onClick={() => onPreviewChange(!previewing)}>{previewing ? "بازگشت به ویرایش" : "پیش‌نمایش تولید"}</button></div>
    </div>}
  </section>;
}
