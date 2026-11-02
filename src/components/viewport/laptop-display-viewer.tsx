"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef } from "react";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { initialLaptopViewerState, reduceLaptopViewerState } from "@/lib/environments/laptop-viewer-state";
import { toggleElementFullscreen } from "./fullscreen";
import { laptopVisualSpec } from "@/lib/environments/studio-visual-spec";

type Assignment = ProjectDocument["displayAssignments"][string];
const button = "rounded-md border border-[#536276] px-2.5 py-1.5 text-xs transition-colors duration-150 hover:border-accent hover:bg-[#193334] focus-visible:outline-2 focus-visible:outline-accent";

export function LaptopDisplayViewer({ project, assignment, playing, onOpenChange = () => undefined }: { project: ProjectDocument; assignment?: Assignment; playing: boolean; onOpenChange?: (open: boolean) => void }) {
  const [state, dispatch] = useReducer(reduceLaptopViewerState, initialLaptopViewerState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const currentAssetId = assignment?.state === "image" ? assignment.imageAssetId : assignment?.state === "video" ? assignment.videoAssetId : undefined;
  const asset = currentAssetId ? project.assetManifest[currentAssetId] : undefined;
  const mediaUrl = asset && (asset.kind === "display-image" || asset.kind === "display-video") ? `/api/projects/${project.id}/display-assets/${asset.id}` : undefined;
  const screenAspect = laptopVisualSpec.screenSurfaceSize[0] / laptopVisualSpec.screenSurfaceSize[1];
  const frameAspect = laptopVisualSpec.screenFrameSize[0] / laptopVisualSpec.screenFrameSize[1];

  useEffect(() => {
    const dialog = dialogRef.current;
    const sync = () => {
      const fullscreen = Boolean(dialog && document.fullscreenElement === dialog);
      dispatch({ type: "fullscreen", value: fullscreen });
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const openViewer = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    dispatch({ type: "open" });
    onOpenChange(true);
  };
  const toggleFullscreen = async () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const result = await toggleElementFullscreen(dialog, document);
    if (result === "unsupported") dispatch({ type: "message", value: "تمام‌صفحه پشتیبانی نمی‌شود؛ نمایشگر در همین پنجره می‌ماند." });
    if (result === "denied") dispatch({ type: "message", value: "اجازهٔ تمام‌صفحه داده نشد؛ نمایشگر در همین پنجره قابل مشاهده است." });
  };
  const closeViewer = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (document.fullscreenElement === dialog && document.exitFullscreen) {
      void document.exitFullscreen().finally(() => { if (dialog.open) dialog.close(); });
    } else if (dialog.open) dialog.close();
  };
  const media = assignment?.state === "image" && mediaUrl && asset?.kind === "display-image"
    ? <Image src={mediaUrl} alt={asset.displayName} fill unoptimized sizes="(max-width: 900px) 94vw, 1200px" style={{ objectFit: assignment.fit, filter: `brightness(${assignment.brightness})` }} />
    : assignment?.state === "video" && mediaUrl && asset?.kind === "display-video"
      ? <video key={mediaUrl} src={mediaUrl} autoPlay={playing} controls loop muted playsInline style={{ objectFit: assignment.fit, filter: `brightness(${assignment.brightness})` }} aria-label={asset.displayName} />
      : <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">{assignment?.state === "off" || !assignment ? "نمایشگر لپ‌تاپ خاموش است." : "رسانهٔ انتخاب‌شده در دسترس نیست."}</div>;

  return <>
    <button type="button" className={button} aria-haspopup="dialog" onClick={openViewer}>نمایش آموزشی لپ‌تاپ</button>
    <dialog ref={dialogRef} className="laptop-display-viewer" aria-labelledby="laptop-viewer-title" onClose={() => { dispatch({ type: "close" }); onOpenChange(false); }}>
      <div className={`laptop-display-viewer-shell laptop-view-${state.mode}`} dir="rtl">
        <header className="laptop-viewer-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 id="laptop-viewer-title" className="text-sm font-semibold">نمایشگر لپ‌تاپ</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs">حالت نمایش
              <select aria-label="حالت نمایش" value={state.mode} onChange={(event) => dispatch({ type: "mode", value: event.target.value as typeof state.mode })} className="rounded border border-line bg-[#101722] px-2 py-1.5">
                <option value="device">نمای دستگاه</option><option value="screen">تمرکز روی صفحه</option><option value="content">محتوا فقط</option>
              </select>
            </label>
            <button type="button" className={button} onClick={() => void toggleFullscreen()} aria-pressed={state.fullscreen}>{state.fullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه"}</button>
            <button type="button" className={button} aria-label="بستن نمایشگر" onClick={closeViewer}>بستن</button>
          </div>
        </header>
        {state.message && <p role="status" className="px-4 pt-2 text-xs text-[#ffd58a]">{state.message}</p>}
        <div className="laptop-display-stage" aria-live="polite">
          {state.mode === "content" ? <div className="laptop-content-only">{media}</div> : <div className={`laptop-hardware-frame ${state.mode === "device" ? "is-device" : "is-screen"}`}>
            <div className="laptop-screen-bezel" style={{ aspectRatio: String(frameAspect) }}>
              <span className="laptop-camera-dot" aria-hidden="true" />
              <div className="laptop-hinge" aria-hidden="true" />
              <div className="laptop-screen-media" style={{ aspectRatio: String(screenAspect) }}>{media}</div>
            </div>
            {state.mode === "device" && <div className="laptop-device-base" aria-hidden="true"><div className="laptop-device-keyboard" /><div className="laptop-device-trackpad" /></div>}
          </div>}
        </div>
      </div>
    </dialog>
  </>;
}
