"use client";

import { helpItem, navigationItems, type SectionId } from "@/config/navigation";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";
import { WorkspaceIcon } from "./workspace-icon";

const primarySections: SectionId[] = ["scenes", "characters", "audio", "camera", "environments", "settings"];
const utilitySections: SectionId[] = ["projects", "animations"];
const byId = new Map(navigationItems.map((item) => [item.id, item]));
const descriptions: Partial<Record<SectionId, string>> = {
  projects: "ساخت، بازکردن و ذخیرهٔ پروژه‌های محلی.",
  scenes: "ساخت و انتخاب سکانس؛ ویژگی‌های سکانس با انتخاب آن باز می‌شوند.",
  characters: "افزودن شخصیت و انتخاب نمونه برای ویرایش در صحنه.",
  audio: "واردکردن صدا به سکانس و ویرایش کلیپ و گوینده.",
  camera: "تنظیم و پیش‌نمایش دوربین تولید سکانس انتخاب‌شده.",
  environments: "انتخاب وسیله و ویرایش چیدمان محیط سه‌بعدی.",
  settings: "تنظیم چیدمان پنل‌های همین ویرایشگر.",
  animations: "افزودن و ویرایش حرکت‌های زمان‌بندی‌شدهٔ سکانس.",
  help: "بازکردن راهنمای فارسی ابزارهای ویرایشگر.",
};

export function WorkspaceNavigation({ activeSection, onSelect, collapsed, onToggleCollapsed, onHelp }: {
  activeSection: SectionId;
  onSelect: (section: SectionId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  const link = (section: SectionId) => {
    const item = section === "help" ? helpItem : byId.get(section);
    if (!item) return null;
    return <button key={section} type="button" data-section={section}
      className={`workspace-nav-link ${activeSection === section ? "is-active" : ""}`}
      aria-current={activeSection === section ? "page" : undefined}
      aria-label={item.label} title={`${item.label} — ${descriptions[section]}`}
      onClick={() => onSelect(section)}>
      <span className="workspace-nav-symbol" aria-hidden="true"><WorkspaceIcon section={section} /></span>
      <span className="workspace-nav-label">{item.shortLabel}</span>
    </button>;
  };

  return <nav className={`workspace-navigation flex min-h-0 flex-col border-l border-line bg-[#101722] px-2 py-3 ${collapsed ? "workspace-navigation-collapsed" : ""}`}
    aria-label="بخش‌های استودیو" dir="rtl">
    <div className={`workspace-navigation-heading mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
      {!collapsed && <span className="text-xs font-bold text-muted">فضای کار</span>}
      <button type="button" className="nav-collapse-button" aria-expanded={!collapsed}
        aria-label={collapsed ? "بازکردن نوار پیمایش" : "جمع‌کردن نوار پیمایش"}
        title={collapsed ? "نام بخش‌ها را در نوار پیمایش نشان می‌دهد." : "نام بخش‌ها را پنهان می‌کند تا نمای سه‌بعدی بزرگ‌تر شود."}
        onClick={onToggleCollapsed}>{collapsed ? "‹" : "›"}</button>
    </div>
    <div className="workspace-navigation-main flex flex-col gap-1" aria-label="ابزارهای اصلی">
      {primarySections.map(link)}
    </div>
    <div className="workspace-navigation-utility mt-auto flex flex-col gap-1 border-t border-line pt-2" aria-label="پروژه و ابزارهای دیگر">
      {utilitySections.map(link)}
      {link("help")}
      <span className="workspace-nav-help mt-1 self-center"><ContextHelpTrigger topic="workspace" onOpen={onHelp} label="راهنمای فضای کار" /></span>
    </div>
    <div className="workspace-navigation-mobile hidden min-w-0 items-center gap-2" data-mobile-navigation dir="rtl">
      <label htmlFor="workspace-mobile-section" className="shrink-0 text-xs font-semibold">بخش</label>
      <select id="workspace-mobile-section" value={activeSection}
        className="min-h-10 min-w-0 flex-1 rounded-md border border-line bg-[#1d2939] px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        aria-label="انتخاب بخش فضای کار" title="بخش ویرایش را عوض می‌کند؛ صحنه، انتخاب و نمای سه‌بعدی حفظ می‌شوند."
        onChange={(event) => onSelect(event.target.value as SectionId)}>
        {["projects", ...primarySections, ...utilitySections.filter((id) => id !== "projects"), "help"].map((section) => {
          const item = section === "help" ? helpItem : byId.get(section as SectionId);
          return item ? <option key={section} value={section}>{item.shortLabel}</option> : null;
        })}
      </select>
      <ContextHelpTrigger topic="workspace" onOpen={onHelp} label="انتخاب بخش فضای کار" />
    </div>
  </nav>;
}
