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
        'flex flex-col gap-4 pb-2 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex flex-col gap-2.5">
        {badge ? <span className="section-eyebrow">{badge}</span> : null}
        <div className="flex flex-col gap-1.5">
          <h1 className="max-w-3xl text-2xl font-semibold tracking-[-0.04em] text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="max-w-[64ch] text-[0.95rem] leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
