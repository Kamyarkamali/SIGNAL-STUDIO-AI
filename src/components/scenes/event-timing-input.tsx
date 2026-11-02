"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { formatSceneEventTime, formatStartSeconds, parseSceneEventTimeDraft, type SceneEventTimeMode } from "@/lib/scenes/event-timing-input";

export function EventTimeRangeInput({ startFrame, durationFrames, sceneDurationFrames, fps, onCommit, idPrefix }: {
  startFrame: number;
  durationFrames: number;
  sceneDurationFrames: number;
  fps: number;
  onCommit: (startFrame: number, durationFrames: number) => void;
  idPrefix: string;
}) {
  const [mode, setMode] = useState<SceneEventTimeMode>("timecode");
  const [startDraft, setStartDraft] = useState<string | null>(null);
  const [endDraft, setEndDraft] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});
  const skipBlur = useRef<"start" | "end" | null>(null);
  const endFrame = startFrame + durationFrames;
  const startValue = startDraft ?? formatSceneEventTime(startFrame, fps, mode);
  const endValue = endDraft ?? formatSceneEventTime(endFrame, fps, mode);
  const inputClass = "min-h-9 w-full min-w-0 rounded-md border border-line bg-[#101722] px-2 text-left text-xs text-foreground focus-visible:outline-2 focus-visible:outline-accent";

  const validate = (field: "start" | "end", raw: string) => {
    if (skipBlur.current === field) {
      skipBlur.current = null;
      return;
    }
    const parsed = parseSceneEventTimeDraft(mode, raw, fps, sceneDurationFrames);
    const otherFrame = field === "start" ? endFrame : startFrame;
    const validRange = parsed.ok && (field === "start" ? parsed.frame < otherFrame : parsed.frame > otherFrame);
    const error = !parsed.ok ? parsed.error : !validRange ? "زمان پایان باید پس از زمان شروع باشد و مدت دست‌کم یک فریم بماند." : undefined;
    setErrors((current) => ({ ...current, [field]: error }));
    if (!parsed.ok || !validRange) return;
    if (field === "start") {
      setStartDraft(parsed.normalized);
      onCommit(parsed.frame, otherFrame - parsed.frame);
    } else {
      setEndDraft(parsed.normalized);
      onCommit(otherFrame, parsed.frame - otherFrame);
    }
  };

  const changeMode = (nextMode: SceneEventTimeMode) => {
    const start = startDraft === null
      ? { ok: true as const, frame: startFrame }
      : parseSceneEventTimeDraft(mode, startDraft, fps, sceneDurationFrames);
    const end = endDraft === null
      ? { ok: true as const, frame: endFrame }
      : parseSceneEventTimeDraft(mode, endDraft, fps, sceneDurationFrames);
    if (!start.ok) {
      setErrors({ start: start.error });
      return;
    }
    if (!end.ok) {
      setErrors({ end: end.error });
      return;
    }
    if (start.frame >= end.frame) {
      setErrors({ start: "زمان شروع باید پیش از پایان باشد.", end: "زمان پایان باید پس از شروع باشد." });
      return;
    }
    onCommit(start.frame, end.frame - start.frame);
    setStartDraft(null);
    setEndDraft(null);
    setErrors({});
    setMode(nextMode);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, field: "start" | "end") => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      skipBlur.current = field;
      if (field === "start") setStartDraft(null);
      else setEndDraft(null);
      setErrors((current) => ({ ...current, [field]: undefined }));
      event.currentTarget.blur();
    }
  };

  const startId = `${idPrefix}-start`;
  const endId = `${idPrefix}-end`;
  return <div className="grid min-w-0 gap-2">
    <label className="grid min-w-0 gap-1 text-[11px]" htmlFor={`${idPrefix}-mode`}>
      <span>قالب نمایش زمان</span>
      <select id={`${idPrefix}-mode`} className={inputClass} value={mode} onChange={(event) => changeMode(event.target.value as SceneEventTimeMode)} title="قالب ورود زمان این رویداد را بین ثانیه و ساعت:دقیقه:ثانیه:فریم عوض می‌کند؛ مقدار فریمی حفظ می‌شود.">
        <option value="timecode">تایم‌کد · HH:MM:SS:FF</option>
        <option value="seconds">ثانیه</option>
      </select>
    </label>
    <div className="grid min-w-0 grid-cols-2 gap-2">
      <label className="grid min-w-0 gap-1 text-[11px]" htmlFor={startId}>
        <span>شروع · {mode === "timecode" ? "تایم‌کد" : "ثانیه"}</span>
        <input id={startId} className={inputClass} dir="ltr" type="text" inputMode={mode === "timecode" ? "text" : "decimal"} autoComplete="off" spellCheck={false} value={startValue} aria-invalid={Boolean(errors.start)} aria-describedby={errors.start ? `${startId}-error` : undefined}
          onFocus={() => setStartDraft(startValue)} onChange={(event) => { setStartDraft(event.target.value); setErrors((current) => ({ ...current, start: undefined })); }} onBlur={(event) => validate("start", event.currentTarget.value)} onKeyDown={(event) => handleKeyDown(event, "start")}
          title="نقطهٔ شروع رویداد را در سکانس جاری تعیین می‌کند؛ در حالت تایم‌کد، FF شمارهٔ فریم درون ثانیه است." />
        {errors.start && <span id={`${startId}-error`} role="alert" className="text-[10px] leading-4 text-amber-200">{errors.start}</span>}
      </label>
      <label className="grid min-w-0 gap-1 text-[11px]" htmlFor={endId}>
        <span>پایان · {mode === "timecode" ? "تایم‌کد" : "ثانیه"}</span>
        <input id={endId} className={inputClass} dir="ltr" type="text" inputMode={mode === "timecode" ? "text" : "decimal"} autoComplete="off" spellCheck={false} value={endValue} aria-invalid={Boolean(errors.end)} aria-describedby={errors.end ? `${endId}-error` : undefined}
          onFocus={() => setEndDraft(endValue)} onChange={(event) => { setEndDraft(event.target.value); setErrors((current) => ({ ...current, end: undefined })); }} onBlur={(event) => validate("end", event.currentTarget.value)} onKeyDown={(event) => handleKeyDown(event, "end")}
          title="نقطهٔ پایان انحصاری رویداد را تعیین می‌کند؛ این زمان باید از شروع جلوتر و در محدودهٔ سکانس باشد." />
        {errors.end && <span id={`${endId}-error`} role="alert" className="text-[10px] leading-4 text-amber-200">{errors.end}</span>}
      </label>
    </div>
    <p className="text-[10px] leading-5 text-muted" dir="rtl">
      مدت محاسبه‌شده: {formatStartSeconds(durationFrames, fps)} ثانیه · {durationFrames} فریم
      {mode === "timecode" && <span className="block" dir="ltr">FF: 00–{String(fps - 1).padStart(2, "0")} · پایان انحصاری</span>}
      {mode === "seconds" && <span className="block">ثانیه هنگام ثبت به نزدیک‌ترین فریم نرخ {fps} FPS گرد می‌شود.</span>}
    </p>
  </div>;
}
