import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UTS - 다이빙 예약 플랫폼",
  description: "프리다이빙/스쿠버다이빙 강습 예약",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
