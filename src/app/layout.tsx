import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Insight - 个人加密资产面板",
  description: "管理和追踪你的链上与交易所加密资产",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex">
        <Providers>
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="mx-auto max-w-6xl p-4 md:p-6">
              {children}
            </div>
          </main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
