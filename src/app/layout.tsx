import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Thực tập Doanh nghiệp | Khoa CNTT - HUIT",
  description: "Cổng thông tin quản lý thực tập tốt nghiệp và thực tập doanh nghiệp - Trường Đại học Công Thương TP.HCM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-full w-full overflow-hidden text-gray-800 antialiased flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
