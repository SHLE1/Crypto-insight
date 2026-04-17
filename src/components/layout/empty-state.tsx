import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-md space-y-3">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
