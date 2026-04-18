import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/components/providers'
import { AppSidebar, MobileNav } from '@/components/layout/app-sidebar'

const geistSans = localFont({
  src: './fonts/geist-sans.woff2',
  variable: '--app-font-sans',
  display: 'swap',
})

const geistMono = localFont({
  src: './fonts/geist-mono.woff2',
  variable: '--app-font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://crypto-insight.local'),
  title: {
    default: 'Crypto Insight',
    template: '%s · Crypto Insight',
  },
  description: '本地优先的个人加密资产面板，用更清晰的方式管理钱包、交易所与 DeFi 仓位。',
  applicationName: 'Crypto Insight',
  openGraph: {
    title: 'Crypto Insight',
    description: '本地优先的个人加密资产面板，用更清晰的方式管理钱包、交易所与 DeFi 仓位。',
    siteName: 'Crypto Insight',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Insight',
    description: '本地优先的个人加密资产面板，用更清晰的方式管理钱包、交易所与 DeFi 仓位。',
  },
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
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="dashboard-shell">
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        <Providers>
          <AppSidebar />
          <main id="main-content" className="dashboard-main">
            <div className="dashboard-container">{children}</div>
          </main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  )
}
