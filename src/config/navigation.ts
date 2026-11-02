export type SectionId =
  | "projects"
  | "scenes"
  | "characters"
  | "animations"
  | "environments"
  | "audio"
  | "dialogue"
  | "behaviors"
  | "camera"
  | "settings"
  | "export"
  | "help";

export type NavigationItem = {
  id: SectionId;
  label: string;
  shortLabel: string;
  symbol: string;
  phase: string;
};

export const navigationItems: readonly NavigationItem[] = [
  {
    id: "projects",
    label: "پروژه‌ها",
    shortLabel: "پروژه",
    symbol: "▣",
    phase: "فاز ۰۲",
  },
  {
    id: "scenes",
    label: "سکانس‌ها",
    shortLabel: "سکانس",
    symbol: "▤",
    phase: "فاز ۰۵",
  },
  {
    id: "characters",
    label: "شخصیت‌ها",
    shortLabel: "شخصیت",
    symbol: "◉",
    phase: "فاز ۰۴",
  },
  {
    id: "animations",
    label: "حرکت‌ها",
    shortLabel: "حرکت‌ها",
    symbol: "✦",
    phase: "فاز ۰۵-C",
  },
  {
    id: "environments",
    label: "محیط‌ها",
    shortLabel: "محیط",
    symbol: "◇",
    phase: "فاز ۰۳",
  },
  {
    id: "audio",
    label: "صدا",
    shortLabel: "صدا",
    symbol: "♫",
    phase: "فاز ۰۶",
  },
  {
    id: "dialogue",
    label: "دیالوگ‌ها",
    shortLabel: "دیالوگ",
    symbol: "❝",
    phase: "فاز ۰۶",
  },
  {
    id: "behaviors",
    label: "رفتارها",
    shortLabel: "رفتار",
    symbol: "✦",
    phase: "فاز ۰۸",
  },
  {
    id: "camera",
    label: "دوربین",
    shortLabel: "دوربین",
    symbol: "◫",
    phase: "فاز ۰۹",
  },
  {
    id: "settings",
    label: "تنظیمات",
    shortLabel: "تنظیمات",
    symbol: "⚙",
    phase: "فاز ۱۰",
  },
  {
    id: "export",
    label: "خروجی",
    shortLabel: "خروجی",
    symbol: "↗",
    phase: "فاز ۱۱",
  },
];

export const helpItem: NavigationItem = {
  id: "help",
  label: "راهنما",
  shortLabel: "راهنما",
  symbol: "؟",
  phase: "راهنما",
};
