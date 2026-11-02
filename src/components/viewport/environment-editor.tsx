"use client";

import { useState } from "react";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import { addProp, duplicateProp, propDisplayLabel, removeProp, resetStudioLighting, restoreDefault, updateProp, updateStudioLighting } from "@/lib/environments/arrangement";
import { STUDIO_01 } from "@/lib/environments/studio-01";
import type { SaveStatus } from "@/components/projects/use-projects";
import type { TransformMode } from "@/components/layout/properties-panel";
import { StudioDecorationEditor } from "@/components/viewport/studio-decoration-editor";
import type { ProjectDocument } from "@/lib/projects/project-schema";

type Props = {
  arrangement: EnvironmentArrangement | null;
  showRoomWalls: boolean;
  onToggleRoomWalls: () => void;
  selectedId: string | null;
  editing: boolean;
  onEnterEdit: () => void;
  onFinishEdit: () => void;
  mode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
  onSelect: (id: string | null) => void;
  onEdit: (change: (current: EnvironmentArrangement) => EnvironmentArrangement) => void;
  saveStatus: SaveStatus;
  onSave: () => void;
  project: ProjectDocument | null;
  onUpload: (file: File) => Promise<string | null>;
};

const button = "rounded-lg border border-[#536276] px-2.5 py-1.5 text-xs text-foreground hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";
const initialIds = new Set(STUDIO_01.defaultProps.map((item) => item.id));
const definitions = new Map(STUDIO_01.propDefinitions.map((item) => [item.id, item]));
const statusText: Record<SaveStatus, string> = { saved: "ذخیره شد", saving: "در حال ذخیره", dirty: "تغییرات ذخیره‌نشده", error: "خطا در ذخیره" };

export function EnvironmentEditor({ arrangement, selectedId, onSelect, onEdit, saveStatus, onSave, editing, onEnterEdit, onFinishEdit, mode, onModeChange, project, onUpload, showRoomWalls, onToggleRoomWalls }: Props) {
  const [libraryChoice, setLibraryChoice] = useState("");
  const editable = STUDIO_01.propDefinitions.filter((item) => item.editable !== false);
  const missing = STUDIO_01.defaultProps.filter((item) => item.id !== "studio-01:room" && item.id !== "studio-01:acoustic-wall" &&
    !arrangement?.props.some((prop) => prop.id === item.id));
  const act = (change: (current: EnvironmentArrangement) => EnvironmentArrangement) => {
    try { onEdit(change); return true; } catch { window.alert("ویرایش وسیله ممکن نشد. مقدارها و تعداد وسایل را بررسی کنید."); return false; }
  };
  return <section className="section-background rounded-xl border border-line p-4" aria-labelledby="section-title">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><span className="text-xs text-accent">فاز ۰۳-C · چیدمان پروژه</span><h1 id="section-title" className="text-xl font-bold">وسایل صحنه</h1></div>
      <span role="status" aria-live="polite" className="text-xs text-[#b6c8d6]">{arrangement ? statusText[saveStatus] : "برای ویرایش، پروژه‌ای باز کنید"}</span>
    </div>
    {!arrangement ? <p className="mt-3 text-sm text-muted">از بخش پروژه‌ها، پروژه‌ای بسازید یا باز کنید. نمای استودیو تا آن زمان فقط برای مشاهده است.</p> : <>
      <p className="mt-2 text-xs leading-6 text-muted">تغییرات این چیدمان در همین پروژه ذخیره می‌شود. ساخت سکانس و چیدمان جداگانهٔ هر سکانس در فاز بعد است.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs" htmlFor="prop-library">کتابخانه وسایل</label>
        <select id="prop-library" value={libraryChoice} onChange={(event) => setLibraryChoice(event.target.value)} className="min-h-9 rounded-lg border border-[#536276] bg-[#101722] px-2 text-xs"><option value="">انتخاب وسیله…</option>{editable.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select>
        <button type="button" className={button} disabled={!libraryChoice} onClick={() => { const id = `studio-01:user:${crypto.randomUUID()}`; if (act((current) => addProp(current, libraryChoice, id))) { onSelect(id); setLibraryChoice(""); } }}>افزودن وسیله</button>
        <button type="button" className={button} disabled={saveStatus === "saved" || saveStatus === "saving"} onClick={onSave}>ذخیره چیدمان</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2">
        <span className="text-xs font-semibold">ساختار اتاق</span>
        <button type="button" className={button} aria-pressed={showRoomWalls} onClick={onToggleRoomWalls}>
          {showRoomWalls ? "پنهان‌کردن دیوارها و سقف" : "نمایش دیوارها و سقف"}
        </button>
        <span className="text-[11px] text-muted">این گزینه فقط برای دید ویرایشگر است و در پروژه ذخیره نمی‌شود.</span>
      </div>
      <details className="mt-2 rounded-lg border border-line px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold focus-visible:outline-2 focus-visible:outline-accent">نورپردازی استودیو</summary>
        <p className="mt-1 text-[11px] leading-5 text-muted">تنظیم نورهای اصلی پروژه؛ در نسخه‌های آینده می‌تواند برای هر صحنه جداگانه باشد.</p>
        {arrangement.lighting && <div className="mt-2 grid gap-2">
          <label className="grid grid-cols-[minmax(100px,1fr)_minmax(100px,1.5fr)_34px] items-center gap-2 text-xs">
            <span>شدت نور اصلی</span><input type="range" min="0" max="3" step="0.05" value={arrangement.lighting.keyIntensity}
              onChange={(event) => act((current) => updateStudioLighting(current, { keyIntensity: Number(event.target.value) }))} />
            <output className="text-left tabular-nums">{arrangement.lighting.keyIntensity.toFixed(2)}</output>
          </label>
          <label className="grid grid-cols-[minmax(100px,1fr)_minmax(100px,1.5fr)_34px] items-center gap-2 text-xs">
            <span>شدت نور پرکننده</span><input type="range" min="0" max="2" step="0.05" value={arrangement.lighting.fillIntensity}
              onChange={(event) => act((current) => updateStudioLighting(current, { fillIntensity: Number(event.target.value) }))} />
            <output className="text-left tabular-nums">{arrangement.lighting.fillIntensity.toFixed(2)}</output>
          </label>
          <label className="grid grid-cols-[minmax(100px,1fr)_minmax(100px,1.5fr)_34px] items-center gap-2 text-xs">
            <span>نور لبه‌ای</span><input type="range" min="0" max="1.5" step="0.05" value={arrangement.lighting.accentIntensity}
              onChange={(event) => act((current) => updateStudioLighting(current, { accentIntensity: Number(event.target.value) }))} />
            <output className="text-left tabular-nums">{arrangement.lighting.accentIntensity.toFixed(2)}</output>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs" htmlFor="studio-light-temperature">دمای رنگ</label>
            <select id="studio-light-temperature" className="min-h-8 rounded-md border border-[#536276] bg-[#101722] px-2 text-xs"
              value={arrangement.lighting.temperature} onChange={(event) => act((current) => updateStudioLighting(current, { temperature: event.target.value as "warm" | "neutral" | "cool" }))}>
              <option value="warm">گرم</option><option value="neutral">طبیعی</option><option value="cool">سرد</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={arrangement.lighting.practicalsEnabled}
              onChange={(event) => act((current) => updateStudioLighting(current, { practicalsEnabled: event.target.checked }))} />چراغ‌های دکوراتیو</label>
            <button type="button" className={button} onClick={() => act(resetStudioLighting)}>بازنشانی نور</button>
          </div>
        </div>}
      </details>
      <ul className="mt-3 space-y-1.5" aria-label="وسایل صحنه">
        {arrangement.props.filter((item) => definitions.get(item.definitionId)?.editable !== false).map((prop) => <li key={prop.id} className={`flex items-center gap-1 rounded-lg border p-1 ${selectedId === prop.id ? "border-accent bg-[#19433f]" : "border-[#334354]"}`}>
          <button type="button" aria-pressed={selectedId === prop.id} className="min-w-0 flex-1 truncate rounded px-2 py-1 text-right text-xs focus-visible:outline-2 focus-visible:outline-accent" onClick={() => onSelect(prop.id)}>{propDisplayLabel(arrangement, prop)}{!prop.visible ? " · مخفی" : ""}</button>
          <button type="button" className={button} onClick={() => act((current) => updateProp(current, prop.id, { visible: !prop.visible }))}>{prop.visible ? "مخفی" : "نمایش"}</button>
        </li>)}
      </ul>
      {missing.length > 0 && <details className="mt-2 text-xs"><summary className="cursor-pointer">وسایل پیش‌فرضِ حذف‌شده ({missing.length})</summary><ul className="mt-2 space-y-1">{missing.map((prop) => <li key={prop.id} className="flex items-center justify-between gap-2"><span>{propDisplayLabel(arrangement, prop)}</span><button type="button" className={button} onClick={() => { if (act((current) => restoreDefault(current, prop.id))) onSelect(prop.id); }}>بازگرداندن</button></li>)}</ul></details>}
      {selectedId && arrangement.props.some((item) => item.id === selectedId) && <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => onSelect(selectedId)}>انتخاب وسیله</button>
        <button type="button" className={button} aria-pressed={editing} onClick={editing ? onFinishEdit : onEnterEdit}>ویرایش وسیله</button>
        {editing && <>
          {([{ id: "translate", label: "جابه‌جایی" }, { id: "rotate", label: "چرخش" }, { id: "scale", label: "تغییر اندازه" }] as const).map((item) =>
            <button key={item.id} type="button" aria-pressed={mode === item.id} className={`${button} ${mode === item.id ? "border-accent bg-[#19433f]" : ""}`} onClick={() => onModeChange(item.id)}>{item.label}</button>)}
          <button type="button" className={button} onClick={onFinishEdit}>پایان ویرایش</button>
          <span role="status" className="self-center text-xs text-accent">حالت ویرایش فعال است</span>
        </>}
        <button type="button" className={button} onClick={() => { const id = `studio-01:user:${crypto.randomUUID()}`; if (act((current) => duplicateProp(current, selectedId, id))) onSelect(id); }}>تکثیر وسیله</button>
        <button type="button" className={`${button} text-red-200`} onClick={() => { if (!window.confirm("این وسیله از چیدمان فعلی حذف شود؟ تعریف وسیله و پروژه‌های دیگر حفظ می‌شوند.")) return; if (act((current) => removeProp(current, selectedId))) onSelect(null); }}>حذف از صحنه</button>
        {initialIds.has(selectedId) && <span className="self-center text-xs text-muted">پس از حذف، قابل بازگردانی است.</span>}
      </div>}
      {selectedId && <StudioDecorationEditor arrangement={arrangement} propId={selectedId} project={project} onEdit={onEdit} onUpload={onUpload} />}
    </>}
  </section>;
}
