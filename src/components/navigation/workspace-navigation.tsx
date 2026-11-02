"use client";

import { helpItem, navigationItems, type SectionId } from "@/config/navigation";
import { ContextHelpTrigger } from "@/components/help/context-help";
import type { ContextHelpId } from "@/lib/help/context-help-content";

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
      <div className="flex flex-col gap-1 max-[850px]:flex-row max-[850px]:overflow-x-auto max-[850px]:pb-1">
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
              {["audio", "dialogue", "behaviors", "camera", "settings", "export"].includes(item.id) && <span className="nav-planned-badge">آینده</span>}
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
