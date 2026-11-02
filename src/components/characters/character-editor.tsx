"use client";

import { useEffect, useRef, useState } from "react";
import { characterModelRegistry, normalizeCharacterCustomization } from "@/lib/characters/character-registry";
import { previewCharacterModelChange } from "@/lib/characters/character-operations";
import { resolveChatGptExpression } from "@/lib/characters/chatgpt-expression-presets";
import type { CharacterProjectData, CharacterState } from "@/lib/characters/character-schema";
import type { SaveStatus } from "@/lib/projects/save-state";
import type { CharacterAnchor } from "@/lib/environments/environment-registry";
import { getPreviewActionAvailability, previewSettingLimits, type CharacterPreviewActionId, type PreviewEasing, type PreviewSettings } from "@/lib/characters/animation-preview";
import { CharacterModelImportDialog } from "./character-model-import-dialog";
import { supportedGazeCapability, type GazePreview } from "@/lib/characters/gaze-preview";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";

const button = "rounded-lg border border-[#536276] px-2.5 py-1.5 text-xs hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

export function CharacterEditor({ data, active, selectedId, saveStatus, error, anchors, projectId, onBeforeImport, onImported, onDeleteImportedModel, onCreate, onAdd, onSelect, onVisibility, onRemove, onAssignPlacement, onRename, onDeleteIdentity, onChangeModel }: {
  data: CharacterProjectData; active: boolean; selectedId: string | null; saveStatus: SaveStatus; error: string; projectId: string | null;
  onBeforeImport: () => Promise<boolean>; onImported: (project: import("@/lib/projects/project-schema").ProjectDocument) => void;
  onDeleteImportedModel: (assetId: string) => Promise<boolean>;
  anchors: readonly CharacterAnchor[];
  onCreate: (name: string, modelId: string) => void; onAdd: (characterId: string) => void;
  onSelect: (instanceId: string | null) => void; onVisibility: (instanceId: string, visible: boolean) => void;
  onRemove: (instanceId: string) => void; onAssignPlacement: (instanceId: string, anchorId: string | null) => void; onRename: (characterId: string, name: string) => void;
  onDeleteIdentity: (characterId: string) => Promise<boolean>;
  onChangeModel: (characterId: string, modelId: string) => Promise<boolean>;
}) {
  const models = characterModelRegistry.list();
  const [name, setName] = useState("");
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [deleteIdentityId, setDeleteIdentityId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [modelChangeRequest, setModelChangeRequest] = useState<{ identityId: string; targetModelId: string } | null>(null);
  const [modelChangeBusy, setModelChangeBusy] = useState(false);
  const identities = Object.values(data.characterIdentities);
  const instances = Object.values(data.characterInstances);
  const deleteIdentity = deleteIdentityId ? data.characterIdentities[deleteIdentityId] : undefined;
  const deleteDependencies = deleteIdentity ? instances.filter((instance) => instance.characterId === deleteIdentity.id).length : 0;
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const modelChangeDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (deleteIdentityId && deleteIdentity) deleteDialog.current?.showModal();
  }, [deleteIdentityId, deleteIdentity]);
  const closeDeleteDialog = () => { deleteDialog.current?.close(); setDeleteIdentityId(null); };
  const modelChangeIdentity = modelChangeRequest ? data.characterIdentities[modelChangeRequest.identityId] : undefined;
  let modelChangePreview: ReturnType<typeof previewCharacterModelChange> | undefined;
  if (modelChangeRequest) {
    try { modelChangePreview = previewCharacterModelChange(data, modelChangeRequest.identityId, modelChangeRequest.targetModelId); }
    catch { modelChangePreview = undefined; }
  }
  useEffect(() => {
    if (modelChangeRequest && modelChangeIdentity && !modelChangeDialog.current?.open) modelChangeDialog.current?.showModal();
  }, [modelChangeRequest, modelChangeIdentity]);
  const closeModelChangeDialog = () => { modelChangeDialog.current?.close(); setModelChangeRequest(null); };
  const confirmModelChange = async () => {
    if (!modelChangeIdentity || !modelChangeRequest || !modelChangePreview || modelChangeBusy) return;
    setModelChangeBusy(true);
    try { if (await onChangeModel(modelChangeIdentity.id, modelChangeRequest.targetModelId)) closeModelChangeDialog(); }
    finally { setModelChangeBusy(false); }
  };
  return <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="characters-title">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="characters-title" className="text-base font-bold">شخصیت‌ها</h2>
        <p className="mt-1 text-xs leading-6 text-muted">هویت را در کتابخانه بسازید؛ سپس هر تعداد نمونهٔ مستقل را به پروژه اضافه کنید.</p></div>
      <span role="status" className="text-xs text-muted">{saveStatus === "saved" ? "ذخیره شد" : saveStatus === "saving" ? "در حال ذخیره" : saveStatus === "error" ? "خطا در ذخیره" : "تغییرات ذخیره‌نشده"}</span>
    </header>
    {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/50 bg-red-950/30 p-2 text-xs leading-6 text-red-100">{error}</p>}
    {!active ? <p className="mt-4 rounded-lg border border-dashed border-line p-4 text-sm text-muted">برای ساخت شخصیت و افزودن آن به صحنه، ابتدا یک پروژه باز کنید.</p> : <>
      <div className="mt-4 rounded-lg border border-line bg-[#101722] p-3">
        <h3 className="text-sm font-semibold">کتابخانهٔ شخصیت‌ها</h3>
        <div className="mb-2 flex justify-end"><CharacterModelImportDialog projectId={projectId ?? ""} onBeforeImport={onBeforeImport} onImported={onImported} /></div>
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer rounded py-1 focus-visible:outline-2 focus-visible:outline-accent">دربارهٔ مدل‌های موجود</summary>
          {models.map((model) => <div key={model.id} className="mt-2 border-b border-line pb-2">
            <strong className="text-foreground">{model.displayName}</strong>
            <p className="mt-1">{model.description}</p>
            {model.source === "asset" && model.assetId && <div className="mt-1 flex flex-wrap items-center gap-2">
              <span>مدل واردشده · {model.glb?.inspection?.skeletonCount ?? 0} استخوان‌بندی · {model.glb?.inspection?.animationNames.length ?? 0} کلیپ شناسایی‌شده</span>
              <button type="button" className={button} onClick={() => { if (window.confirm("حذف مدل استفاده‌نشده از همین پروژه؟")) void onDeleteImportedModel(model.assetId!); }}>حذف مدل</button>
            </div>}
          </div>)}
        </details>
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); if (name.trim() && modelId) { onCreate(name.trim(), modelId); setName(""); } }}>
          <label className="self-center text-xs" htmlFor="new-character-name">نام شخصیت</label>
          <input id="new-character-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="نام دلخواه شخصیت"
            className="min-h-9 min-w-[150px] flex-1 rounded-lg border border-[#536276] bg-[#101722] px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent" disabled={!active} />
          <label className="self-center text-xs" htmlFor="character-model">مدل</label>
          <select id="character-model" value={modelId} onChange={(event) => setModelId(event.target.value)} className="min-h-9 max-w-full rounded-lg border border-[#536276] bg-[#101722] px-2 text-xs">
            {models.map((model) => <option key={model.id} value={model.id}>{model.displayName}</option>)}
          </select>
          <button className={button} type="submit" disabled={!name.trim() || !modelId}>ساخت هویت</button>
        </form>
        {identities.length === 0 ? <p className="mt-3 text-xs text-muted">هنوز هویتی نساخته‌اید. ساخت هویت به‌تنهایی نمونه‌ای در صحنه ایجاد نمی‌کند.</p> : <ul className="mt-3 grid gap-2">
          {identities.map((identity) => <li key={identity.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2">
            <label className="sr-only" htmlFor={`identity-${identity.id}`}>نام {identity.name}</label>
            <input id={`identity-${identity.id}`} key={`${identity.id}-${identity.name}`} defaultValue={identity.name} maxLength={80} required
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }}
              onBlur={(event) => { const nextName = event.currentTarget.value.trim(); if (!nextName) { event.currentTarget.value = identity.name; return; } if (nextName !== identity.name) onRename(identity.id, nextName); }}
              className="min-h-8 min-w-[120px] flex-1 rounded-md border border-[#536276] bg-[#101722] px-2 text-sm focus-visible:outline-2 focus-visible:outline-accent"
              title="برای ذخیرهٔ نام جدید، از کادر خارج شوید" />
            <button type="button" className={button} title="برای تغییر نام، متن را بنویسید و Enter را بزنید"
              onClick={() => document.getElementById(`identity-${identity.id}`)?.focus()}>{"\u062a\u063a\u06cc\u06cc\u0631 \u0646\u0627\u0645"}</button>
            <span className="text-[10px] text-muted">مدل فعلی: {characterModelRegistry.get(identity.modelId)?.displayName ?? "مدل در دسترس نیست"}</span>
            <button type="button" className={button} onClick={() => setModelChangeRequest({ identityId: identity.id,
              targetModelId: models.find((model) => model.id !== identity.modelId)?.id ?? identity.modelId })}>تغییر مدل پایه</button>
            <button type="button" className={button} title="یک نمونهٔ مستقل به این پروژه اضافه می‌کند" onClick={() => onAdd(identity.id)}>افزودن به صحنه</button>
            <button type="button" className={`${button} border-red-500/50 text-red-200`} title="هویت ذخیره‌شده را حذف می‌کند؛ مدل پایه و دارایی مشترک باقی می‌مانند"
              onClick={() => setDeleteIdentityId(identity.id)}>حذف شخصیت</button>
          </li>)}
        </ul>}
      </div>
      <div className="mt-4 rounded-lg border border-line bg-[#101722] p-3">
        <h3 className="text-sm font-semibold">شخصیت‌های این پروژه <span className="text-xs font-normal text-muted">({instances.length})</span></h3>
        {instances.length === 0 ? <p className="mt-2 text-xs leading-6 text-muted">برای دیدن پیکره در نما، از کتابخانه «افزودن به صحنه» را بزنید.</p> : <ul className="mt-2 grid gap-2">
          {instances.map((instance) => {
            const identity = data.characterIdentities[instance.characterId];
            const state = data.characterStates[instance.id];
            const assignedAnchorId = state?.placementAnchorId;
            const model = identity && characterModelRegistry.get(identity.modelId);
            const availableAnchors = anchors.filter((anchor) => {
              const kind = anchor.kind ?? "seat";
              return (anchor.surfaceOffsetY !== undefined || (kind === "seat" && anchor.seatSurfaceOffsetY !== undefined))
                && Boolean(model?.placementKinds.includes(kind));
            });
            const assignedAnchorAvailable = availableAnchors.some((anchor) => anchor.id === assignedAnchorId);
            const modelAvailable = Boolean(model);
            const anchorName = (anchor: CharacterAnchor) => anchor.displayName ?? (anchor.role === "host" ? "صندلی میزبان" : anchor.role === "co-host" ? "صندلی هم‌میزبان" : anchor.role === "guest" ? "صندلی مهمان" : anchor.kind === "tabletop" ? "روی میز" : "روی سکو");
            return <li key={instance.id} className={`flex flex-wrap items-center gap-2 rounded-lg border p-2 ${selectedId === instance.id ? "border-accent bg-[#19433f]" : "border-line"}`}>
              <button type="button" className="min-h-9 flex-1 text-right text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent"
                aria-pressed={selectedId === instance.id} onClick={() => onSelect(instance.id)}>{identity?.name ?? "هویت حذف‌شده"}
                <span className="block text-[10px] text-muted">نمونهٔ مستقل · {state?.visible ? "نمایان" : "مخفی"}</span></button>
              <button type="button" className={button} aria-label={state?.visible ? `مخفی‌کردن ${identity?.name ?? "شخصیت"}` : `نمایش ${identity?.name ?? "شخصیت"}`}
                title="نمایش یا مخفی‌کردن پیکره در نما" onClick={() => onVisibility(instance.id, !state?.visible)}>{state?.visible ? "مخفی" : "نمایش"}</button>
              <button type="button" className={button} title="نمونه را از این پروژه حذف می‌کند؛ هویت کتابخانه باقی می‌ماند"
                onClick={() => onRemove(instance.id)}>حذف از صحنه</button>
              <label className="flex items-center gap-2 text-xs">
                <span>جایگاه</span>
                <select aria-label={`جایگاه ${identity?.name ?? "شخصیت"}`} value={assignedAnchorId && assignedAnchorAvailable ? assignedAnchorId : ""} disabled={!modelAvailable}
                  onChange={(event) => onAssignPlacement(instance.id, event.target.value || null)}
                  className="min-h-8 max-w-[180px] rounded-md border border-[#536276] bg-[#101722] px-2 text-xs">
                  <option value="">آزاد و بدون لنگر</option>
                  {availableAnchors.map((anchor) => {
                    const occupant = instances.find((candidate) => candidate.id !== instance.id && data.characterStates[candidate.id]?.placementAnchorId === anchor.id);
                    return <option key={anchor.id} value={anchor.id} disabled={Boolean(occupant)}>
                      {anchorName(anchor)}{occupant ? " · پر شده" : ""}
                    </option>;
                  })}
                </select>
              </label>
              {assignedAnchorId && !assignedAnchorAvailable && <div role="alert" className="flex items-center gap-2 text-xs text-amber-200">
                <span>نقطهٔ اتصال ذخیره‌شده در محیط فعلی در دسترس نیست.</span>
                <button type="button" className={button} onClick={() => onAssignPlacement(instance.id, null)}>جداکردن و آزادسازی</button>
              </div>}
            </li>;
          })}
        </ul>}
      </div>
    </>}
    {deleteIdentity && <dialog ref={deleteDialog} onClose={() => setDeleteIdentityId(null)} aria-labelledby="delete-character-title"
      className="m-auto w-[min(92vw,440px)] rounded-xl border border-line bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/70">
      <div className="space-y-4">
        <h3 id="delete-character-title" className="text-lg font-bold">حذف شخصیت</h3>
        <p className="text-sm leading-7 text-muted">شخصیت «{deleteIdentity.name}» از کتابخانهٔ همین پروژه حذف خواهد شد. مدل پایه و فایل‌های مدل دست‌نخورده می‌مانند.</p>
        {deleteDependencies > 0 && <div role="alert" className="rounded-lg border border-amber-500/50 bg-amber-950/30 p-3 text-sm leading-7 text-amber-100">
          <strong>این شخصیت در صحنه استفاده شده است.</strong>
          <p className="mt-1">{deleteDependencies} نمونه به این هویت وابسته است. برای حفظ چیدمان، حذف شخصیت انجام نمی‌شود. ابتدا هر نمونه را جداگانه از فهرست پایین با دکمهٔ «حذف از صحنه» بردارید؛ سپس دوباره حذف شخصیت را انتخاب کنید.</p>
        </div>}
        {error && <p role="alert" className="rounded-lg border border-red-500/50 bg-red-950/30 p-2 text-xs leading-6 text-red-100">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={button} disabled={deleteBusy} onClick={closeDeleteDialog}>انصراف</button>
          {deleteDependencies === 0 && <button type="button" className={`${button} border-red-500/60 text-red-200`} disabled={deleteBusy} onClick={async () => {
            setDeleteBusy(true);
            try { if (await onDeleteIdentity(deleteIdentity.id)) closeDeleteDialog(); }
            finally { setDeleteBusy(false); }
          }}>{deleteBusy ? "در حال ذخیره" : "تأیید حذف"}</button>}
        </div>
      </div>
    </dialog>}
    {modelChangeRequest && modelChangeIdentity && <dialog ref={modelChangeDialog} onClose={() => setModelChangeRequest(null)} aria-labelledby="change-character-model-title"
      className="m-auto w-[min(92vw,460px)] rounded-xl border border-line bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/70">
      <div className="space-y-4">
        <h3 id="change-character-model-title" className="text-lg font-bold">تغییر مدل پایه</h3>
        <p className="text-sm leading-7 text-muted">هویت «{modelChangeIdentity.name}» و همهٔ نمونه‌های وابسته به همین هویت حفظ می‌شوند.</p>
        <label className="grid gap-2 text-sm" htmlFor={`model-change-${modelChangeIdentity.id}`}>مدل جدید
          <select id={`model-change-${modelChangeIdentity.id}`} value={modelChangeRequest.targetModelId}
            onChange={(event) => setModelChangeRequest({ ...modelChangeRequest, targetModelId: event.target.value })}
            className="min-h-10 rounded-lg border border-[#536276] bg-[#101722] px-3 text-sm">
            {models.map((model) => <option key={model.id} value={model.id}>{model.displayName}</option>)}
          </select>
        </label>
        {modelChangePreview && modelChangePreview.replacedCustomizationKeys.length > 0 && <p role="alert" className="rounded-lg border border-amber-500/50 bg-amber-950/30 p-3 text-sm leading-7 text-amber-100">
          برخی تنظیم‌های ظاهری با مدل جدید سازگار نیستند و به مقدار پیش‌فرض همان مدل بازمی‌گردند: {modelChangePreview.replacedCustomizationKeys.join("، ")}
        </p>}
        {!modelChangePreview && <p role="alert" className="text-sm text-red-200">مدل انتخاب‌شده در دسترس یا قابل استفاده نیست.</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={button} disabled={modelChangeBusy} onClick={closeModelChangeDialog}>انصراف</button>
          <button type="button" className={button} disabled={modelChangeBusy || !modelChangePreview || modelChangeRequest.targetModelId === modelChangeIdentity.modelId}
            onClick={() => void confirmModelChange()}>{modelChangeBusy ? "در حال ذخیره…" : "تأیید تغییر"}</button>
        </div>
      </div>
    </dialog>}
  </section>;
}

export function CharacterProperties({ data, selectedId, mode, onModeChange, onEdit, onReset, onAppearanceChange, onResetAppearance, onSavePreset, onHelp,
  previewAction, previewPlaying, previewSettings, onPreviewActionChange, onPreviewSettingsChange, onPlayPreview, onStopPreview, onResetPreview,
  gazePreview, gazeTargets, onGazeChange, onGazeReset }: {
  data: CharacterProjectData; selectedId: string | null; mode: "translate" | "rotate" | "scale";
  onModeChange: (mode: "translate" | "rotate" | "scale") => void;
  onEdit: (instanceId: string, state: CharacterState) => void; onReset: (instanceId: string) => void;
  onAppearanceChange: (characterId: string, appearance: Record<string, string>) => void;
  onResetAppearance: (characterId: string) => void; onSavePreset: () => void;
  previewAction: CharacterPreviewActionId; previewPlaying: boolean; previewSettings: PreviewSettings;
  onPreviewActionChange: (action: CharacterPreviewActionId) => void;
  onPreviewSettingsChange: (settings: PreviewSettings) => void;
  onPlayPreview: (instanceId: string, action: CharacterPreviewActionId, settings: PreviewSettings) => void;
  onStopPreview: (instanceId: string) => void; onResetPreview: (instanceId: string) => void;
  gazePreview?: GazePreview; gazeTargets: readonly { id: string; label: string; kind: "character" | "prop" }[];
  onGazeChange: (instanceId: string, patch: Partial<GazePreview>) => void; onGazeReset: (instanceId: string) => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  const instance = selectedId ? data.characterInstances[selectedId] : undefined;
  const identity = instance ? data.characterIdentities[instance.characterId] : undefined;
  const model = identity ? characterModelRegistry.get(identity.modelId) : undefined;
  const state = selectedId ? data.characterStates[selectedId] : undefined;
  const previewCapabilities = model && !model.glb ? model.capabilities.animationCapabilities.filter((capability): capability is "head-rotation" | "arm-gesture" | "facial-expression" => capability === "head-rotation" || capability === "arm-gesture" || capability === "facial-expression") : [];
  const previewActions = getPreviewActionAvailability(previewCapabilities);
  const gazeCapability = model ? supportedGazeCapability(model) : null;
  const gazeMode = gazePreview?.mode ?? "neutral";
  const visibleGazeTargets = gazeTargets.filter((target) => target.kind !== "character" || target.id !== selectedId);
  const selectedPreviewSupported = previewActions.find((action) => action.id === previewAction)?.supported ?? false;
  const fields = mode === "translate" ? "position" : mode === "rotate" ? "rotation" : "scale";
  const modes = [{ id: "translate" as const, label: "جابه‌جایی" }, { id: "rotate" as const, label: "چرخش" }, { id: "scale" as const, label: "اندازه" }];
  return <aside className="flex min-h-full flex-col overflow-hidden rounded-xl border border-line bg-surface max-[650px]:min-h-[170px]" aria-labelledby="character-properties-title">
    <div className="flex h-[43px] items-center gap-2.5 border-b border-line px-4 text-[13px] font-bold"><span className="h-[15px] w-[3px] rounded-[3px] bg-accent" /><span id="character-properties-title" className="flex-1">ویژگی‌های شخصیت</span><ContextHelpTrigger topic="characters" onOpen={onHelp} /></div>
    {!identity || !state || !selectedId ? <div className="flex flex-1 flex-col items-center justify-center p-5 text-center"><h2 className="text-sm font-bold">شخصیتی انتخاب نشده</h2><p className="mt-2 text-xs leading-7 text-muted">از فهرست یا خود پیکره در نمای سه‌بعدی انتخاب کنید.</p></div> : <div className="p-4">
      <h2 className="text-sm font-bold">{identity.name}</h2><p className="mt-1 break-all text-[10px] text-muted" dir="ltr">{selectedId}</p>
      <p className="mt-2 rounded-md border border-[#806c3f] bg-[#39331e] p-2 text-xs leading-5">مدل‌ها ریزتری و بدون ریگ هستند؛ قابلیت‌های رقص یا حرکت صورت فعال نیست.</p>
      <details open className="mt-4 border-t border-line pt-3">
      <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">جایگاه و تبدیل</summary>
      <div className="mt-3 flex flex-wrap gap-1">{modes.map((item) => <button key={item.id} type="button" aria-pressed={mode === item.id}
        className={`rounded-lg border px-2 py-1.5 text-xs ${mode === item.id ? "border-accent bg-[#19433f]" : "border-[#536276]"}`} onClick={() => onModeChange(item.id)}>{item.label}</button>)}</div>
      <p className="mt-3 mb-2 text-xs text-muted">{mode === "rotate" ? "زاویه به درجه؛ چرخش Y جهت روبه‌روی مدل را تغییر می‌دهد." : mode === "scale" ? "ضریب اندازه از ۰٫۰۵ تا ۲۰" : "موقعیت مستقل در صحنه"}</p>
      <div className="grid grid-cols-3 gap-2" dir="ltr">{(["X", "Y", "Z"] as const).map((axis, index) => <label key={axis} className="text-center text-xs"><span>{axis}</span>
        <input type="number" step={mode === "rotate" ? "1" : "0.1"} min={mode === "scale" ? 0.05 : -100} max={mode === "scale" ? 20 : 100} value={mode === "rotate" ? +(state.transform[fields][index] * 180 / Math.PI).toFixed(1) : state.transform[fields][index]}
          onChange={(event) => {
            const raw = Number(event.target.value);
            if (!Number.isFinite(raw) || (mode === "scale" && (raw < 0.05 || raw > 20))) return;
            const next = [...state.transform[fields]] as [number, number, number];
            next[index] = mode === "rotate" ? raw * Math.PI / 180 : raw;
            onEdit(selectedId, { ...state, transform: { ...state.transform, [fields]: next } });
          }}
          className="mt-1 w-full rounded-lg border border-[#536276] bg-[#101722] px-2 py-2 text-center text-xs focus-visible:outline-2 focus-visible:outline-accent" /></label>)}</div>
      <button type="button" className={`${button} mt-3`} title="موقعیت و جهت شروع این نمونه را بازیابی می‌کند" onClick={() => onReset(selectedId)}>بازنشانی جایگاه</button>
      </details>
      <details className="mt-4 border-t border-line pt-3">
      <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">پیش‌نمای حرکت</summary>
      <div className="mt-1 flex gap-1"><ContextHelpTrigger topic="animation" onOpen={onHelp} /><ContextHelpTrigger topic="expressions" onOpen={onHelp} /><ContextHelpTrigger topic="gaze" onOpen={onHelp} /></div>
        <p className="mt-1 text-xs leading-5 text-muted">پیش‌نمایش موقت است و در پروژه ذخیره نمی‌شود.</p>
        <label className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span>حرکت</span>
          <select aria-label="انتخاب نمونه حرکت" value={previewAction} onChange={(event) => onPreviewActionChange(event.target.value as CharacterPreviewActionId)}
            className="max-w-[65%] rounded border border-line bg-[#101722] px-2 py-1.5">
            {previewActions.map((action) => <option key={action.id} value={action.id} disabled={!action.supported}>
              {action.label}{action.supported ? "" : " · پشتیبانی نمی‌شود"}
            </option>)}
          </select>
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={button} disabled={!selectedPreviewSupported || (previewPlaying && previewAction !== "return-idle")} onClick={() => onPlayPreview(selectedId, previewAction, previewSettings)}>پخش</button>
          <button type="button" className={button} disabled={!previewPlaying} onClick={() => onStopPreview(selectedId)}>توقف</button>
          <button type="button" className={button} onClick={() => onResetPreview(selectedId)}>بازنشانی ژست</button>
        </div>
        <details className="mt-2 rounded border border-line px-2 py-1.5">
          <summary className="cursor-pointer text-[11px] text-muted focus-visible:outline-2 focus-visible:outline-accent">تنظیمات زمان و شدت</summary>
          <div className="mt-2 grid gap-2">
            <label className="flex items-center justify-between gap-2 text-[11px]"><span>سرعت</span><input aria-label="سرعت حرکت" type="range" min={previewSettingLimits.speed[0]} max={previewSettingLimits.speed[1]} step="0.1" value={previewSettings.speed} onChange={(event) => onPreviewSettingsChange({ ...previewSettings, speed: Number(event.target.value) })} /></label>
            <label className="flex items-center justify-between gap-2 text-[11px]"><span>شدت</span><input aria-label="شدت حرکت" type="range" min={previewSettingLimits.intensity[0]} max={previewSettingLimits.intensity[1]} step="0.05" value={previewSettings.intensity} onChange={(event) => onPreviewSettingsChange({ ...previewSettings, intensity: Number(event.target.value) })} /></label>
            <label className="flex items-center justify-between gap-2 text-[11px]"><span>گذار</span><input aria-label="مدت گذار" type="range" min={previewSettingLimits.transitionSeconds[0]} max={previewSettingLimits.transitionSeconds[1]} step="0.02" value={previewSettings.transitionSeconds} onChange={(event) => onPreviewSettingsChange({ ...previewSettings, transitionSeconds: Number(event.target.value) })} /></label>
            <label className="flex items-center justify-between gap-2 text-[11px]"><span>بازگشت به سکون</span><input aria-label="مدت بازگشت به حالت خنثی" type="range" min={previewSettingLimits.returnSeconds[0]} max={previewSettingLimits.returnSeconds[1]} step="0.05" value={previewSettings.returnSeconds} onChange={(event) => onPreviewSettingsChange({ ...previewSettings, returnSeconds: Number(event.target.value) })} /></label>
            <label className="flex items-center justify-between gap-2 text-[11px]"><span>نرمی حرکت</span><select aria-label="منحنی حرکت" value={previewSettings.easing} onChange={(event) => onPreviewSettingsChange({ ...previewSettings, easing: event.target.value as PreviewEasing })} className="rounded border border-line bg-[#101722] px-2 py-1">
              <option value="smooth">نرم</option><option value="ease-in">شروع آرام</option><option value="ease-out">پایان آرام</option><option value="ease-in-out">شروع و پایان آرام</option>
            </select></label>
          </div>
        </details>
        {previewActions.some((action) => !action.supported) && <p className="mt-2 text-[11px] leading-5 text-muted" aria-label="وضعیت پشتیبانی حرکت‌ها">گزینه‌های غیرفعال به پیوند یا قابلیت پشتیبانی‌نشده در این مدل نیاز دارند.</p>}
      </details>
      {model && <details className="mt-4 border-t border-line pt-3">
        <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">نگاه و توجه</summary><span className="mt-1 inline-flex"><ContextHelpTrigger topic="gaze" onOpen={onHelp} /></span>
        {!gazeCapability ? <p className="mt-2 text-xs leading-5 text-muted">این مدل پیوند واقعی و پشتیبانی‌شده‌ای برای کنترل نگاه ندارد.</p> : <>
          <p className="mt-1 text-xs leading-5 text-muted">پیش‌نمایش موقت است و موقعیت ذخیره‌شدهٔ شخصیت را تغییر نمی‌دهد.{gazeCapability.eyes ? " چشم و سر پشتیبانی می‌شوند." : " فقط چرخش محدود سر پشتیبانی می‌شود."}</p>
          <label className="mt-3 flex items-center justify-between gap-3 text-xs"><span>حالت نگاه</span><select aria-label="حالت نگاه" value={gazeMode} onChange={(event) => {
            const nextMode = event.target.value as GazePreview["mode"];
            const firstTarget = visibleGazeTargets.find((target) => target.kind === (nextMode === "character" ? "character" : "prop"));
            onGazeChange(selectedId!, { mode: nextMode, targetId: firstTarget?.id, attentionTargetKind: nextMode === "attention" ? "camera" : undefined });
          }} className="max-w-[62%] rounded border border-line bg-[#101722] px-2 py-1.5">
            <option value="neutral">خنثی / روبه‌رو</option><option value="character">شخصیت دیگر</option><option value="prop">وسیله</option>
            <option value="camera">دوربین فعال</option><option value="point">نقطهٔ دلخواه</option><option value="direction">جهت دستی</option><option value="attention">پیش‌نمایش توجه</option>
          </select></label>
          {(gazeMode === "character" || gazeMode === "prop") && <label className="mt-2 flex items-center justify-between gap-3 text-xs"><span>هدف</span><select aria-label="هدف نگاه" value={gazePreview?.targetId ?? ""} onChange={(event) => onGazeChange(selectedId!, { targetId: event.target.value })} className="max-w-[65%] rounded border border-line bg-[#101722] px-2 py-1.5">
            <option value="">انتخاب هدف</option>{visibleGazeTargets.filter((target) => target.kind === (gazeMode === "character" ? "character" : "prop")).map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
          </select></label>}
          {gazeMode === "attention" && <label className="mt-2 flex items-center justify-between gap-3 text-xs"><span>رفتار توجه</span><select aria-label="رفتار توجه" value={gazePreview?.attention ?? "listening"} onChange={(event) => onGazeChange(selectedId!, { attention: event.target.value as NonNullable<GazePreview["attention"]> })} className="max-w-[65%] rounded border border-line bg-[#101722] px-2 py-1.5">
            <option value="listening">شنیدن با توجه</option><option value="observe">مشاهدهٔ متمرکز</option><option value="curious">نگاه کنجکاو</option><option value="thinking">فکر کردن و نگاه‌کردن به بالا</option><option value="eye-contact">تماس چشمی</option><option value="return-partner">بازگشت به هم‌صحبت</option>
          </select></label>}
          {gazeMode === "attention" && <label className="mt-2 flex items-center justify-between gap-3 text-xs"><span>هدف توجه</span><select aria-label="هدف توجه" value={gazePreview?.attentionTargetKind === "camera" ? "camera" : `${gazePreview?.attentionTargetKind ?? "camera"}:${gazePreview?.targetId ?? ""}`} onChange={(event) => {
            const [kind, ...idParts] = event.target.value.split(":");
            onGazeChange(selectedId!, { attentionTargetKind: kind as "character" | "prop" | "camera", targetId: kind === "camera" ? undefined : idParts.join(":") });
          }} className="max-w-[65%] rounded border border-line bg-[#101722] px-2 py-1.5"><option value="camera">دوربین فعال</option>
            {visibleGazeTargets.map((target) => <option key={`${target.kind}:${target.id}`} value={`${target.kind}:${target.id}`}>{target.label}</option>)}
          </select></label>}
          {gazeMode === "direction" && <div className="mt-2 grid gap-2">
            <label className="flex items-center justify-between gap-2 text-xs"><span>افقی</span><input aria-label="جهت افقی نگاه" type="range" min="-160" max="160" step="1" value={Math.round((gazePreview?.horizontal ?? 0) * 180 / Math.PI)} onChange={(event) => onGazeChange(selectedId!, { horizontal: Number(event.target.value) * Math.PI / 180 })} /></label>
            <label className="flex items-center justify-between gap-2 text-xs"><span>عمودی</span><input aria-label="جهت عمودی نگاه" type="range" min="-55" max="55" step="1" value={Math.round((gazePreview?.vertical ?? 0) * 180 / Math.PI)} onChange={(event) => onGazeChange(selectedId!, { vertical: Number(event.target.value) * Math.PI / 180 })} /></label>
          </div>}
          {gazeMode === "point" && <div className="mt-2 grid grid-cols-3 gap-2" dir="ltr">{(["X", "Y", "Z"] as const).map((axis, index) => <label key={axis} className="text-center text-[11px]">{axis}<input aria-label={`مختصات نقطه ${axis}`} type="number" step="0.1" value={gazePreview?.point?.[index] ?? 0} onChange={(event) => { const point = [...(gazePreview?.point ?? [0, 1.5, 0])] as [number, number, number]; point[index] = Number(event.target.value); onGazeChange(selectedId!, { point }); }} className="mt-1 w-full rounded border border-line bg-[#101722] p-1.5 text-center" /></label>)}</div>}
          <label className="mt-2 flex items-center justify-between gap-2 text-xs"><span>زمان گذار</span><input aria-label="مدت گذار نگاه" type="range" min="0.12" max="1.2" step="0.04" value={gazePreview?.transitionSeconds ?? 0.45} onChange={(event) => onGazeChange(selectedId!, { transitionSeconds: Number(event.target.value) })} /></label>
          <p className="mt-2 text-[11px] leading-5 text-muted">حرکت سر در محدودهٔ طبیعی مدل محدود می‌شود؛ جهت‌های دور از دسترس به‌صورت ایمن کوتاه می‌شوند.</p>
          {((gazeMode === "character" || gazeMode === "prop") && (!gazePreview?.targetId || !visibleGazeTargets.some((target) => target.id === gazePreview.targetId))) && <p role="status" className="mt-2 text-[11px] text-amber-200">هدف موجود یا قابل‌مشاهده نیست؛ نگاه به حالت خنثی برمی‌گردد.</p>}
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={() => onGazeChange(selectedId!, {})}>پیش‌نمایش نگاه</button><button type="button" className={button} onClick={() => onGazeReset(selectedId!)}>بازگشت به نگاه خنثی</button></div>
        </>}
      </details>}
      {model && <details open className="mt-4 border-t border-line pt-3">
        <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">ظاهر شخصیت</summary><span className="mt-1 inline-flex"><ContextHelpTrigger topic="appearance" onOpen={onHelp} /></span>
        <p className="mt-1 text-xs leading-5 text-muted">این تنظیم‌ها به هویت انتخاب‌شده تعلق دارند؛ نمونه‌های همان هویت ظاهر مشترک دارند.</p>
        <div className="mt-3 grid gap-2">{model.customizationFields.map((field) => {
          const normalizedCustomization = normalizeCharacterCustomization(model.id, identity.customization as Record<string, string>);
          const storedValue = normalizedCustomization[field.key] ?? field.defaultValue;
          const value = field.key === "faceStyle" && field.kind === "select" ? resolveChatGptExpression(storedValue) : storedValue;
          return <label key={field.key} className="flex items-center justify-between gap-3 text-xs">
            <span>{field.label}</span>
            {field.kind === "color" ? <input type="color" aria-label={field.label} value={value}
              onChange={(event) => onAppearanceChange(identity.id, { ...identity.customization as Record<string, string>, [field.key]: event.target.value })}
              className="h-8 w-12 cursor-pointer rounded border border-line bg-transparent" />
              : <select aria-label={field.label} value={value} onChange={(event) => onAppearanceChange(identity.id, { ...identity.customization as Record<string, string>, [field.key]: event.target.value })}
                className="max-w-[55%] rounded border border-line bg-[#101722] px-2 py-1.5">{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
          </label>;
        })}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={button} onClick={onSavePreset} title="هویت و ظاهر فعلی را در پروژه ذخیره می‌کند">ذخیره شخصیت</button>
          <button type="button" className={button} onClick={() => onResetAppearance(identity.id)}>
            {model.id === "character-model:kamyar" ? "بازنشانی به پیش‌فرض مرجع" : "بازنشانی ظاهر"}
          </button>
        </div>
      </details>}
    </div>}
  </aside>;
}
