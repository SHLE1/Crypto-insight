import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/components/providers'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: './fonts/geist-sans.woff2',
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = localFont({
  src: './fonts/geist-mono.woff2',
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://crypto-insight.local'),
  title: {
    default: 'Crypto Insight',
    template: '%s · Crypto Insight',
  },
  description: '本地优先的个人加密资产面板，基于 Shadcn UI 重构。',
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
      className={cn(geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased font-sans tabular-nums min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 p-4 md:p-6">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
