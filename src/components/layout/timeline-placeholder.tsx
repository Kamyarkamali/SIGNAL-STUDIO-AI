export function TimelinePlaceholder() {
  return (
    <section
      className="overflow-hidden rounded-xl border border-line bg-surface"
      aria-labelledby="timeline-title"
    >
      <div className="flex h-[43px] items-center justify-between gap-3 border-b border-line px-4 text-[13px] font-bold">
        <div className="flex items-center gap-2.5">
          <span className="h-[15px] w-[3px] rounded-[3px] bg-accent" />
          <span id="timeline-title">تایم‌لاین</span>
          <span className="mr-1 inline-flex items-center whitespace-nowrap rounded-full border border-[#536276] bg-[#273447] px-[9px] py-0.5 text-xs font-normal text-[#bac8d7]">
            در فازهای بعد
          </span>
        </div>
        <span className="text-xs font-normal text-[#a8b8c8]">
          هنوز سکانسی وجود ندارد
        </span>
      </div>
      <div className="grid min-h-[69px] grid-cols-[170px_minmax(0,1fr)] max-[650px]:grid-cols-[105px_minmax(0,1fr)]">
        <div className="flex flex-col justify-center border-l border-line px-4 py-2 max-[650px]:px-2">
          <span className="text-xs text-[#d0dbe6]">مسیرها</span>
          <small className="text-[11px] text-[#a4b4c5] max-[650px]:hidden">
            پس از ساخت سکانس نمایش داده می‌شوند
          </small>
        </div>
        <div
          className="timeline-ruler-background flex items-start justify-between px-4 pt-[9px] font-[Arial,sans-serif] text-xs text-[#aab9c9] max-[650px]:px-2 max-[650px]:[&_span:nth-child(even)]:hidden"
          dir="ltr"
          aria-label="محور زمان، از چپ به راست"
        >
          <span>00:00</span>
          <span>00:10</span>
          <span>00:20</span>
          <span>00:30</span>
          <span>00:40</span>
        </div>
      </div>
      <p className="border-t border-line px-4 py-1 text-[11px] text-[#aebdce]">
        ابزارهای زمان‌بندی و ویرایش مسیرها در فازهای بعدی فعال می‌شوند.
      </p>
    </section>
  );
}
