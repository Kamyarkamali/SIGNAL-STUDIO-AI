import { helpItem, navigationItems, type SectionId } from "@/config/navigation";

type MainNavigationProps = {
  activeSection: SectionId;
  onSelect: (section: SectionId) => void;
};

export function MainNavigation({ activeSection, onSelect }: MainNavigationProps) {
  const itemClass = (active: boolean) =>
    `flex min-h-[42px] w-full cursor-pointer items-center gap-3 rounded-lg border px-[13px] py-2 text-right transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#65e6d7] max-[850px]:w-auto max-[850px]:flex-none max-[850px]:px-2.5 max-[850px]:py-1.5 ${active ? "border-[#21635b] bg-[#153535] text-[#e4fffa]" : "border-transparent bg-transparent text-[#aebbd0] hover:bg-[#1a2634] hover:text-white"}`;
  const symbolClass = (active: boolean) => `w-5 flex-none text-center font-[Arial,sans-serif] text-lg leading-none ${active ? "text-accent" : "text-[#8ea4bb]"}`;
  const chevronClass = (active: boolean) => `text-xl leading-none text-accent max-[850px]:hidden ${active ? "opacity-100" : "opacity-0"}`;
  return (
    <nav className="flex min-h-[calc(100vh-72px)] flex-col border-l border-line bg-[#101722] px-3 pt-[23px] pb-[15px] max-[850px]:min-h-0 max-[850px]:border-l-0 max-[850px]:border-b max-[850px]:px-3 max-[850px]:py-2.5" aria-label="بخش‌های استودیو">
      <div className="px-[15px] pb-[15px] text-xs font-bold tracking-[0.5px] text-[#9aacc0] max-[850px]:hidden">فضای کار</div>
      <div className="flex flex-col gap-0.5 max-[850px]:flex-row max-[850px]:overflow-x-auto max-[850px]:pb-[3px]">
        {navigationItems.map((item) => (
          <button
            className={itemClass(activeSection === item.id)}
            type="button"
            key={item.id}
            aria-current={activeSection === item.id ? "page" : undefined}
            onClick={() => onSelect(item.id)}
          >
            <span className={symbolClass(activeSection === item.id)} aria-hidden="true">{item.symbol}</span>
            <span className="flex-1 whitespace-nowrap text-sm font-semibold max-[850px]:text-[13px]">{item.label}</span>
            <span className={chevronClass(activeSection === item.id)} aria-hidden="true">‹</span>
          </button>
        ))}
      </div>
      <div className="mt-auto border-t border-line pt-[11px] max-[850px]:hidden">
        <button
          className={itemClass(activeSection === "help")}
          type="button"
          aria-current={activeSection === "help" ? "page" : undefined}
          onClick={() => onSelect("help")}
        >
          <span className={symbolClass(activeSection === "help")} aria-hidden="true">{helpItem.symbol}</span>
          <span className="flex-1 whitespace-nowrap text-sm font-semibold">{helpItem.label}</span>
          <span className={chevronClass(activeSection === "help")} aria-hidden="true">‹</span>
        </button>
        <div className="px-[13px] pt-[17px] text-xs text-[#9aacc0]">نسخه آغازین · فاز ۰۱</div>
      </div>
    </nav>
  );
}
