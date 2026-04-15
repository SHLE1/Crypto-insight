'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CircleAlert } from 'lucide-react'
import type { ApiErrorState } from '@/types'

interface AlertsPanelProps {
  errors: ApiErrorState[]
}

export function AlertsPanel({ errors }: AlertsPanelProps) {
  if (errors.length === 0) return null

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          风险与异常提示
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.map((err, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <div className="flex items-start gap-3 text-sm">
                <CircleAlert className={`mt-0.5 h-4 w-4 shrink-0 ${err.kind === 'warning' ? 'text-amber-500' : 'text-destructive'}`} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium">{err.title ?? err.source}</span>
                    {err.sourceLabel ? <span className="text-muted-foreground">[{err.sourceLabel}]</span> : null}
                  </div>
                  <p className="text-foreground">{err.message}</p>
                  {err.detail ? <p className="text-muted-foreground">{err.detail}</p> : null}
                  {err.impact ? <p className="text-muted-foreground">影响：{err.impact}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
