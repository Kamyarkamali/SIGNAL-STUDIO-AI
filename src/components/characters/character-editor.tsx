"use client";

import { useState } from "react";
import { characterModelRegistry } from "@/lib/characters/character-registry";
import type { CharacterProjectData, CharacterState } from "@/lib/characters/character-schema";
import type { SaveStatus } from "@/lib/projects/save-state";

const button = "rounded-lg border border-[#536276] px-2.5 py-1.5 text-xs hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";
const models = characterModelRegistry.list();

export function CharacterEditor({ data, active, selectedId, saveStatus, onCreate, onAdd, onSelect, onVisibility, onRemove, onRename }: {
  data: CharacterProjectData; active: boolean; selectedId: string | null; saveStatus: SaveStatus;
  onCreate: (name: string, modelId: string) => void; onAdd: (characterId: string) => void;
  onSelect: (instanceId: string | null) => void; onVisibility: (instanceId: string, visible: boolean) => void;
  onRemove: (instanceId: string) => void; onRename: (characterId: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const identities = Object.values(data.characterIdentities);
  const instances = Object.values(data.characterInstances);
  return <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="characters-title">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="characters-title" className="text-base font-bold">شخصیت‌ها</h2>
        <p className="mt-1 text-xs leading-6 text-muted">هویت را در کتابخانه بسازید؛ سپس هر تعداد نمونهٔ مستقل را به پروژه اضافه کنید.</p></div>
      <span role="status" className="text-xs text-muted">{saveStatus === "saved" ? "ذخیره شد" : saveStatus === "saving" ? "در حال ذخیره" : saveStatus === "error" ? "خطا در ذخیره" : "تغییرات ذخیره‌نشده"}</span>
    </header>
    {!active ? <p className="mt-4 rounded-lg border border-dashed border-line p-4 text-sm text-muted">برای ساخت شخصیت و افزودن آن به صحنه، ابتدا یک پروژه باز کنید.</p> : <>
      <div className="mt-4 rounded-lg border border-line bg-[#101722] p-3">
        <h3 className="text-sm font-semibold">کتابخانهٔ شخصیت‌ها</h3>
        <p className="mt-1 text-xs text-muted">مدل آزمایشی فقط برای بررسی فنی است و طراحی نهایی محسوب نمی‌شود.</p>
        {models.map((model) => <div key={model.id} className="mt-2 rounded-md border border-[#39485b] p-2 text-xs">
          <strong>{model.displayName}</strong>
          <p className="mt-1 text-muted">جهت روبه‌رو: محور +Z · بدون سفارشی‌سازی یا انیمیشن پشتیبانی‌شده</p>
        </div>)}
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
            <span className="text-[10px] text-muted">{characterModelRegistry.get(identity.modelId)?.displayName ?? "مدل در دسترس نیست"}</span>
            <button type="button" className={button} title="یک نمونهٔ مستقل به این پروژه اضافه می‌کند" onClick={() => onAdd(identity.id)}>افزودن به صحنه</button>
          </li>)}
        </ul>}
      </div>
      <div className="mt-4 rounded-lg border border-line bg-[#101722] p-3">
        <h3 className="text-sm font-semibold">شخصیت‌های این پروژه <span className="text-xs font-normal text-muted">({instances.length})</span></h3>
        {instances.length === 0 ? <p className="mt-2 text-xs leading-6 text-muted">برای دیدن پیکره در نما، از کتابخانه «افزودن به صحنه» را بزنید.</p> : <ul className="mt-2 grid gap-2">
          {instances.map((instance) => {
            const identity = data.characterIdentities[instance.characterId];
            const state = data.characterStates[instance.id];
            return <li key={instance.id} className={`flex flex-wrap items-center gap-2 rounded-lg border p-2 ${selectedId === instance.id ? "border-accent bg-[#19433f]" : "border-line"}`}>
              <button type="button" className="min-h-9 flex-1 text-right text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent"
                aria-pressed={selectedId === instance.id} onClick={() => onSelect(instance.id)}>{identity?.name ?? "هویت حذف‌شده"}
                <span className="block text-[10px] text-muted">نمونهٔ مستقل · {state?.visible ? "نمایان" : "مخفی"}</span></button>
              <button type="button" className={button} aria-label={state?.visible ? `مخفی‌کردن ${identity?.name ?? "شخصیت"}` : `نمایش ${identity?.name ?? "شخصیت"}`}
                title="نمایش یا مخفی‌کردن پیکره در نما" onClick={() => onVisibility(instance.id, !state?.visible)}>{state?.visible ? "مخفی" : "نمایش"}</button>
              <button type="button" className={button} title="نمونه را از این پروژه حذف می‌کند؛ هویت کتابخانه باقی می‌ماند"
                onClick={() => onRemove(instance.id)}>حذف نمونه</button>
            </li>;
          })}
        </ul>}
      </div>
    </>}
  </section>;
}

export function CharacterProperties({ data, selectedId, mode, onModeChange, onEdit, onReset }: {
  data: CharacterProjectData; selectedId: string | null; mode: "translate" | "rotate" | "scale";
  onModeChange: (mode: "translate" | "rotate" | "scale") => void;
  onEdit: (instanceId: string, state: CharacterState) => void; onReset: (instanceId: string) => void;
}) {
  const instance = selectedId ? data.characterInstances[selectedId] : undefined;
  const identity = instance ? data.characterIdentities[instance.characterId] : undefined;
  const state = selectedId ? data.characterStates[selectedId] : undefined;
  const fields = mode === "translate" ? "position" : mode === "rotate" ? "rotation" : "scale";
  const modes = [{ id: "translate" as const, label: "جابه‌جایی" }, { id: "rotate" as const, label: "چرخش" }, { id: "scale" as const, label: "اندازه" }];
  return <aside className="flex min-h-full flex-col overflow-hidden rounded-xl border border-line bg-surface max-[650px]:min-h-[170px]" aria-labelledby="character-properties-title">
    <div className="flex h-[43px] items-center gap-2.5 border-b border-line px-4 text-[13px] font-bold"><span className="h-[15px] w-[3px] rounded-[3px] bg-accent" /><span id="character-properties-title">ویژگی‌های شخصیت</span></div>
    {!identity || !state || !selectedId ? <div className="flex flex-1 flex-col items-center justify-center p-5 text-center"><h2 className="text-sm font-bold">شخصیتی انتخاب نشده</h2><p className="mt-2 text-xs leading-7 text-muted">از فهرست یا خود پیکره در نمای سه‌بعدی انتخاب کنید.</p></div> : <div className="p-4">
      <h2 className="text-sm font-bold">{identity.name}</h2><p className="mt-1 break-all text-[10px] text-muted" dir="ltr">{selectedId}</p>
      <p className="mt-2 rounded-md border border-[#806c3f] bg-[#39331e] p-2 text-xs leading-5">مدل موقت برای بررسی ابزارهاست؛ مدل نهایی در فاز ۰۴-B ساخته می‌شود.</p>
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
    </div>}
  </aside>;
}
