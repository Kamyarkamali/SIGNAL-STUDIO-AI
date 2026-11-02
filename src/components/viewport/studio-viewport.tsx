"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { hasWebGL } from "./webgl-support";
import { isElementFullscreen, toggleElementFullscreen } from "./fullscreen";
import { defaultArrangement, type EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { TransformConfig } from "@/lib/environments/environment-registry";
import type { TransformMode } from "@/components/layout/properties-panel";
import type { ProjectDocument } from "@/lib/projects/project-schema";
import type { CharacterProjectData, CharacterState } from "@/lib/characters/character-schema";
import type { CharacterPreviewPlayback } from "@/components/characters/character-layer";
import type { GazePreview } from "@/lib/characters/gaze-preview";

const SceneCanvas = dynamic(() => import("./scene-canvas"), { ssr: false });

function WebGLFallback({ unavailable }: { unavailable: boolean }) {
  return <div role="alert" className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center">
    <strong className="text-sm text-foreground">نمای سه‌بعدی قابل اجرا نیست</strong>
    <span className="text-xs leading-7 text-muted">{unavailable
      ? "مرورگر یا دستگاه شما WebGL را در دسترس قرار نمی‌دهد. شتاب‌دهی سخت‌افزاری مرورگر را بررسی کنید."
      : "راه‌اندازی نمای سه‌بعدی با خطا روبه‌رو شد. صفحه را دوباره بارگذاری کنید."}</span>
  </div>;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("3D viewport initialization failed", error, info);
  }
  render() { return this.state.failed ? <WebGLFallback unavailable={false} /> : this.props.children; }
}

const previewArrangement = defaultArrangement();
const noopInspectChange = () => undefined;

export function StudioViewport({ arrangement, selectedId, editingId, onSelect, onEnterEdit, onCommit, mode, projectId, displayAssignments, mediaPlaying, inspectPropId,
  characterData, selectedCharacterId, onCharacterSelect, onCharacterCommit, showRoomWalls = true, characterPreviews = {}, characterGazes = {}, onCharacterPreviewComplete = () => undefined, onInspectChange = noopInspectChange, laptopContentViewerOpen = false }: {
  arrangement: EnvironmentArrangement | null; selectedId: string | null; editingId: string | null;
  onSelect: (id: string | null) => void; onEnterEdit: (id: string, editable: boolean) => void;
  onCommit: (id: string, transform: TransformConfig) => void; mode: TransformMode;
  projectId: string | null; displayAssignments: ProjectDocument["displayAssignments"]; mediaPlaying: boolean; inspectPropId: string | null;
  characterData: CharacterProjectData; selectedCharacterId: string | null;
  onCharacterSelect: (id: string | null) => void; onCharacterCommit: (id: string, state: CharacterState) => void;
  characterPreviews?: Record<string, CharacterPreviewPlayback>;
  characterGazes?: Record<string, GazePreview>;
  onCharacterPreviewComplete?: (id: string, startedAtMs: number) => void;
  onInspectChange?: (id: string | null) => void;
  laptopContentViewerOpen?: boolean;
  showRoomWalls?: boolean;
}) {
  const [status, setStatus] = useState<"checking" | "ready" | "unavailable" | "failed">("checking");
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEditorHelpers, setShowEditorHelpers] = useState(true);
  const [laptopPresentation, setLaptopPresentation] = useState(false);
  const previousInspection = useRef<string | null>(null);
  const laptopPresentationActive = useRef(false);
  const finishLaptopPresentation = useCallback(() => {
    if (!laptopPresentationActive.current) return;
    laptopPresentationActive.current = false;
    setLaptopPresentation(false);
    onInspectChange(previousInspection.current);
    previousInspection.current = null;
  }, [onInspectChange]);
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);
  const viewportRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus(hasWebGL(() => document.createElement("canvas")) ? "ready" : "unavailable");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      const fullscreen = isElementFullscreen(viewportRef.current, document);
      setIsFullscreen(fullscreen);
      setFullscreenMessage(null);
      if (!fullscreen && laptopPresentation) finishLaptopPresentation();
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [finishLaptopPresentation, laptopPresentation]);

  const presentLaptop = async () => {
    if (!arrangement) return;
    if (laptopPresentation) {
      if (document.fullscreenElement === viewportRef.current && document.exitFullscreen) await document.exitFullscreen().catch(() => undefined);
      finishLaptopPresentation();
      return;
    }
    previousInspection.current = inspectPropId;
    laptopPresentationActive.current = true;
    setLaptopPresentation(true);
    onInspectChange(arrangement.props.find((prop) => prop.id.endsWith(":laptop"))?.id ?? "studio-01:laptop");
    const viewport = viewportRef.current;
    if (viewport && document.fullscreenElement !== viewport) {
      const result = await toggleElementFullscreen(viewport, document);
      if (result === "unsupported") setFullscreenMessage("\u062A\u0645\u0627\u0645\u200C\u0635\u0641\u062D\u0647 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0646\u0645\u06CC\u200C\u0634\u0648\u062F\u061B \u0646\u0645\u0627\u06CC\u0634 \u0646\u0632\u062F\u06CC\u06A9 \u0644\u067E\u200C\u062A\u0627\u067E \u062F\u0631 \u0647\u0645\u06CC\u0646 \u0646\u0645\u0627\u06CC \u06A9\u0627\u0631 \u0645\u06CC\u200C\u0645\u0627\u0646\u062F.");
      if (result === "denied") setFullscreenMessage("\u0627\u062C\u0627\u0632\u0647\u0654 \u062A\u0645\u0627\u0645\u200C\u0635\u0641\u062D\u0647 \u062F\u0627\u062F\u0647 \u0646\u0634\u062F\u061B \u0646\u0645\u0627\u06CC\u0634 \u0646\u0632\u062F\u06CC\u06A9 \u0644\u067E\u200C\u062A\u0627\u067E \u062F\u0631 \u0647\u0645\u06CC\u0646 \u0646\u0645\u0627\u06CC \u06A9\u0627\u0631 \u0645\u06CC\u200C\u0645\u0627\u0646\u062F.");
    }
  };

  const toggleFullscreen = async () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setFullscreenMessage(null);
    const result = await toggleElementFullscreen(viewport, document);
    if (result === "unsupported") setFullscreenMessage("تمام‌صفحه در این مرورگر پشتیبانی نمی‌شود.");
    if (result === "denied") setFullscreenMessage("مرورگر اجازه ورود به حالت تمام‌صفحه را نداد. دوباره تلاش کنید.");
  };

  return <section ref={viewportRef} className="studio-viewport-card w-full overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="viewport-title">
    <div className="studio-viewport-toolbar flex h-[43px] items-center justify-between gap-3 border-b border-line px-4 text-[13px] font-bold">
      <span id="viewport-title">نمای صحنه</span>
      <div className="flex items-center gap-2"><button type="button" className="rounded-md border border-[#536276] px-2 py-1 text-xs font-normal hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent" onClick={() => setCameraResetKey((key) => key + 1)}>بازنشانی دوربین</button>
        {arrangement && <button type="button" className="rounded-md border border-[#536276] px-2 py-1 text-xs font-normal hover:bg-[#2c4051] focus-visible:outline-2 focus-visible:outline-accent" aria-pressed={!showEditorHelpers} title="\u067e\u0646\u0647\u0627\u0646 \u06a9\u0631\u062f\u0646 \u0645\u0648\u0642\u062a \u0631\u0627\u0647\u0646\u0645\u0627\u0647\u0627\u06cc \u0648\u06cc\u0631\u0627\u06cc\u0634" onClick={() => setShowEditorHelpers((visible) => !visible)}>{showEditorHelpers ? "\u067e\u0646\u0647\u0627\u0646 \u06a9\u0631\u062f\u0646 \u0631\u0627\u0647\u0646\u0645\u0627\u0647\u0627" : "\u0646\u0645\u0627\u06cc\u0634 \u0631\u0627\u0647\u0646\u0645\u0627\u0647\u0627"}</button>}
        {arrangement && <button type="button" className="rounded-md border border-accent px-2 py-1 text-xs font-normal text-[#c9fff7] hover:bg-[#193334] focus-visible:outline-2 focus-visible:outline-accent" aria-pressed={laptopPresentation} onClick={() => void presentLaptop()}>{laptopPresentation ? "\u067e\u0627\u06cc\u0627\u0646 \u0627\u0631\u0627\u0626\u0647\u0654 \u0644\u067e\u200c\u062a\u0627\u067e" : "\u0627\u0631\u0627\u0626\u0647\u0654 \u0644\u067e\u200c\u062a\u0627\u067e"}</button>}
        <button type="button" className="viewport-fullscreen-button grid size-8 place-items-center rounded-md border border-[#536276] text-[#d6e3ef] transition-colors duration-150 hover:border-accent hover:bg-[#193334] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? "\u062E\u0631\u0648\u062C \u0627\u0632 \u062A\u0645\u0627\u0645\u0635\u0641\u062D\u0647" : "\u062A\u0645\u0627\u0645\u0635\u0641\u062D\u0647"} title={isFullscreen ? "\u062E\u0631\u0648\u062C \u0627\u0632 \u062A\u0645\u0627\u0645\u0635\u0641\u062D\u0647" : "\u062A\u0645\u0627\u0645\u0635\u0641\u062D\u0647"} aria-pressed={isFullscreen}>
          {isFullscreen ? <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7.5 3.5v4h-4m13 0h-4v-4m0 13v-4h4m-13 0h4v4" /></svg> : <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 7.5v-4h4m9 4v-4h-4m-9 9v4h4m9-4v4h-4" /></svg>}
        </button>
        {fullscreenMessage && <span role="status" className="max-w-48 text-xs font-normal text-[#ffd58a]">{fullscreenMessage}</span>}
        <span className="max-[650px]:hidden text-xs font-normal text-[#a8b8c8]">استودیوی پادکست مدرن · ۰۱</span></div>
    </div>
    <div className="studio-viewport-preview relative aspect-video w-full overflow-hidden bg-[#14212c]">
      {status === "ready" && <CanvasErrorBoundary><SceneCanvas onFailure={() => setStatus("failed")}
        arrangement={arrangement ?? previewArrangement} selectedId={arrangement ? selectedId : null}
        onSelect={arrangement ? onSelect : () => undefined} editingId={arrangement ? editingId : null}
        onEnterEdit={arrangement ? onEnterEdit : () => undefined} onCommit={onCommit} mode={mode}
        cameraResetKey={cameraResetKey}
        showEditorHelpers={showEditorHelpers && !isFullscreen && !laptopPresentation && !laptopContentViewerOpen}
        showRoomWalls={showRoomWalls}
        projectId={arrangement ? projectId : null} displayAssignments={arrangement ? displayAssignments : {}}
        mediaPlaying={mediaPlaying && Boolean(arrangement)} inspectPropId={arrangement ? inspectPropId : null}
        characterData={arrangement ? characterData : { characterIdentities: {}, characterInstances: {}, characterStates: {} }}
        selectedCharacterId={arrangement ? selectedCharacterId : null} onCharacterSelect={onCharacterSelect} onCharacterCommit={onCharacterCommit}
        characterPreviews={arrangement ? characterPreviews : {}} characterGazes={arrangement ? characterGazes : {}} onCharacterPreviewComplete={onCharacterPreviewComplete} /></CanvasErrorBoundary>}
      {status === "checking" && <div role="status" className="grid h-full place-items-center text-xs text-muted">در حال آماده‌سازی نمای سه‌بعدی…</div>}
      {(status === "unavailable" || status === "failed") && <WebGLFallback unavailable={status === "unavailable"} />}
    </div>
    <div className="studio-viewport-caption flex flex-wrap justify-between gap-x-3 gap-y-1 px-[15px] py-[7px] text-xs text-[#a8b8c8]">
      <span>محیط استودیوی پادکست · قاب ۱۶:۹</span>
      <span>برای چرخش بکشید؛ برای بزرگ‌نمایی از چرخ ماوس استفاده کنید.</span>
    </div>
  </section>;
}
