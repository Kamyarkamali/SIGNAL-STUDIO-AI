"use client";

import { useRef } from "react";
import { clampWorkspaceDimension } from "@/lib/layout/workspace-layout";

type Props = { axis: "x" | "y"; value: number; min: number; max: number; onChange: (value: number) => void; invert?: boolean; label: string };
export function WorkspaceResizeHandle({ axis, value, min, max, onChange, invert = false, label }: Props) {
  const start = useRef<{ coordinate: number; value: number } | null>(null);
  const coordinate = (event: React.PointerEvent<HTMLDivElement>) => axis === "x" ? event.clientX : event.clientY;
  const direction = invert ? -1 : 1;
  const clamp = (next: number) => onChange(clampWorkspaceDimension(next, min, max));
  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const positive = axis === "x" ? "ArrowRight" : "ArrowUp";
    const negative = axis === "x" ? "ArrowLeft" : "ArrowDown";
    if (event.key === positive || event.key === negative) {
      event.preventDefault(); clamp(value + (event.key === positive ? 16 : -16));
    } else if (event.key === "Home") { event.preventDefault(); clamp(min); }
    else if (event.key === "End") { event.preventDefault(); clamp(max); }
  };
  return <div role="separator" aria-orientation={axis === "x" ? "vertical" : "horizontal"} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value)} tabIndex={0}
    className={`workspace-resize-handle ${axis === "x" ? "workspace-resize-x" : "workspace-resize-y"}`} title={`${label}؛ با کشیدن یا کلیدهای جهت‌دار تغییر دهید`}
    onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); start.current = { coordinate: coordinate(event), value }; }}
    onPointerMove={(event) => { if (!start.current || (event.buttons & 1) !== 1) return; const delta = (coordinate(event) - start.current.coordinate) * direction; clamp(start.current.value + delta); }}
    onPointerUp={() => { start.current = null; }} onPointerCancel={() => { start.current = null; }} onKeyDown={keyDown} />;
}
