'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Buildings,
  ChartPieSlice,
  Coins,
  ListBullets,
  Rows,
  Wallet,
} from '@phosphor-icons/react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '总览', icon: Rows },
  { href: '/holdings', label: '资产明细', icon: ListBullets },
  { href: '/wallets', label: '钱包', icon: Wallet },
  { href: '/cex', label: '交易所', icon: Buildings },
  { href: '/defi', label: 'DeFi', icon: Coins },
  { href: '/settings', label: '设置', icon: ChartPieSlice },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="dashboard-sidebar">
      <div className="flex h-[60px] items-center justify-between border-b border-sidebar-border/60 px-4">
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground">
          <span className="flex size-8 items-center justify-center rounded-md border border-sidebar-border/70 bg-card text-xs font-semibold tracking-[-0.03em]">
            CI
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold tracking-[-0.03em]">Crypto Insight</span>
            <span className="block text-[11px] tracking-[0.14em] text-muted-foreground">PORTFOLIO TRACKING</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 px-3 py-4">
        <div className="mb-2 px-1">
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">导航</p>
        </div>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('top-nav-link', isActive && 'top-nav-link-active')}
              >
                <item.icon size={18} weight={isActive ? 'fill' : 'regular'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-sidebar-border/60 p-4">
        <div className="rounded-md border border-sidebar-border/60 bg-muted/40 p-3">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground">数据策略</p>
          <p className="mt-2 text-sm leading-6 text-sidebar-foreground/90">
            数据仅存储在当前设备，不会自动上传或同步。
          </p>
        </div>
        <p className="text-[11px] tracking-[0.08em] text-muted-foreground">LOCAL FIRST</p>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors',
                isActive
                  ? 'bg-accent/60 text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon size={18} weight={isActive ? 'fill' : 'regular'} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
