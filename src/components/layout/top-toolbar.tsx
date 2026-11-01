type TopToolbarProps = { onHelp: () => void; projectTitle?: string };

export function TopToolbar({ onHelp, projectTitle }: TopToolbarProps) {
  return (
    <header className="flex h-[72px] items-center justify-between gap-4 border-b border-line bg-[#101722ed] px-7 max-[650px]:h-16 max-[650px]:px-3.5">
      <div className="flex items-center gap-[18px] max-[650px]:gap-2.5">
        <div className="grid h-[37px] w-[37px] rotate-[-13deg] place-items-center rounded-[11px] border border-[#6af4df] shadow-[0_0_20px_#36d7c326]" aria-hidden="true"><span className="h-[15px] w-[15px] rounded border-[3px] border-accent" /></div>
        <div className="flex flex-col leading-[1.25]">
          <strong className="whitespace-nowrap font-[Arial,sans-serif] text-sm font-extrabold tracking-[1.3px] max-[650px]:text-xs" lang="en" dir="ltr">SIGNAL <span className="text-accent">STUDIO</span> AI</strong>
          <small className="mt-[5px] text-xs text-muted max-[650px]:hidden">استودیوی ساخت انیمیشن</small>
        </div>
        <span className="mx-1 h-[34px] w-px bg-line max-[650px]:hidden" aria-hidden="true" />
        <div className="flex flex-col leading-[1.35] max-[650px]:hidden">
          <span className="text-xs text-muted">فضای کار</span>
          <strong className="max-w-48 truncate text-[13px] font-semibold" title={projectTitle}>{projectTitle || "پروژه‌ای باز نیست"}</strong>
        </div>
      </div>
      <div className="flex items-center gap-[18px]">
        <span className="flex items-center gap-2 whitespace-nowrap text-xs text-[#b6c6d5] max-[650px]:hidden"><i className="h-[7px] w-[7px] rounded-full bg-accent shadow-[0_0_9px_#40d7c5a0]" aria-hidden="true" /> اجرای محلی</span>
        <button className="flex min-h-[38px] cursor-pointer items-center gap-2.5 rounded-lg border border-[#354355] bg-[#1d2939] px-3.5 py-[7px] text-foreground hover:bg-[#28394b] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#65e6d7] max-[650px]:px-2.5 max-[650px]:py-1.5" type="button" onClick={onHelp}>راهنما <span className="text-accent" aria-hidden="true">↗</span></button>
      </div>
    </header>
  );
}
