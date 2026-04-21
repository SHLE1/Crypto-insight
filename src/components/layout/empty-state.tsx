import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center border border-dashed border-border/40 bg-zinc-50/50 px-6 py-24 text-center transition-colors hover:bg-zinc-100/50 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40">
      <div className="max-w-[420px] flex flex-col gap-4">
        <div className="mx-auto rounded-full bg-muted/50 p-3 w-fit">
          <div className="size-4 bg-muted-foreground/30 animate-pulse rounded-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {action ? (
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          {action}
        </div>
      ) : null}
    </div>
  )
}
