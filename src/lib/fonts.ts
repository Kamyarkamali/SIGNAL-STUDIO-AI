import localFont from "next/font/local";

export const yekanBakh = localFont({
  src: [
    { path: "../public/fonts/woff2/YekanBakhFaNum-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/woff2/YekanBakhFaNum-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/woff2/YekanBakhFaNum-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/woff2/YekanBakhFaNum-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-yekan-bakh",
  display: "swap",
  preload: true,
  fallback: ["Tahoma", "Arial", "sans-serif"],
});
