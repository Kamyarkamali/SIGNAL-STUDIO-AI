"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { hasWebGL } from "./webgl-support";
import { defaultArrangement, type EnvironmentArrangement } from "@/lib/environments/arrangement";
import type { TransformConfig } from "@/lib/environments/environment-registry";
import type { TransformMode } from "@/components/layout/properties-panel";

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

export function StudioViewport({ arrangement, selectedId, onSelect, onCommit, mode }: {
  arrangement: EnvironmentArrangement | null; selectedId: string | null;
  onSelect: (id: string | null) => void; onCommit: (id: string, transform: TransformConfig) => void; mode: TransformMode;
}) {
  const [status, setStatus] = useState<"checking" | "ready" | "unavailable" | "failed">("checking");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus(hasWebGL(() => document.createElement("canvas")) ? "ready" : "unavailable");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <section className="overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="viewport-title">
    <div className="flex h-[43px] items-center justify-between gap-3 border-b border-line px-4 text-[13px] font-bold">
      <span id="viewport-title">نمای صحنه</span>
      <span className="text-xs font-normal text-[#a8b8c8]">استودیوی پادکست مدرن · ۰۱</span>
    </div>
    <div className="relative aspect-video w-full overflow-hidden bg-[#14212c]">
      {status === "ready" && <CanvasErrorBoundary><SceneCanvas onFailure={() => setStatus("failed")}
        arrangement={arrangement ?? previewArrangement} selectedId={arrangement ? selectedId : null}
        onSelect={arrangement ? onSelect : () => undefined} onCommit={onCommit} mode={mode} /></CanvasErrorBoundary>}
      {status === "checking" && <div role="status" className="grid h-full place-items-center text-xs text-muted">در حال آماده‌سازی نمای سه‌بعدی…</div>}
      {(status === "unavailable" || status === "failed") && <WebGLFallback unavailable={status === "unavailable"} />}
    </div>
    <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 px-[15px] py-[7px] text-xs text-[#a8b8c8]">
      <span>محیط استودیوی پادکست · قاب ۱۶:۹</span>
      <span>برای چرخش بکشید؛ برای بزرگ‌نمایی از چرخ ماوس استفاده کنید.</span>
    </div>
  </section>;
}
