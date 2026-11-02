"use client";

import { useRef, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { removeLaptopImageAssignment } from "@/lib/environments/display-assignment";
import { LaptopDisplayViewer } from "./laptop-display-viewer";

type Assignment = ProjectDocument["displayAssignments"][string];
type Asset = ProjectDocument["assetManifest"][string];
const button = "rounded-lg border border-[#536276] px-2.5 py-1.5 text-xs hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent";

export function DisplayEditor({ project, assignment, onChange, onUpload, onDeleteImage, onInspect, inspecting, playing, onTogglePlayback, onViewerOpenChange }: {
  project: ProjectDocument;
  assignment?: Assignment;
  onChange: (assignment: Assignment) => void;
  onUpload: (file: File) => Promise<string | null>;
  onDeleteImage: (assetId: string) => Promise<ProjectDocument>;
  onInspect: () => void;
  inspecting: boolean;
  playing: boolean;
  onTogglePlayback: () => void;
  onViewerOpenChange?: (open: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [deleteError, setDeleteError] = useState("");
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
  const requestDelete = (asset: Asset) => {
    setDeleteAsset(asset); setDeleteError(""); deleteDialog.current?.showModal();
  };
  const closeDelete = (force = false) => { if (deleting && !force) return; deleteDialog.current?.close(); setDeleteAsset(null); setDeleteError(""); };
  const confirmDelete = async () => {
    if (!deleteAsset || deleting) return;
    setDeleting(true); setDeleteError("");
    try { await onDeleteImage(deleteAsset.id); closeDelete(true); }
    catch (cause) { setDeleteError(cause instanceof Error ? cause.message : "حذف تصویر انجام نشد."); }
    finally { setDeleting(false); }
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
      <LaptopDisplayViewer project={project} assignment={assignment} playing={playing} onOpenChange={onViewerOpenChange} />
    </div>
    {images.length > 0 && <label className="mt-3 block text-xs">تصویر
      <select className="mt-1 min-h-9 w-full rounded-lg border border-[#536276] bg-[#101722] px-2" value={initial.imageAssetId ?? ""}
        onChange={(event) => { const asset = images.find((item) => item.id === event.target.value); if (asset) selectAsset(asset); }}>
        <option value="">انتخاب تصویر</option>{images.map((asset) => <option key={asset.id} value={asset.id}>{asset.displayName}</option>)}
      </select>
    </label>}
    {initial.imageAssetId && <button type="button" className={`${button} mt-2`} onClick={() => onChange(removeLaptopImageAssignment(initial))}>برداشتن تصویر از لپ‌تاپ</button>}
    {images.length > 0 && <details className="mt-3 rounded-lg border border-[#334354] px-3 py-2">
      <summary className="cursor-pointer text-xs font-medium">کتابخانهٔ تصاویر ({images.length})</summary>
      <p className="mt-2 text-[11px] leading-5 text-muted">حذف قطعی فقط وقتی ممکن است که تصویر به لپ‌تاپ، تابلو یا قاب‌های استودیو متصل نباشد.</p>
      <ul className="mt-2 space-y-1.5">{images.map((asset) => <li key={asset.id} className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate" title={asset.displayName}>{asset.displayName}</span>
        <button type="button" className={`${button} shrink-0`} disabled={deleting || asset.origin !== "imported"} onClick={() => requestDelete(asset)}>حذف تصویر</button>
      </li>)}</ul>
    </details>}
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
    <dialog ref={deleteDialog} className="media-delete-confirm" aria-labelledby="delete-image-title" onClose={() => { if (!deleting) setDeleteAsset(null); }}>
      <div dir="rtl" className="grid gap-3">
        <h4 id="delete-image-title" className="text-sm font-semibold">حذف قطعی تصویر؟</h4>
        <p className="break-words text-xs leading-5 text-muted">«{deleteAsset?.displayName}» از فایل‌های این پروژه حذف می‌شود. اتصال از لپ‌تاپ با حذف فایل فرق دارد.</p>
        {deleteError && <p role="alert" className="text-xs leading-5 text-amber-200">{deleteError}</p>}
        {deleteAsset && deleteAsset.id === initial.imageAssetId && <button type="button" className={`${button} justify-self-start`} disabled={deleting} onClick={() => { onChange(removeLaptopImageAssignment(initial)); setDeleteError("تصویر از لپ‌تاپ جدا شد. پس از ذخیره، حذف قطعی را دوباره تأیید کنید."); }}>جداکردن از لپ‌تاپ و ادامه</button>}
        <div className="flex justify-end gap-2"><button type="button" className={button} disabled={deleting} onClick={() => closeDelete()}>انصراف</button><button type="button" className={`${button} border-red-400 text-red-100`} disabled={deleting || !deleteAsset} onClick={() => void confirmDelete()}>{deleting ? "در حال حذف…" : "حذف قطعی"}</button></div>
      </div>
    </dialog>
  </section>;
}
