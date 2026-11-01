import type { SectionId } from "@/config/navigation";

const guidance: Record<SectionId, string> = {
  projects: "پس از ایجاد پروژه، جزئیات آن در این بخش دیده می‌شود.",
  scenes: "با انتخاب سکانس، ویژگی‌های همان سکانس اینجا نمایش داده می‌شود.",
  characters: "ویژگی‌های شخصیت انتخاب‌شده، پس از افزودن شخصیت در اینجا قرار می‌گیرد.",
  environments: "ویژگی‌های محیط انتخاب‌شده، پس از آماده شدن نمای سه‌بعدی اینجا دیده می‌شود.",
  audio: "جزئیات فایل صوتی انتخاب‌شده، بعد از بارگذاری صدا نمایش داده می‌شود.",
  dialogue: "زمان و گویندهٔ بازهٔ انتخاب‌شده، در این پنل ویرایش خواهد شد.",
  behaviors: "تنظیمات رفتار انتخاب‌شده، پس از ساخت ابزار رفتار اینجا ظاهر می‌شود.",
  camera: "تنظیمات نمای دوربین انتخاب‌شده، در این بخش قرار می‌گیرد.",
  settings: "تنظیمات واقعی برنامه، پس از پیاده‌سازی در اینجا نمایش داده می‌شود.",
  export: "جزئیات خروجی و وضعیت رندر، پس از آماده شدن ابزار خروجی اینجا می‌آید.",
  help: "برای شروع، از فهرست سمت راست یکی از بخش‌های استودیو را انتخاب کنید.",
};

export function PropertiesPanel({ section, projectTitle }: { section: SectionId; projectTitle?: string }) {
  return (
    <aside className="flex min-h-full flex-col overflow-hidden rounded-xl border border-line bg-surface max-[650px]:min-h-[170px]" aria-labelledby="properties-title">
      <div className="flex h-[43px] items-center justify-between gap-3 border-b border-line px-4 text-[13px] font-bold"><div className="flex items-center gap-2.5"><span className="h-[15px] w-[3px] rounded-[3px] bg-accent" /><span id="properties-title">ویژگی‌ها</span></div></div>
      <div className="flex flex-1 flex-col items-center justify-center px-[18px] py-[26px] text-center max-[650px]:p-[15px]">
        <div className="grid h-[45px] w-[45px] place-items-center rounded-xl border border-[#3a4e61] text-[21px] text-[#8eabc1]" aria-hidden="true">☷</div>
        <h2 className="mt-[15px] mb-[5px] text-sm font-bold">{section === "projects" && projectTitle ? projectTitle : "چیزی انتخاب نشده است"}</h2>
        <p className="text-xs leading-8 text-muted">{section === "projects" && projectTitle ? "این پروژه باز است. نام و مدیریت آن در بخش پروژه‌ها قرار دارد." : guidance[section]}</p>
      </div>
      <div className="m-3 flex items-start gap-[7px] rounded-lg border border-[#2a4054] bg-[#192739] p-2.5 text-xs leading-[1.8] text-[#afc2d0]"><span className="text-accent" aria-hidden="true">ⓘ</span> این پنل با انتخاب عناصر مرتبط به‌روز می‌شود.</div>
    </aside>
  );
}
