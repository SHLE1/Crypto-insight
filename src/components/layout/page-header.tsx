import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-border/80 pb-5 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {badge ? (
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {badge}
          </span>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-[1.625rem] font-semibold tracking-[-0.04em] text-foreground md:text-[1.85rem]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
