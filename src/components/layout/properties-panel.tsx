"use client";

import { useState } from "react";
import type { SectionId } from "@/config/navigation";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import { initialTransformFor, propDisplayLabel, updateProp } from "@/lib/environments/arrangement";
import { STUDIO_01 } from "@/lib/environments/studio-01";
import type { Vec3 } from "@/lib/environments/environment-registry";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { DisplayEditor } from "@/components/viewport/display-editor";

export type TransformMode = "translate" | "rotate" | "scale";
const modes: { id: TransformMode; label: string }[] = [
  { id: "translate", label: "جابه‌جایی" }, { id: "rotate", label: "چرخش" }, { id: "scale", label: "اندازه" },
];
const axes = ["X", "Y", "Z"] as const;
const button = "rounded-lg border border-[#536276] px-2 py-1.5 text-xs hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent";

function TransformFields({ id, arrangement, onEdit, mode }: { id: string; arrangement: EnvironmentArrangement; onEdit: (change: (current: EnvironmentArrangement) => EnvironmentArrangement) => void; mode: TransformMode }) {
  const [error, setError] = useState("");
  const prop = arrangement.props.find((item) => item.id === id);
  if (!prop) return null;
  const key = mode === "translate" ? "position" : mode === "rotate" ? "rotation" : "scale";
  const values = prop.transform[key];
  const commit = (index: number, raw: string, input: HTMLInputElement) => {
    const value = Number(raw);
    const nextValue = mode === "rotate" ? value * Math.PI / 180 : value;
    const next = [...values] as Vec3;
    next[index] = nextValue;
    try {
      if (raw.trim() === "" || !Number.isFinite(nextValue)) throw new Error("عدد معتبر وارد کنید.");
      onEdit((current) => updateProp(current, id, { transform: { ...prop.transform, [key]: next } }));
      setError("");
    } catch {
      setError("مقدار واردشده خارج از بازه یا نامعتبر است.");
      input.value = String(mode === "rotate" ? +(values[index] * 180 / Math.PI).toFixed(1) : values[index]);
    }
  };
  return <div className="mt-3">
    <p className="mb-2 text-xs text-muted">{mode === "rotate" ? "زاویه بر حسب درجه" : mode === "scale" ? "ضریب اندازه (۰٫۰۵ تا ۲۰)" : "موقعیت در صحنه"}</p>
    <div className="grid grid-cols-3 gap-2" dir="ltr">{axes.map((axis, index) => <label key={`${id}-${mode}-${axis}`} className="text-center text-xs"><span>{axis}</span><input type="number" step={mode === "rotate" ? "1" : "0.1"} defaultValue={mode === "rotate" ? +(values[index] * 180 / Math.PI).toFixed(1) : values[index]} onBlur={(event) => commit(index, event.currentTarget.value, event.currentTarget)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className="mt-1 w-full rounded-lg border border-[#536276] bg-[#101722] px-2 py-2 text-center text-xs focus-visible:outline-2 focus-visible:outline-accent" /></label>)}</div>
    {error && <p role="alert" className="mt-2 text-xs text-red-200">{error}</p>}
  </div>;
}

export function PropertiesPanel({ section, projectTitle, arrangement, selectedId, onEdit, mode, onModeChange, editing, onEnterEdit, onFinishEdit,
  project, displayAssignments, onDisplayChange, onUploadDisplay, onDeleteDisplayImage, inspecting, onInspect, mediaPlaying, onTogglePlayback, onLaptopViewerOpenChange }: {
  section: SectionId; projectTitle?: string; arrangement: EnvironmentArrangement | null; selectedId: string | null;
  onEdit: (change: (current: EnvironmentArrangement) => EnvironmentArrangement) => void;
  mode: TransformMode; onModeChange: (mode: TransformMode) => void;
  editing: boolean; onEnterEdit: () => void; onFinishEdit: () => void;
  project: ProjectDocument | null; displayAssignments: ProjectDocument["displayAssignments"];
  onDisplayChange: (propId: string, assignment: ProjectDocument["displayAssignments"][string]) => void;
  onUploadDisplay: (file: File) => Promise<string | null>; inspecting: boolean; onInspect: () => void;
  onDeleteDisplayImage: (assetId: string) => Promise<ProjectDocument>;
  mediaPlaying: boolean; onTogglePlayback: () => void;
  onLaptopViewerOpenChange?: (open: boolean) => void;
}) {
  const selected = arrangement?.props.find((item) => item.id === selectedId);
  const definition = STUDIO_01.propDefinitions.find((item) => item.id === selected?.definitionId);
  return <aside className="flex min-h-full flex-col overflow-hidden rounded-xl border border-line bg-surface max-[650px]:min-h-[170px]" aria-labelledby="properties-title">
    <div className="flex h-[43px] items-center gap-2.5 border-b border-line px-4 text-[13px] font-bold"><span className="h-[15px] w-[3px] rounded-[3px] bg-accent" /><span id="properties-title">ویژگی‌ها</span></div>
    {selected && definition?.editable !== false ? <div className="p-4">
      <h2 className="text-sm font-bold">{propDisplayLabel(arrangement!, selected)}</h2>
      <p className="mt-1 break-all text-xs text-muted" dir="ltr">{selected.id}</p>
      <details open className="mt-4 border-t border-line pt-3">
        <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">جایگاه و تبدیل</summary>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" className={button} aria-pressed={editing} onClick={editing ? onFinishEdit : onEnterEdit}>ویرایش وسیله</button>
        {editing && <><span role="status" className="self-center text-xs text-accent">حالت ویرایش فعال است</span><button type="button" className={button} onClick={onFinishEdit}>پایان ویرایش</button></>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">{modes.map((item) => <button key={item.id} type="button" aria-pressed={mode === item.id} className={`${button} ${mode === item.id ? "border-accent bg-[#19433f]" : ""}`} onClick={() => onModeChange(item.id)}>{item.label}</button>)}</div>
      <TransformFields key={`${selected.id}-${mode}-${JSON.stringify(selected.transform)}`} id={selected.id} arrangement={arrangement!} onEdit={onEdit} mode={mode} />
      <button type="button" className={`${button} mt-3`} onClick={() => onEdit((current) => updateProp(current, selected.id, { transform: initialTransformFor(selected) }))}>بازنشانی موقعیت</button>
      </details>
      {selected.definitionId === "prop:laptop" && project && <details open className="mt-4 border-t border-line pt-3">
        <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">رسانهٔ نمایشگر</summary>
        <DisplayEditor project={project}
        assignment={displayAssignments[selected.id]} onChange={(assignment) => onDisplayChange(selected.id, assignment)}
        onUpload={onUploadDisplay} onDeleteImage={onDeleteDisplayImage} inspecting={inspecting} onInspect={onInspect} playing={mediaPlaying} onTogglePlayback={onTogglePlayback} onViewerOpenChange={onLaptopViewerOpenChange} />
      </details>}
      <p className="mt-3 text-xs leading-6 text-muted">برای تغییر در نما از ابزار انتخاب‌شده استفاده کنید. تغییر عددی پس از خروج از کادر ثبت می‌شود.</p>
    </div> : <div className="flex flex-1 flex-col items-center justify-center p-5 text-center"><h2 className="text-sm font-bold">{section === "projects" && projectTitle ? projectTitle : "چیزی انتخاب نشده است"}</h2><p className="mt-2 text-xs leading-7 text-muted">{section === "environments" ? "وسیله‌ای را در نمای سه‌بعدی یا فهرست وسایل انتخاب کنید." : "برای ویرایش وسایل، پروژه‌ای باز کنید و به بخش محیط‌ها بروید."}</p></div>}
  </aside>;
}
