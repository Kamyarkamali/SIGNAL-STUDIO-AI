import { formatTimecode } from "./scene-time.ts";

export type EventTimingField = "start-seconds" | "duration-frames";
export type SceneEventTimeMode = "timecode" | "seconds";

export type EventTimingDraftResult =
  | { ok: true; frame: number; normalized: string }
  | { ok: false; error: string };

export function formatSceneEventTime(frame: number, fps: number, mode: SceneEventTimeMode): string {
  return mode === "timecode" ? formatTimecode(frame, fps) : formatStartSeconds(frame, fps);
}

export function parseSceneEventTimeDraft(
  mode: SceneEventTimeMode,
  rawValue: string,
  fps: number,
  maxFrame: number,
): EventTimingDraftResult {
  if (mode === "seconds") return commitEventTimingDraft("start-seconds", rawValue, fps, maxFrame);
  const raw = rawValue.trim();
  const match = /^(\d{2,}):(\d{2}):(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return { ok: false, error: "زمان را به‌شکل ساعت:دقیقه:ثانیه:فریم، مانند ۰۰:۰۰:۰۲:۰۰، وارد کنید." };
  if (!Number.isInteger(fps) || fps < 1 || fps > 99) return { ok: false, error: "نرخ فریم پروژه برای این قالب زمانی معتبر نیست." };
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const frames = Number(match[4]);
  if (minutes > 59 || seconds > 59 || frames >= fps) {
    return { ok: false, error: `دقیقه و ثانیه باید کمتر از ۶۰ و فریم باید کمتر از ${fps} باشد.` };
  }
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const frame = totalSeconds * fps + frames;
  if (!Number.isSafeInteger(frame)) return { ok: false, error: "زمان واردشده از محدودهٔ پشتیبانی‌شده بیشتر است." };
  if (!Number.isSafeInteger(maxFrame) || maxFrame < 0 || frame > maxFrame) {
    return { ok: false, error: "زمان از پایان مجاز سکانس عبور می‌کند." };
  }
  return { ok: true, frame, normalized: formatTimecode(frame, fps) };
}

/** Three decimal places preserve individual frames at all supported project frame rates. */
export function formatStartSeconds(frame: number, fps: number): string {
  if (!Number.isSafeInteger(frame) || frame < 0 || !Number.isFinite(fps) || fps <= 0) return "0";
  return (frame / fps).toFixed(3).replace(/\.?0+$/, "");
}

export function formatDurationFrames(frame: number): string {
  return Number.isSafeInteger(frame) && frame > 0 ? String(frame) : "1";
}

export function commitEventTimingDraft(
  field: EventTimingField,
  rawValue: string,
  fps: number,
  maxFrame: number,
): EventTimingDraftResult {
  const raw = rawValue.trim();
  if (!raw) return { ok: false, error: "این مقدار خالی است؛ عددی در محدودهٔ مجاز وارد کنید." };

  let frame: number;
  if (field === "start-seconds") {
    if (!/^\d+(?:\.\d*)?$/.test(raw) && !/^\.\d+$/.test(raw)) {
      return { ok: false, error: "زمان را به‌صورت ثانیه، مانند ۲ یا ۲٫۵، وارد کنید." };
    }
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(fps) || fps <= 0) {
      return { ok: false, error: "زمان شروع باید عددی معتبر و نامنفی باشد." };
    }
    frame = Math.round(seconds * fps);
  } else {
    if (!/^\d+$/.test(raw)) return { ok: false, error: "مدت را با تعداد صحیح فریم وارد کنید." };
    frame = Number(raw);
    if (!Number.isSafeInteger(frame) || frame < 1) return { ok: false, error: "مدت رویداد باید دست‌کم ۱ فریم باشد." };
  }

  if (!Number.isSafeInteger(frame)) return { ok: false, error: "مقدار واردشده از محدودهٔ زمانی پشتیبانی‌شده بیشتر است." };
  if (!Number.isSafeInteger(maxFrame) || maxFrame < 0 || frame > maxFrame) {
    return { ok: false, error: field === "start-seconds"
      ? "زمان شروع از مرز مجاز این سکانس عبور می‌کند."
      : "مدت انتخاب‌شده از پایان سکانس عبور می‌کند." };
  }

  return { ok: true, frame, normalized: field === "start-seconds" ? formatStartSeconds(frame, fps) : formatDurationFrames(frame) };
}
