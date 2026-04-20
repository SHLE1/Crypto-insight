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
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-xl space-y-3.5">
          <span className="section-eyebrow">下一步</span>
          <div className="space-y-2.5">
            <h2 className="text-[1.52rem] font-semibold tracking-[-0.05em] text-foreground md:text-[1.75rem]">
              {title}
            </h2>
            <p className="mx-auto max-w-[60ch] text-[0.96rem] leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action ? (
          <div className="mt-6 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center [&>*]:flex [&>*]:w-full [&>*]:justify-center sm:[&>*]:w-auto">
            {action}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
