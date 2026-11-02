import { helpItem, navigationItems, type SectionId } from "@/config/navigation";

const titles: Record<SectionId, string> = {
  animations: "حرکت‌ها",
  projects: "پروژه‌ها",
  scenes: "سکانس‌ها",
  characters: "شخصیت‌ها",
  environments: "محیط‌ها",
  audio: "صدا",
  dialogue: "دیالوگ‌ها",
  behaviors: "رفتارها",
  camera: "دوربین",
  settings: "تنظیمات",
  export: "خروجی",
  help: "راهنما",
};

function EmptyMark({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="absolute top-px right-0 grid h-[38px] w-[38px] place-items-center rounded-[10px] border border-[#28736a] bg-[#1d4846] font-[Arial,sans-serif] text-[22px] text-[#5ee0ce]"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function SectionBody({ section }: { section: SectionId }) {
  switch (section) {
    case "animations":
      return (
        <>
          <EmptyMark>✦</EmptyMark>
          <h2>حرکت‌های زمان‌بندی‌شدهٔ سکانس</h2>
          <p>
            حرکت‌های پشتیبانی‌شده را از بخش «حرکت‌ها» به فریم دلخواه اضافه کنید؛
            playhead نتیجه را در نمای سه‌بعدی ارزیابی می‌کند.
          </p>
          <div className="content-footnote">
            این رویدادها به سکانس انتخاب‌شده تعلق دارند. صوت، لب‌خوانی و
            حرکت‌های پشتیبانی‌نشده در دسترس نیستند.
          </div>
        </>
      );
    case "projects":
      return (
        <>
          <EmptyMark>▣</EmptyMark>
          <h2>هنوز پروژه‌ای ندارید</h2>
          <p>
            در فاز ۰۲ می‌توانید پروژه بسازید، آن را ذخیره کنید و دوباره باز
            کنید.
          </p>
          <div className="content-footnote">
            هر پروژه، سکانس‌ها و دارایی‌های خودش را نگه خواهد داشت.
          </div>
        </>
      );
    case "scenes":
      return (
        <>
          <EmptyMark>▤</EmptyMark>
          <h2>مدیریت سکانس‌های پروژه</h2>
          <p>
            سکانس‌های پروژه از پنل مدیریت سکانس‌ها و استوری‌بورد پایین صفحه
            ساخته، انتخاب و مرتب می‌شوند.
          </p>
          <div className="content-footnote">
            برای ویرایش چیدمان و دوربین سکانس انتخاب‌شده، زبانهٔ ویژگی‌ها را باز
            کنید.
          </div>
        </>
      );
    case "characters":
      return (
        <>
          <EmptyMark>◉</EmptyMark>
          <h2>کتابخانهٔ شخصیت‌ها خالی است</h2>
          <p>
            در فاز ۰۴ می‌توانید شخصیت‌های قابل استفاده را بسازید و سپس جداگانه
            به سکانس اضافه کنید.
          </p>
          <div className="content-footnote">
            ساخت شخصیت در کتابخانه، به‌تنهایی آن را در صحنه نشان نمی‌دهد.
          </div>
        </>
      );
    case "environments":
      return (
        <>
          <EmptyMark>◇</EmptyMark>
          <h2>محیط سه‌بعدی هنوز آماده نیست</h2>
          <p>
            استودیوی پادکست، پس از ساخت نمای سه‌بعدی واقعی در فاز ۰۳ در دسترس
            قرار می‌گیرد.
          </p>
          <div className="content-footnote">
            تا آن زمان، هیچ محیطی به‌عنوان گزینهٔ قابل انتخاب نمایش داده
            نمی‌شود.
          </div>
        </>
      );
    case "audio":
      return (
        <>
          <EmptyMark>♫</EmptyMark>
          <h2>فایل صوتی‌ای بارگذاری نشده است</h2>
          <p>
            بارگذاری، شنیدن و مدیریت فایل‌های صوتی در فاز ۰۶ پیاده‌سازی می‌شود.
          </p>
          <div className="content-footnote">
            نمونهٔ صوتی به‌صورت خودکار به پروژه اضافه نخواهد شد.
          </div>
        </>
      );
    case "dialogue":
      return (
        <>
          <EmptyMark>❝</EmptyMark>
          <h2>هنوز گفت‌وگویی ثبت نشده است</h2>
          <p>
            در فاز ۰۶ می‌توانید بازه‌های گفتار را روی فایل صوتی مشخص و گویندهٔ
            هر بازه را تعیین کنید.
          </p>
          <div className="content-footnote">
            گوینده از صدای بلندتر یا نام فایل حدس زده نمی‌شود.
          </div>
        </>
      );
    case "behaviors":
      return (
        <>
          <EmptyMark>✦</EmptyMark>
          <h2>رفتاری برای تنظیم وجود ندارد</h2>
          <p>
            واکنش‌های چهره، نگاه و حرکت، پس از آماده شدن شخصیت‌ها و تایم‌لاین در
            فاز ۰۸ اضافه می‌شوند.
          </p>
          <div className="content-footnote">
            فقط رفتارهایی ارائه می‌شوند که مدل شخصیت واقعاً پشتیبانی کند.
          </div>
        </>
      );
    case "camera":
      return (
        <>
          <EmptyMark>◫</EmptyMark>
          <h2>تنظیم دوربین هنوز فعال نیست</h2>
          <p>نماها و تغییر زاویهٔ دوربین در فاز ۰۹ ساخته می‌شوند.</p>
          <div className="content-footnote">
            نمای ویرایش و دوربین خروجی، نقش‌های جداگانه خواهند داشت.
          </div>
        </>
      );
    case "settings":
      return (
        <>
          <EmptyMark>⚙</EmptyMark>
          <h2>تنظیم قابل تغییری وجود ندارد</h2>
          <p>
            تنظیمات زمانی نمایش داده می‌شوند که اثر واقعی داشته باشند و بتوان
            آن‌ها را نگه داشت.
          </p>
          <div className="content-footnote">
            گزینه‌های نمایشی و بدون اثر به این بخش اضافه نمی‌شوند.
          </div>
        </>
      );
    case "export":
      return (
        <>
          <EmptyMark>↗</EmptyMark>
          <h2>خروجی ویدیو هنوز در دسترس نیست</h2>
          <p>
            رندر فریم‌به‌فریم و ذخیرهٔ ویدیو در فاز ۱۱، پس از آماده شدن صحنه و
            صدا، پیاده‌سازی می‌شود.
          </p>
          <div className="content-footnote">
            در این مرحله هیچ فایل خروجی تولید نمی‌شود.
          </div>
        </>
      );
    case "help":
      return (
        <>
          <EmptyMark>؟</EmptyMark>
          <h2>از اینجا شروع کنید</h2>
          <p>
            بخش‌های سمت راست، مسیر ساخت یک انیمیشن را نشان می‌دهند. اکنون فقط
            پوستهٔ برنامه آماده است.
          </p>
          <ol className="help-list">
            <li>بخش موردنظر را از فهرست انتخاب کنید.</li>
            <li>توضیح هر بخش و زمان آماده شدن آن را بخوانید.</li>
            <li>در فازهای بعد، ابزارهای واقعی به همین فضا اضافه می‌شوند.</li>
          </ol>
        </>
      );
  }
}

export function SectionContent({ section }: { section: SectionId }) {
  const item =
    section === "help"
      ? helpItem
      : navigationItems.find((entry) => entry.id === section);
  return (
    <section
      className="section-background min-h-[180px] rounded-xl border border-line px-[23px] py-[19px] max-[650px]:p-[15px]"
      aria-labelledby="section-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold tracking-[0.25px] text-[#55d8c7]">
            بخش انتخاب‌شده / {item?.phase}
          </span>
          <h1
            className="mt-0.5 text-[21px] leading-[1.35] font-bold max-[650px]:text-[19px]"
            id="section-title"
          >
            {titles[section]}
          </h1>
        </div>
        <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[#536276] bg-[#273447] px-[9px] py-0.5 text-xs text-[#bac8d7]">
          {section === "help" || section === "scenes"
            ? "در دسترس"
            : "هنوز فعال نیست"}
        </span>
      </div>
      <div className="relative mt-[17px] max-w-[760px] pr-[55px] max-[650px]:pr-12 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_p]:text-[13px] [&_p]:leading-[1.9] [&_p]:text-[#aab9c9] [&_.content-footnote]:mt-2 [&_.content-footnote]:text-xs [&_.content-footnote]:text-[#a9b9c8] [&_.mini-steps]:mt-[9px] [&_.mini-steps]:flex [&_.mini-steps]:flex-wrap [&_.mini-steps]:gap-2.5 [&_.mini-steps_span]:text-xs [&_.mini-steps_span]:text-accent [&_.mini-steps_b]:mr-[5px] [&_.mini-steps_b]:font-medium [&_.mini-steps_b]:text-[#aab9c9] [&_.help-list]:mt-[7px] [&_.help-list]:list-decimal [&_.help-list]:pr-[17px] [&_.help-list]:text-xs [&_.help-list]:text-[#aab9c9]">
        <SectionBody section={section} />
      </div>
    </section>
  );
}
