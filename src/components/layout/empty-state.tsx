import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative flex min-h-[320px] flex-col items-center justify-center px-6 py-14 text-center">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="max-w-xl space-y-4">
          <span className="section-eyebrow">准备开始</span>
          <div className="space-y-3">
            <h2 className="text-[1.65rem] font-semibold tracking-[-0.045em] text-foreground md:text-[1.9rem]">
              {title}
            </h2>
            <p className="mx-auto max-w-[60ch] text-[0.96rem] leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
