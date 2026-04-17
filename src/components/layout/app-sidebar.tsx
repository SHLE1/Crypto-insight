'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  ListTree,
  Settings,
  Sparkles,
  Wallet,
} from 'lucide-react'

const navItems = [
  { href: '/', label: '总览', hint: '全局净值与结构', icon: LayoutDashboard },
  { href: '/holdings', label: '资产明细', hint: '按代币 / 钱包 / 链查看', icon: ListTree },
  { href: '/wallets', label: '钱包', hint: '本地地址与启停控制', icon: Wallet },
  { href: '/cex', label: '交易所', hint: '只读账户与密钥状态', icon: Building2 },
  { href: '/settings', label: '设置', hint: '主题、导入导出与本地数据', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-panel">
        <div className="brand-lockup">
          <Link href="/" className="brand-lockup">
            <span className="brand-mark">CI</span>
            <span>
              <span className="brand-title block">Crypto Insight</span>
              <span className="brand-subtitle block">Private portfolio cockpit</span>
            </span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="surface-subtle rounded-[1.45rem] px-4 py-4">
          <p className="section-label">Workspace</p>
          <p className="mt-2 text-sm font-medium tracking-[-0.03em] text-foreground">
            为个人持仓、估值和数据分析而设
          </p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            本地优先、只读接入、冷静克制的分析界面。
          </p>
        </div>

        <div className="space-y-3">
          <p className="nav-group-label">Navigation</p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('nav-link', isActive && 'nav-link--active')}
                >
                  <span className="nav-icon-wrap">
                    <item.icon className="h-[1.05rem] w-[1.05rem]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium tracking-[-0.03em]">{item.label}</span>
                    <span className="mt-0.5 block truncate text-[0.72rem] text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="surface-subtle rounded-[1.45rem] px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium tracking-[-0.03em]">
            <Sparkles className="h-4 w-4 text-primary" />
            高级 SaaS 视图
          </div>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            聚焦净值、结构、异常与来源质量，不做喧闹的“交易盘风”装饰。
          </p>
          <div className="mt-3 soft-divider" />
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
            v1 · data stored locally
          </p>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav-shell md:hidden">
      <div className="mobile-nav-frame">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={isActive}
              className="mobile-nav-link"
            >
              <item.icon className="h-[1.05rem] w-[1.05rem]" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
