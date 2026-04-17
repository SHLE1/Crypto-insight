import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { AppSidebar, MobileNav } from '@/components/layout/app-sidebar'

export const metadata: Metadata = {
  title: 'Crypto Insight · 个人加密资产面板',
  description: '管理和追踪你的链上钱包与交易所加密资产，专注统计、结构与趋势分析。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="app-shell min-h-full">
        <Providers>
          <AppSidebar />
          <main className="app-main overflow-x-hidden overflow-y-auto">
            <div className="page-wrap">{children}</div>
          </main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  )
}
