'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ListTree,
  Wallet,
  Building2,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/', label: '总览', icon: LayoutDashboard },
  { href: '/holdings', label: '资产明细', icon: ListTree },
  { href: '/wallets', label: '钱包', icon: Wallet },
  { href: '/cex', label: '交易所', icon: Building2 },
  { href: '/settings', label: '设置', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">C</span>
          <span>Crypto Insight</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-primary')} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] text-muted-foreground/70">V1 · 数据仅存本地</p>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card/95 backdrop-blur-sm">
      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors',
              isActive
                ? 'text-primary font-medium'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
