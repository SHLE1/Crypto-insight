import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderStat {
  label: string
  value: string
  detail?: string
  tone?: 'default' | 'positive' | 'warning' | 'danger'
}

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  meta?: ReactNode
  actions?: ReactNode
  stats?: PageHeaderStat[]
  className?: string
}

const toneClassMap: Record<NonNullable<PageHeaderStat['tone']>, string> = {
  default: 'text-foreground',
  positive: 'text-[var(--data-positive)]',
  warning: 'text-[var(--data-warning)]',
  danger: 'text-[var(--data-danger)]',
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  stats,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        'surface-hero relative overflow-hidden rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7 xl:px-8 xl:py-8',
        className
      )}
    >
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl space-y-4">
          {eyebrow ? <p className="page-kicker">{eyebrow}</p> : null}
          <div className="space-y-3">
            <h1 className="page-title max-w-4xl text-balance">{title}</h1>
            {description ? <p className="page-copy max-w-2xl">{description}</p> : null}
          </div>
          {meta ? <div className="flex flex-wrap items-center gap-2.5">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2.5 xl:justify-end">{actions}</div>
        ) : null}
      </div>

      {stats && stats.length > 0 ? (
        <div className="relative mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={`${stat.label}-${stat.value}`}
              className="surface-subtle rounded-[1.4rem] px-4 py-4"
            >
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
                {stat.label}
              </p>
              <p
                className={cn(
                  'mt-2 text-[1.25rem] font-semibold tracking-[-0.04em] tabular-nums sm:text-[1.4rem]',
                  toneClassMap[stat.tone ?? 'default']
                )}
              >
                {stat.value}
              </p>
              {stat.detail ? (
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{stat.detail}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
