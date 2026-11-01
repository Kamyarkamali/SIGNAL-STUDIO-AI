export function ViewportPlaceholder() {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="viewport-title">
      <div className="flex h-[43px] items-center justify-between gap-3 border-b border-line px-4 text-[13px] font-bold">
        <div className="flex items-center gap-2.5">
          <span className="h-[15px] w-[3px] rounded-[3px] bg-accent" />
          <span id="viewport-title">نمای صحنه</span>
        </div>
        <span className="text-xs font-normal text-[#a8b8c8]">قاب پیش‌نمایش · ۱۶:۹</span>
      </div>
      <div className="viewport-background relative isolate grid aspect-video w-full min-h-0 place-items-center overflow-hidden">
        <div className="viewport-grid absolute inset-0 opacity-15" aria-hidden="true" />
        <div className="relative max-w-[380px] px-6 py-[18px] text-center max-[500px]:px-3 max-[500px]:py-2">
          <div className="mx-auto mb-[13px] grid h-[67px] w-[67px] place-items-center rounded-[17px] border border-[#477b7e] bg-[#1a343f] font-[Arial,sans-serif] text-[35px] text-[#6de5d9] shadow-[0_0_0_9px_#294e581c,0_15px_40px_#0005] max-[500px]:mb-[5px] max-[500px]:h-[42px] max-[500px]:w-[42px] max-[500px]:text-[25px]" aria-hidden="true">
            <span>◇</span>
          </div>
          <span className="text-xs font-extrabold tracking-[0.25px] text-[#55d8c7]">فضای پیش‌نمایش</span>
          <h2 className="mt-[3px] mb-1.5 text-[17px] font-bold max-[500px]:mt-px max-[500px]:mb-0 max-[500px]:text-sm">صحنه‌ای برای نمایش وجود ندارد</h2>
          <p className="text-[13px] leading-8 text-[#afbfce] max-[500px]:hidden">
            نمای سه‌بعدی و محیط واقعی در فاز ۰۳ ساخته می‌شود. این قاب اکنون فقط
            جای پیش‌نمایش را نشان می‌دهد.
          </p>
        </div>
        <span
          className="absolute top-[18px] left-5 font-mono text-lg text-[#50808a] max-[500px]:top-2 max-[500px]:left-2.5"
          aria-hidden="true"
        >
          +
        </span>
        <span
          className="absolute right-5 bottom-[18px] font-mono text-lg text-[#50808a] max-[500px]:right-2.5 max-[500px]:bottom-2"
          aria-hidden="true"
        >
          +
        </span>
      </div>
      <p className="hidden px-3.5 pt-2 text-xs text-[#afbfce] max-[500px]:block">
        نمای سه‌بعدی در فاز ۰۳ ساخته می‌شود؛ این قاب فعلاً فقط جای پیش‌نمایش است.
      </p>
      <div className="flex justify-between px-[15px] py-[7px] text-xs text-[#a8b8c8]">
        <span>پیش‌نمایش غیرفعال</span>
        <span dir="ltr">16:9</span>
      </div>
    </section>
  );
}
