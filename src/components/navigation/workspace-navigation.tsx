"use client";

import { helpItem, navigationItems, type SectionId } from "@/config/navigation";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";

const plannedSections = new Set<SectionId>(["dialogue", "behaviors", "camera", "settings", "export"]);

export function WorkspaceNavigation({
  activeSection,
  onSelect,
  collapsed,
  onToggleCollapsed,
  onHelp,
}: {
  activeSection: SectionId;
  onSelect: (section: SectionId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onHelp: (topic: ContextHelpId) => void;
}) {
  return (
    <nav
      className={`workspace-navigation flex min-h-0 flex-col overflow-y-auto border-l border-line bg-[#101722] px-2 py-3 ${collapsed ? "workspace-navigation-collapsed" : ""} max-[850px]:overflow-hidden max-[850px]:border-l-0 max-[850px]:border-b max-[850px]:px-3 max-[850px]:py-2`}
      aria-label="بخش‌های استودیو"
    >
      <div
        className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between px-2"} max-[850px]:hidden`}
      >
        {!collapsed && (
          <span className="text-xs font-bold tracking-wide text-muted">
            فضای کار
          </span>
        )}
        <button
          type="button"
          className="nav-collapse-button"
          aria-label={
            collapsed ? "بازکردن نوار پیمایش" : "جمع‌کردن نوار پیمایش"
          }
          title={collapsed ? "بازکردن نوار پیمایش" : "جمع‌کردن نوار پیمایش"}
          aria-expanded={!collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? "‹" : "›"}
        </button>
      </div>
      <div className="flex flex-col gap-1 max-[1023px]:hidden">
        {navigationItems.map((item) => (
          <div
            className="flex min-w-0 items-center gap-0.5 max-[850px]:flex-none"
            key={item.id}
          >
            <button
              type="button"
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={activeSection === item.id ? "page" : undefined}
              className={`workspace-nav-link ${activeSection === item.id ? "is-active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="workspace-nav-symbol" aria-hidden="true">
                {item.symbol}
              </span>
              <span className="workspace-nav-label">{item.shortLabel}</span>
              {plannedSections.has(item.id) && <span className="nav-planned-badge">آینده</span>}
            </button>
            <span className="workspace-nav-help max-[850px]:hidden">
              <ContextHelpTrigger
                topic={item.id === "animations" ? "timelineActions" : item.id as ContextHelpId}
                onOpen={onHelp}
                label={item.shortLabel}
              />
            </span>
          </div>
        ))}
      </div>
      <div className="hidden min-w-0 items-center gap-2 max-[1023px]:flex" data-mobile-navigation dir="rtl">
        <label htmlFor="workspace-mobile-section" className="shrink-0 text-xs font-semibold text-foreground">بخش</label>
        <select
          id="workspace-mobile-section"
          className="min-h-10 min-w-0 flex-1 rounded-md border border-line bg-[#1d2939] px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="انتخاب بخش فضای کار"
          title="بخش کاری ویرایشگر را تغییر می‌دهد. بخش‌های آینده هنوز ابزار اجرایی ندارند."
          value={activeSection}
          onChange={(event) => onSelect(event.target.value as SectionId)}
        >
          {navigationItems.map((item) => <option key={item.id} value={item.id}>{item.shortLabel}{plannedSections.has(item.id) ? " · آینده" : ""}</option>)}
          <option value="help">{helpItem.shortLabel}</option>
        </select>
        <ContextHelpTrigger topic="workspace" onOpen={onHelp} label="انتخاب بخش فضای کار" />
      </div>
      <div className="mt-auto border-t border-line pt-2 max-[850px]:hidden">
        <button
          type="button"
          className={`workspace-nav-link ${activeSection === "help" ? "is-active" : ""}`}
          title={collapsed ? helpItem.label : undefined}
          onClick={() => onSelect("help")}
        >
          <span className="workspace-nav-symbol" aria-hidden="true">
            {helpItem.symbol}
          </span>
          <span className="workspace-nav-label">{helpItem.shortLabel}</span>
        </button>
        <div className="mt-1 flex items-center justify-between px-1">
          <ContextHelpTrigger
            topic="workspace"
            onOpen={onHelp}
            label="راهنمای فضای کار"
          />
          {!collapsed && (
            <span className="text-[10px] text-muted">نسخهٔ MVP</span>
          )}
        </div>
      </div>
    </nav>
  );
}
