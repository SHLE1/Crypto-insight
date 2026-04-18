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
    <header
      className={cn(
        'flex flex-col gap-5 border-b border-border/75 pb-6 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-3">
        {badge ? <span className="section-eyebrow">{badge}</span> : null}
        <div className="space-y-2">
          <h1 className="max-w-3xl text-[1.875rem] font-semibold tracking-[-0.05em] text-foreground md:text-[2.2rem]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-[65ch] text-[0.96rem] leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
