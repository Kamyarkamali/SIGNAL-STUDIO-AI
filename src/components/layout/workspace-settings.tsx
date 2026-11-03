"use client";

import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";

export function WorkspaceSettings({ inspectorWidth, timelineHeight, onInspectorWidth, onTimelineHeight, onReset, onHelp }: {
  inspectorWidth: number;
  timelineHeight: number;
  onInspectorWidth: (value: number) => void;
  onTimelineHeight: (value: number) => void;
  onReset: () => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  return <section className="grid content-start gap-4 p-3" aria-label="تنظیمات چیدمان">
    <header className="flex items-center gap-2"><h2 className="text-sm font-bold">چیدمان فضای کار</h2><ContextHelpTrigger topic="settings" onOpen={onHelp} /></header>
    <p className="text-xs leading-6 text-muted">اندازهٔ پنل‌ها را برای این نشست تغییر دهید. محتوای پروژه و نمای سه‌بعدی تغییر نمی‌کند.</p>
    <label className="grid gap-2 text-xs" title="عرض پنل ابزار و ویژگی‌ها را در نمای دسکتاپ تغییر می‌دهد.">عرض پنل ویرایش · {inspectorWidth} پیکسل
      <input type="range" min={250} max={440} step={10} value={inspectorWidth} onChange={(event) => onInspectorWidth(Number(event.target.value))} aria-label="عرض پنل ویرایش" />
    </label>
    <label className="grid gap-2 text-xs" title="ارتفاع تایم‌لاین پروژه را در نمای دسکتاپ تغییر می‌دهد.">ارتفاع تایم‌لاین · {timelineHeight} پیکسل
      <input type="range" min={190} max={360} step={10} value={timelineHeight} onChange={(event) => onTimelineHeight(Number(event.target.value))} aria-label="ارتفاع تایم‌لاین" />
    </label>
    <button type="button" className="min-h-10 rounded-md border border-line bg-[#1d2939] px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-accent"
      title="عرض پنل، ارتفاع تایم‌لاین و بازبودن آن‌ها را به حالت آغازین برمی‌گرداند؛ دادهٔ پروژه تغییر نمی‌کند."
      onClick={onReset}>بازنشانی چیدمان</button>
  </section>;
}
