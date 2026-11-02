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
import type { SceneCameraConfig } from "@/lib/scenes/scene-schema";
import { defaultSceneCamera } from "@/lib/scenes/scene-schema";
import type { ProductionCameraConfig } from "@/lib/camera/production-camera";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";

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
  characterData, selectedCharacterId, onCharacterSelect, onCharacterCommit, showRoomWalls = true, characterPreviews = {}, characterGazes = {}, onCharacterPreviewComplete = () => undefined, onInspectChange = noopInspectChange, laptopContentViewerOpen = false,
  productionCamera = defaultSceneCamera(), productionCameraTarget, productionCameraPreview = false, onCameraCaptureReady = () => undefined, onSaveProductionCamera = () => undefined, onProductionCameraPreviewChange = () => undefined, cameraSaveMessage, onHelp = () => undefined }: {
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
  productionCamera?: SceneCameraConfig; productionCameraTarget?: [number, number, number]; productionCameraPreview?: boolean;
  onCameraCaptureReady?: (capture: () => ProductionCameraConfig) => void; onSaveProductionCamera?: () => void; onProductionCameraPreviewChange?: (preview: boolean) => void; cameraSaveMessage?: string | null; onHelp?: (topic: ContextHelpId) => void;
}) {
  const [status, setStatus] = useState<"checking" | "ready" | "unavailable" | "failed">("checking");
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [navigationMode, setNavigationMode] = useState<"orbit" | "free-fly">("orbit");
  const [freeFlyEngaged, setFreeFlyEngaged] = useState(false);
  const [navigationSpeed, setNavigationSpeed] = useState(4);
  const [focusRequest, setFocusRequest] = useState(0);
  const [navigationMessage, setNavigationMessage] = useState<string | null>(null);
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
  const resolvedTarget = productionCameraTarget ?? productionCamera.target;
  const focusTargetId = selectedCharacterId ?? selectedId;
  const enterFreeFly = () => {
    if (navigationMode === "free-fly" && freeFlyEngaged) { document.exitPointerLock(); setNavigationMode("orbit"); return; }
    const canvas = viewportRef.current?.querySelector("canvas");
    if (!canvas || !("requestPointerLock" in canvas)) { setNavigationMessage("حرکت آزاد با قفل اشاره‌گر در این مرورگر در دسترس نیست."); return; }
    setNavigationMessage(null); setNavigationMode("free-fly");
    try {
      const result = canvas.requestPointerLock();
      if (result && "catch" in result) void result.catch(() => { setNavigationMode("orbit"); setNavigationMessage("اجازهٔ حرکت آزاد داده نشد؛ حالت مدار همچنان فعال است."); });
    } catch { setNavigationMode("orbit"); setNavigationMessage("قفل اشاره‌گر فعال نشد؛ حالت مدار همچنان فعال است."); }
  };
  const handleFreeFlyEngagedChange = useCallback((engaged: boolean) => {
    setFreeFlyEngaged(engaged);
    if (!engaged) setNavigationMode((current) => current === "free-fly" ? "orbit" : current);
  }, []);
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
    <div className="studio-viewport-toolbar flex min-h-[46px] items-center justify-between gap-2 border-b border-line px-3 text-xs font-bold">
      <span id="viewport-title" className="flex min-w-0 shrink items-center gap-1 whitespace-nowrap">نمای صحنه <ContextHelpTrigger topic="editorCamera" onOpen={onHelp} /></span>
      <div className="viewport-toolbar-actions flex min-w-0 items-center gap-1">
        {arrangement && <div role="group" aria-label="حالت نمایش دوربین" className="viewport-tool-group">
          <button type="button" className="viewport-tool-button viewport-view-button" aria-pressed={!productionCameraPreview} title="نمای ویرایش را برای جابه‌جایی و تنظیم دوربین باز می‌کند؛ دوربین تولید ذخیره‌شده تغییر نمی‌کند." onClick={() => { setNavigationMode("orbit"); onProductionCameraPreviewChange(false); }}>ویرایش</button>
          <button type="button" className="viewport-tool-button viewport-view-button" aria-pressed={productionCameraPreview} disabled={laptopPresentation || Boolean(inspectPropId)} title={laptopPresentation || inspectPropId ? "برای دیدن دوربین تولید، ابتدا نمایش نزدیک لپ‌تاپ یا وسیله را ببندید." : "دوربین تولید ذخیره‌شدهٔ همین سکانس را پیش‌نمایش می‌کند."} onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); setNavigationMode("orbit"); onProductionCameraPreviewChange(true); }}>تولید</button>
        </div>}
        <details className="viewport-tool-more viewport-navigation-menu" onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.stopPropagation(); } }}>
          <summary className="viewport-tool-button" aria-label="ناوبری دوربین" title="حالت حرکت دوربین و ابزار کانونی‌سازی انتخاب را باز می‌کند.">◉</summary>
          <div className="viewport-tool-menu navigation-tool-menu" role="group" aria-label="ناوبری دوربین">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold">ناوبری دوربین <ContextHelpTrigger topic="cameraNavigation" onOpen={onHelp} /></div>
            <button type="button" aria-pressed={navigationMode === "orbit"} disabled={productionCameraPreview} title="با کشیدن ماوس دور هدف بچرخید؛ راست‌کلیک برای جابه‌جایی و چرخ اسکرول برای بزرگ‌نمایی است." onClick={() => { setNavigationMode("orbit"); setNavigationMessage(null); }}>مدار</button>
            <button type="button" aria-pressed={navigationMode === "free-fly" && freeFlyEngaged} disabled={productionCameraPreview || Boolean(inspectPropId)} title="با کلیک، اشاره‌گر را داخل نما قفل کنید؛ WASD حرکت، Q/E ارتفاع، Shift سرعت بیشتر، حرکت ماوس چرخش و Escape خروج است." onClick={enterFreeFly}>{navigationMode === "free-fly" && freeFlyEngaged ? "خروج از پرواز آزاد" : "پرواز آزاد"}</button>
            <button type="button" disabled={!focusTargetId || productionCameraPreview || navigationMode === "free-fly" || Boolean(inspectPropId)} title="دوربین ویرایش را نرم به محدودهٔ واقعی سر شخصیت یا وسیلهٔ انتخاب‌شده می‌برد؛ دوربین تولید ذخیره نمی‌شود." onClick={() => { setNavigationMode("orbit"); setFocusRequest((value) => value + 1); }}>کانونی‌سازی انتخاب</button>
            <label className="navigation-speed-control" title="سرعت حرکت دوربین در حالت پرواز آزاد را تنظیم می‌کند.">سرعت حرکت
              <input type="range" min="0.5" max="10" step="0.5" value={navigationSpeed} aria-label="سرعت حرکت دوربین" title="سرعت حرکت با کلیدهای WASD و Q/E را تنظیم می‌کند." onChange={(event) => setNavigationSpeed(Number(event.target.value))} />
              <span dir="ltr">{navigationSpeed.toFixed(1)}×</span>
            </label>
            <button type="button" disabled={productionCameraPreview} title="نمای دوربین ویرایش را به زاویهٔ شروع برمی‌گرداند؛ تنظیمات دوربین تولید دست‌نخورده می‌ماند." onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); setNavigationMode("orbit"); setCameraResetKey((key) => key + 1); }}>بازنشانی دوربین ویرایش</button>
            {navigationMessage && <p role="status" className="px-2 py-1 text-[10px] leading-5 text-amber-200">{navigationMessage}</p>}
          </div>
        </details>
        <div role="group" aria-label="نمایش و تمام‌صفحه" className="viewport-tool-group">
          <button type="button" className="viewport-tool-button" aria-label={showEditorHelpers ? "مخفی‌کردن راهنماها" : "نمایش راهنماها"} aria-pressed={!showEditorHelpers} title="خطوط و ابزارهای کمکی ویرایش را فقط در نمای فعلی پنهان یا نمایان می‌کند." onClick={() => setShowEditorHelpers((visible) => !visible)}>◇</button>
          <button type="button" className="viewport-tool-button" aria-label="بازنشانی دوربین ویرایش" title="دوربین ویرایش را به موقعیت اولیه بازمی‌گرداند؛ نمای تولید ذخیره‌شده تغییر نمی‌کند." disabled={productionCameraPreview} onClick={() => setCameraResetKey((key) => key + 1)}>↺</button>
        </div>
        <details className="viewport-tool-more" onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.stopPropagation(); } }}><summary className="viewport-tool-button" aria-label="ابزارهای بیشتر نما" title="ابزارهای ذخیرهٔ دوربین و ارائهٔ لپ‌تاپ را باز می‌کند.">⋯</summary><div className="viewport-tool-menu">
          <button type="button" disabled={!arrangement || productionCameraPreview} title="موقعیت، هدف و میدان دید دوربین ویرایش را برای دوربین تولید همین سکانس ذخیره می‌کند." onClick={(event) => { event.currentTarget.closest("details")!.open = false; onSaveProductionCamera(); }}>ذخیرهٔ نمای فعلی</button>
          <button type="button" disabled={!arrangement || productionCameraPreview} aria-pressed={laptopPresentation} title="نمای نزدیک لپ‌تاپ را برای ارائه باز یا بسته می‌کند." onClick={(event) => { event.currentTarget.closest("details")!.open = false; void presentLaptop(); }}>{laptopPresentation ? "پایان ارائهٔ لپ‌تاپ" : "ارائهٔ لپ‌تاپ"}</button>
        </div></details>
        <button type="button" className="viewport-fullscreen-button grid size-8 place-items-center rounded-md border border-[#536276] text-[#d6e3ef] transition-colors duration-150 hover:border-accent hover:bg-[#193334] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? "\u062E\u0631\u0648\u062C \u0627\u0632 \u062A\u0645\u0627\u0645\u0635\u0641\u062D\u0647" : "\u062A\u0645\u0627\u0645\u0635\u0641\u062D\u0647"} title="حالت تمام‌صفحه را روشن یا خاموش می‌کند تا نمای صحنه فضای بیشتری داشته باشد." aria-pressed={isFullscreen}>
          {isFullscreen ? <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7.5 3.5v4h-4m13 0h-4v-4m0 13v-4h4m-13 0h4v4" /></svg> : <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3.5 7.5v-4h4m9 4v-4h-4m-9 9v4h4m9-4v4h-4" /></svg>}
        </button>
        {fullscreenMessage && <span role="status" className="max-w-48 text-xs font-normal text-[#ffd58a]">{fullscreenMessage}</span>}
        </div>
    </div>
    <div className="studio-viewport-preview relative aspect-video w-full overflow-hidden bg-[#14212c]">
      {status === "ready" && <CanvasErrorBoundary><SceneCanvas onFailure={() => setStatus("failed")}
        arrangement={arrangement ?? previewArrangement} selectedId={arrangement ? selectedId : null}
        onSelect={arrangement ? onSelect : () => undefined} editingId={arrangement ? editingId : null}
        onEnterEdit={arrangement ? onEnterEdit : () => undefined} onCommit={onCommit} mode={mode}
        cameraResetKey={cameraResetKey}
        freeFlyActive={navigationMode === "free-fly" && !productionCameraPreview && !inspectPropId} navigationSpeed={navigationSpeed}
        focusRequest={focusRequest} focusTargetId={focusTargetId} onFreeFlyEngagedChange={handleFreeFlyEngagedChange}
        showEditorHelpers={showEditorHelpers && !isFullscreen && !laptopPresentation && !laptopContentViewerOpen}
        showRoomWalls={showRoomWalls}
        projectId={arrangement ? projectId : null} displayAssignments={arrangement ? displayAssignments : {}}
        mediaPlaying={mediaPlaying && Boolean(arrangement)} inspectPropId={arrangement ? inspectPropId : null}
        characterData={arrangement ? characterData : { characterIdentities: {}, characterInstances: {}, characterStates: {} }}
        selectedCharacterId={arrangement ? selectedCharacterId : null} onCharacterSelect={onCharacterSelect} onCharacterCommit={onCharacterCommit}
        characterPreviews={arrangement ? characterPreviews : {}} characterGazes={arrangement ? characterGazes : {}} onCharacterPreviewComplete={onCharacterPreviewComplete}
        productionCamera={productionCamera} productionCameraTarget={resolvedTarget} productionCameraPreview={productionCameraPreview} onCameraCaptureReady={onCameraCaptureReady} /></CanvasErrorBoundary>}
      {productionCameraPreview && <span className="absolute bottom-2 left-2 z-10 rounded-md border border-accent bg-[#101722]/90 px-2 py-1 text-[11px] text-[#c9fff7]" title="این دوربین فقط پیش‌نمایش موقت نمای تولید سکانس را نشان می‌دهد.">پیش‌نمایش دوربین تولید</span>}
      {cameraSaveMessage && <span role="status" aria-live="polite" className="absolute bottom-2 right-2 z-10 max-w-[min(85%,360px)] rounded-md border border-accent bg-[#101722]/95 px-2.5 py-1.5 text-[11px] leading-5 text-[#d9fff8]">{cameraSaveMessage}</span>}
      {status === "checking" && <div role="status" className="grid h-full place-items-center text-xs text-muted">در حال آماده‌سازی نمای سه‌بعدی…</div>}
      {(status === "unavailable" || status === "failed") && <WebGLFallback unavailable={status === "unavailable"} />}
    </div>
    <div className="studio-viewport-caption flex flex-wrap justify-between gap-x-3 gap-y-1 px-[15px] py-[7px] text-xs text-[#a8b8c8]">
      <span>محیط استودیوی پادکست · قاب ۱۶:۹</span>
      <span>برای چرخش بکشید؛ برای بزرگ‌نمایی از چرخ ماوس استفاده کنید.</span>
    </div>
  </section>;
}
