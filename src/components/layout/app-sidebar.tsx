'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Coins, LayoutDashboard, ListTree, Settings, Wallet } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '总览', icon: LayoutDashboard },
  { href: '/holdings', label: '资产明细', icon: ListTree },
  { href: '/wallets', label: '钱包', icon: Wallet },
  { href: '/cex', label: '交易所', icon: Building2 },
  { href: '/defi', label: 'DeFi', icon: Coins },
  { href: '/settings', label: '设置', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="dashboard-sidebar">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-sidebar-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-sidebar-border bg-card text-[13px] font-semibold">
            C
          </span>
          <span>Crypto Insight</span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('top-nav-link', isActive && 'top-nav-link-active')}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">V1 · 数据仅存本地</p>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-6">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
