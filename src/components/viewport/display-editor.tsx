"use client";

import { useRef, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-schema";

type Assignment = ProjectDocument["displayAssignments"][string];
type Asset = ProjectDocument["assetManifest"][string];
const button = "rounded-lg border border-[#536276] px-2.5 py-1.5 text-xs hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent";

export function DisplayEditor({ project, assignment, onChange, onUpload, onInspect, inspecting, playing, onTogglePlayback }: {
  project: ProjectDocument;
  assignment?: Assignment;
  onChange: (assignment: Assignment) => void;
  onUpload: (file: File) => Promise<string | null>;
  onInspect: () => void;
  inspecting: boolean;
  playing: boolean;
  onTogglePlayback: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const initial: Assignment = assignment ?? { state: "off", fit: "contain", brightness: 1 };
  const images = Object.values(project.assetManifest).filter((asset) => asset.kind === "display-image");
  const videos = Object.values(project.assetManifest).filter((asset) => asset.kind === "display-video");
  const update = (patch: Partial<Assignment>) => onChange({ ...initial, ...patch });
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const id = await onUpload(file);
      if (id) {
        const isVideo = file.type.startsWith("video/");
        update(isVideo ? { state: "video", videoAssetId: id } : { state: "image", imageAssetId: id });
      }
    } finally { setUploading(false); if (input.current) input.current.value = ""; }
  };
  const selectAsset = (asset: Asset | undefined) => {
    if (!asset) return;
    update(asset.kind === "display-video" ? { state: "video", videoAssetId: asset.id } : { state: "image", imageAssetId: asset.id });
  };
  return <section className="mt-4 border-t border-line pt-4" aria-labelledby="display-title">
    <h3 id="display-title" className="text-sm font-bold">محتوای نمایشگر</h3>
    <p className="mt-1 text-xs leading-6 text-muted">محتوا روی صفحهٔ خود لپ‌تاپ قرار می‌گیرد و همراه آن حرکت می‌کند.</p>
    <div className="mt-3 flex flex-wrap gap-1.5">
      <button type="button" className={button} aria-pressed={initial.state === "image"} onClick={() => update({ state: "image" })} disabled={!initial.imageAssetId}>تصویر</button>
      <button type="button" className={button} aria-pressed={initial.state === "video"} onClick={() => update({ state: "video" })} disabled={!initial.videoAssetId}>ویدیو</button>
      <button type="button" className={button} aria-pressed={initial.state === "off"} onClick={() => update({ state: "off" })}>نمایشگر خاموش</button>
    </div>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" className="sr-only" aria-label="بارگذاری تصویر یا ویدیوی آموزشی"
      onChange={(event) => void upload(event.currentTarget.files?.[0])} />
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className={button} disabled={uploading} onClick={() => input.current?.click()}>{uploading ? "در حال بارگذاری…" : "بارگذاری تصویر / ویدیو"}</button>
      <button type="button" className={button} aria-pressed={inspecting} onClick={onInspect}>{inspecting ? "بازگشت به نمای استودیو" : "نمای نزدیک نمایشگر"}</button>
    </div>
    {images.length > 0 && <label className="mt-3 block text-xs">تصویر
      <select className="mt-1 min-h-9 w-full rounded-lg border border-[#536276] bg-[#101722] px-2" value={initial.imageAssetId ?? ""}
        onChange={(event) => { const asset = images.find((item) => item.id === event.target.value); if (asset) selectAsset(asset); }}>
        <option value="">انتخاب تصویر</option>{images.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName}</option>)}
      </select>
    </label>}
    {videos.length > 0 && <label className="mt-3 block text-xs">ویدیو
      <select className="mt-1 min-h-9 w-full rounded-lg border border-[#536276] bg-[#101722] px-2" value={initial.videoAssetId ?? ""}
        onChange={(event) => { const asset = videos.find((item) => item.id === event.target.value); if (asset) selectAsset(asset); }}>
        <option value="">انتخاب ویدیو</option>{videos.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName}</option>)}
      </select>
    </label>}
    {initial.state !== "off" && <>
      <label className="mt-3 block text-xs">جای‌گیری تصویر
        <select className="mt-1 min-h-9 w-full rounded-lg border border-[#536276] bg-[#101722] px-2" value={initial.fit} onChange={(event) => update({ fit: event.target.value as Assignment["fit"] })}>
          <option value="contain">کامل با حفظ نسبت</option><option value="cover">پرکردن صفحه و برش حاشیه</option>
        </select>
      </label>
      <label className="mt-3 block text-xs">روشنایی نمایشگر <span dir="ltr">{initial.brightness.toFixed(2)}×</span>
        <input className="mt-2 w-full accent-[#5ee0ce]" type="range" min="0.25" max="2" step="0.05" value={initial.brightness}
          onChange={(event) => update({ brightness: Number(event.target.value) })} />
      </label>
      {initial.state === "video" && <button type="button" className={`${button} mt-3`} onClick={onTogglePlayback}>{playing ? "توقف موقت ویدیو" : "پخش ویدیو"}</button>}
    </>}
  </section>;
}
