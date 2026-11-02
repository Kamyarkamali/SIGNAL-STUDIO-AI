"use client";

import { useRef, useState } from "react";
import type { EnvironmentArrangement } from "@/lib/environments/arrangement";
import { restoreFrameArtwork, restoreSignDesign, updateFrameCustomization, updateSignCustomization } from "@/lib/environments/arrangement";
import type { FrameCustomization, SignCustomization } from "@/lib/environments/studio-decoration";
import type { ProjectDocument } from "@/lib/projects/project-schema";

const button = "rounded-lg border border-[#536276] px-2.5 py-1.5 text-xs hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";
const axes = ["X", "Y", "Z"] as const;

function LocalTransformFields({ title, transform, onChange }: {
  title: string; transform: SignCustomization["transform"]; onChange: (transform: SignCustomization["transform"]) => void;
}) {
  return <fieldset className="mt-3 grid gap-2 rounded-lg border border-line p-2"><legend className="px-1 text-xs">{title}</legend>
    {(["position", "rotation", "scale"] as const).map((key) => <div key={key}>
      <p className="mb-1 text-[10px] text-muted">{key === "position" ? "موقعیت مستقل" : key === "rotation" ? "چرخش مستقل · درجه" : "اندازه مستقل"}</p>
      <div className="grid grid-cols-3 gap-1" dir="ltr">{axes.map((axis, index) => <label key={`${key}-${axis}`} className="text-center text-[10px]">{axis}
        <input aria-label={`${title} ${key} ${axis}`} type="number" step={key === "rotation" ? 1 : 0.1}
          value={key === "rotation" ? +(transform[key][index] * 180 / Math.PI).toFixed(1) : transform[key][index]}
          onChange={(event) => {
            const value = Number(event.target.value); if (!Number.isFinite(value)) return;
            const next = [...transform[key]] as [number, number, number]; next[index] = key === "rotation" ? value * Math.PI / 180 : value;
            onChange({ ...transform, [key]: next });
          }} className="mt-1 w-full rounded border border-[#536276] bg-[#101722] p-1 text-center text-[10px]" />
      </label>)}</div>
    </div>)}
  </fieldset>;
}

export function StudioDecorationEditor({ arrangement, propId, project, onEdit, onUpload }: {
  arrangement: EnvironmentArrangement; propId: string; project: ProjectDocument | null;
  onEdit: (change: (current: EnvironmentArrangement) => EnvironmentArrangement) => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const prop = arrangement.props.find((item) => item.id === propId);
  const input = useRef<HTMLInputElement>(null);
  const [frameIndex, setFrameIndex] = useState<0 | 1>(0);
  const [uploading, setUploading] = useState(false);
  const images = Object.values(project?.assetManifest ?? {}).filter((asset) => asset.kind === "display-image");
  if (!prop || (prop.definitionId !== "prop:practical-lights" && prop.definitionId !== "prop:wall-art")) return null;
  const sign = prop.decoration?.sign;
  const frame = prop.decoration?.frames?.[frameIndex];
  const uploadImage = async (file?: File) => {
    if (!file || !project) return;
    setUploading(true);
    try {
      const assetId = await onUpload(file);
      if (!assetId) return;
      if (prop.definitionId === "prop:practical-lights") onEdit((current) => updateSignCustomization(current, propId, { design: "image", imageAssetId: assetId }));
      else onEdit((current) => updateFrameCustomization(current, propId, frameIndex, { imageAssetId: assetId }));
    } finally { setUploading(false); if (input.current) input.current.value = ""; }
  };
  const chooseImage = (assetId: string) => {
    if (prop.definitionId === "prop:practical-lights") onEdit((current) => updateSignCustomization(current, propId, assetId
      ? { design: "image", imageAssetId: assetId }
      : { design: "default", imageAssetId: undefined }));
    else onEdit((current) => updateFrameCustomization(current, propId, frameIndex, { imageAssetId: assetId || undefined }));
  };
  const content = prop.definitionId === "prop:practical-lights" ? <>
    <h3 className="text-sm font-semibold">تابلوی دیواری استودیو</h3>
    <label className="mt-2 block text-xs">طرح تابلو
      <select className="mt-1 min-h-9 w-full rounded border border-line bg-[#101722] px-2" value={sign?.design ?? "default"}
        onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { design: event.target.value as SignCustomization["design"] }))}>
        <option value="default">طرح پیش‌فرض</option><option value="text">عنوان متنی</option><option value="image" disabled={!sign?.imageAssetId}>تصویر یا نشان</option>
      </select>
    </label>
    {(sign?.design ?? "default") === "text" && <label className="mt-2 block text-xs">عنوان کانال یا قسمت
      <input maxLength={80} value={sign?.text ?? "Signal Studio"} onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { text: event.target.value }))}
        className="mt-1 min-h-9 w-full rounded border border-line bg-[#101722] px-2" />
    </label>}
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
      <label>رنگ زمینه <input type="color" value={sign?.backgroundColor ?? "#71c9c3"} onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { backgroundColor: event.target.value }))} className="mt-1 h-8 w-full" /></label>
      <label>رنگ نور <input type="color" value={sign?.glowColor ?? "#479e9b"} onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { glowColor: event.target.value }))} className="mt-1 h-8 w-full" /></label>
      {(sign?.design ?? "default") === "text" && <label>رنگ نوشته <input type="color" value={sign?.textColor ?? "#f0fffc"} onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { textColor: event.target.value }))} className="mt-1 h-8 w-full" /></label>}
    </div>
    <label className="mt-3 block text-xs">شدت روشنایی
      <input type="range" min="0" max="3" step="0.05" value={sign?.illumination ?? 0.8} onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { illumination: Number(event.target.value) }))} className="mt-2 w-full" />
    </label>
    <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={sign?.visible ?? true} onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { visible: event.target.checked }))} />نمایش تابلو</label>
    {(sign?.design === "image" || sign?.imageAssetId) && <label className="mt-3 block text-xs">تصویر
      <select className="mt-1 min-h-9 w-full rounded border border-line bg-[#101722] px-2" value={sign?.imageAssetId ?? ""} onChange={(event) => chooseImage(event.target.value)}>
        <option value="">انتخاب نشان</option>{images.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName}</option>)}
      </select>
    </label>}
    {(sign?.design === "image" || sign?.imageAssetId) && <label className="mt-3 block text-xs">جای‌گیری تصویر
      <select className="mt-1 min-h-9 w-full rounded border border-line bg-[#101722] px-2" value={sign?.fit ?? "contain"}
        onChange={(event) => onEdit((current) => updateSignCustomization(current, propId, { fit: event.target.value as SignCustomization["fit"] }))}>
        <option value="contain">کامل با حفظ نسبت</option><option value="cover">پوشاندن تابلو با برش</option>
      </select>
    </label>}
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} disabled={!project || uploading} onClick={() => input.current?.click()}>{uploading ? "در حال بارگذاری…" : sign?.imageAssetId ? "جایگزینی تصویر" : "بارگذاری تصویر یا نشان"}</button>
      {sign?.imageAssetId && <button type="button" className={button} onClick={() => onEdit((current) => updateSignCustomization(current, propId, { design: "default", imageAssetId: undefined }))}>حذف طرح سفارشی</button>}
      <button type="button" className={button} onClick={() => onEdit((current) => restoreSignDesign(current, propId))}>بازیابی طرح پیش‌فرض</button></div>
    <LocalTransformFields title="تبدیل مستقل تابلو" transform={sign?.transform ?? { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }}
      onChange={(transform) => onEdit((current) => updateSignCustomization(current, propId, { transform }))} />
  </> : <>
    <h3 className="text-sm font-semibold">قاب‌های تصویر دیواری</h3>
    <div className="mt-2 flex gap-2">{([0, 1] as const).map((value) => <button key={value} type="button" className={`${button} ${frameIndex === value ? "border-accent bg-[#19433f]" : ""}`} aria-pressed={frameIndex === value} onClick={() => setFrameIndex(value)}>{value === 0 ? "قاب چپ" : "قاب راست"}</button>)}</div>
    <label className="mt-3 block text-xs">تصویر قاب
      <select className="mt-1 min-h-9 w-full rounded border border-line bg-[#101722] px-2" value={frame?.imageAssetId ?? ""} onChange={(event) => chooseImage(event.target.value)}>
        <option value="">اثر پیش‌فرض</option>{images.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName}</option>)}
      </select>
    </label>
    <label className="mt-3 block text-xs">جای‌گیری تصویر
      <select className="mt-1 min-h-9 w-full rounded border border-line bg-[#101722] px-2" value={frame?.fit ?? "contain"} onChange={(event) => onEdit((current) => updateFrameCustomization(current, propId, frameIndex, { fit: event.target.value as FrameCustomization["fit"] }))}>
        <option value="contain">کامل با حفظ نسبت</option><option value="cover">پوشاندن قاب با برش</option>
      </select>
    </label>
    <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={frame?.visible ?? true} onChange={(event) => onEdit((current) => updateFrameCustomization(current, propId, frameIndex, { visible: event.target.checked }))} />نمایش قاب</label>
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} disabled={!project || uploading} onClick={() => input.current?.click()}>{uploading ? "در حال بارگذاری…" : frame?.imageAssetId ? "جایگزینی تصویر" : "بارگذاری تصویر"}</button>
      {frame?.imageAssetId && <button type="button" className={button} onClick={() => onEdit((current) => updateFrameCustomization(current, propId, frameIndex, { imageAssetId: undefined }))}>حذف تصویر سفارشی</button>}
      <button type="button" className={button} onClick={() => onEdit((current) => restoreFrameArtwork(current, propId, frameIndex))}>بازیابی اثر پیش‌فرض</button></div>
    <LocalTransformFields title={frameIndex === 0 ? "تبدیل مستقل قاب چپ" : "تبدیل مستقل قاب راست"}
      transform={frame?.transform ?? { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }}
      onChange={(transform) => onEdit((current) => updateFrameCustomization(current, propId, frameIndex, { transform }))} />
  </>;
  return <section className="mt-4 border-t border-line pt-4">{content}
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="بارگذاری تصویر تزئینی" onChange={(event) => void uploadImage(event.currentTarget.files?.[0])} />
  </section>;
}
