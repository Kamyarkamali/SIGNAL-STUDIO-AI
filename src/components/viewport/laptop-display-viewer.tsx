"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef } from "react";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import { initialLaptopViewerState, reduceLaptopViewerState } from "@/lib/environments/laptop-viewer-state";
import { toggleElementFullscreen } from "./fullscreen";

type Assignment = ProjectDocument["displayAssignments"][string];
const button = "rounded-md border border-[#536276] px-2.5 py-1.5 text-xs transition-colors duration-150 hover:border-accent hover:bg-[#193334] focus-visible:outline-2 focus-visible:outline-accent";

export function LaptopDisplayViewer({ project, assignment, playing, onOpenChange = () => undefined }: { project: ProjectDocument; assignment?: Assignment; playing: boolean; onOpenChange?: (open: boolean) => void }) {
  const [state, dispatch] = useReducer(reduceLaptopViewerState, initialLaptopViewerState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wasFullscreen = useRef(false);
  const currentAssetId = assignment?.state === "image" ? assignment.imageAssetId : assignment?.state === "video" ? assignment.videoAssetId : undefined;
  const asset = currentAssetId ? project.assetManifest[currentAssetId] : undefined;
  const mediaUrl = asset && (asset.kind === "display-image" || asset.kind === "display-video")
    ? `/api/projects/${project.id}/display-assets/${asset.id}` : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    const sync = () => {
      const fullscreen = Boolean(dialog && document.fullscreenElement === dialog);
      dispatch({ type: "fullscreen", value: fullscreen });
      if (wasFullscreen.current && !fullscreen && dialog?.open) dialog.close();
      wasFullscreen.current = fullscreen;
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
    void toggleElementFullscreen(dialog, document).then((result) => {
      if (result === "unsupported") dispatch({ type: "message", value: "حالت تمام‌صفحه در این مرورگر پشتیبانی نمی‌شود؛ نمایشگر در پنجره ادامه دارد." });
      if (result === "denied") dispatch({ type: "message", value: "اجازهٔ تمام‌صفحه داده نشد؛ محتوا در پنجره قابل مشاهده است." });
    });
  };

  const closeViewer = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (document.fullscreenElement === dialog && document.exitFullscreen) {
      void document.exitFullscreen().finally(() => { if (dialog.open) dialog.close(); });
    } else if (dialog.open) dialog.close();
  };

  return <>
    <button type="button" className={button} aria-haspopup="dialog" onClick={openViewer}>نمایش محتوای نمایشگر (تمام‌صفحه)</button>
    <dialog ref={dialogRef} className="laptop-display-viewer" aria-labelledby="laptop-viewer-title" onClose={() => { dispatch({ type: "close" }); onOpenChange(false); }}>
      <div className="laptop-display-viewer-shell" dir="rtl">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 id="laptop-viewer-title" className="text-sm font-semibold">نمایشگر لپ‌تاپ</h2>
          <button type="button" className={button} aria-label={state.fullscreen ? "خروج از تمام‌صفحه و بستن نمایشگر" : "بستن نمایشگر"} onClick={closeViewer}>{state.fullscreen ? "خروج از تمام‌صفحه" : "بستن"}</button>
        </header>
        {state.message && <p role="status" className="px-4 pt-2 text-xs text-[#ffd58a]">{state.message}</p>}
        <div className="laptop-display-viewer-content" aria-live="polite">
          {assignment?.state === "image" && mediaUrl && asset?.kind === "display-image"
            ? <Image src={mediaUrl} alt={asset.displayName} fill unoptimized sizes="100vw" style={{ objectFit: assignment.fit, filter: `brightness(${assignment.brightness})` }} />
            : assignment?.state === "video" && mediaUrl && asset?.kind === "display-video"
              ? <video key={mediaUrl} src={mediaUrl} autoPlay={playing} controls loop muted playsInline style={{ objectFit: assignment.fit, filter: `brightness(${assignment.brightness})` }} aria-label={asset.displayName} />
              : <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">{assignment?.state === "off" || !assignment ? "نمایشگر لپ‌تاپ خاموش است." : "رسانهٔ انتخاب‌شده در دسترس نیست."}</div>}
        </div>
      </div>
    </dialog>
  </>;
}
