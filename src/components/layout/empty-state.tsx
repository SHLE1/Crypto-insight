import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  mark: string
  title: string
  description: string
  actions?: ReactNode
  className?: string
}

export function EmptyState({ mark, title, description, actions, className }: EmptyStateProps) {
  return (
    <Card className={cn('surface-panel overflow-hidden', className)}>
      <CardContent className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="metric-chip metric-chip--soft mb-5 h-14 min-w-14 rounded-[1.25rem] px-5 text-2xl font-semibold tracking-[-0.06em]">
            {mark}
          </div>
          <h2 className="text-[1.45rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.7rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-[0.97rem]">
            {description}
          </p>
          {actions ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}
