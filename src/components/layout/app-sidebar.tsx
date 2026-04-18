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
      <div className="flex h-[88px] items-center justify-between border-b border-sidebar-border/80 px-5">
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-sidebar-border/80 bg-background/85 text-sm font-semibold tracking-[-0.04em] shadow-[0_1px_0_color-mix(in_oklch,white_72%,transparent)_inset]">
            CI
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold tracking-[-0.03em]">Crypto Insight</span>
            <span className="block text-[11px] tracking-[0.12em] text-muted-foreground">LOCAL-FIRST PORTFOLIO</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 px-4 py-5">
        <div className="mb-3 px-1">
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">导航</p>
        </div>
        <nav className="space-y-1.5">
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

      <div className="space-y-3 border-t border-sidebar-border/80 px-5 py-4">
        <div className="rounded-2xl border border-sidebar-border/80 bg-background/80 p-3">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground">数据策略</p>
          <p className="mt-2 text-sm leading-6 text-sidebar-foreground/90">
            钱包、交易所与设置仅保存在当前设备，不会自动上传。
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">V1 · 本地优先</p>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[1.4rem] border border-border/80 bg-card/92 p-2 shadow-[0_18px_40px_-28px_color-mix(in_oklch,var(--foreground)_24%,transparent)] backdrop-blur md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium tracking-[0.04em] transition-all',
                isActive
                  ? 'bg-accent text-foreground shadow-[0_1px_0_color-mix(in_oklch,white_70%,transparent)_inset]'
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
