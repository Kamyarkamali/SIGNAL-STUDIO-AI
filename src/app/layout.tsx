import type { Metadata } from "next";
import { yekanBakh } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Studio AI | استودیوی ساخت انیمیشن",
  description: "فضای کار محلی برای ساخت انیمیشن سه‌بعدی، به زبان فارسی",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={yekanBakh.variable}>
      <body className="min-h-screen bg-background font-sans text-[15px] leading-[1.7] text-foreground">{children}</body>
    </html>
  );
}
