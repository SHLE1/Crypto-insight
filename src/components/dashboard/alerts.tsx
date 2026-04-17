'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, CircleAlert, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ApiErrorState } from '@/types'

interface AlertsPanelProps {
  errors: ApiErrorState[]
}

export function AlertsPanel({ errors }: AlertsPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (errors.length === 0) return null

  const warnings = errors.filter((e) => e.kind === 'warning')
  const criticals = errors.filter((e) => e.kind === 'error')
  const hasCritical = criticals.length > 0
  const displayErrors = expanded ? errors : errors.slice(0, 2)
  const hasMore = errors.length > 2

  return (
    <Card className={hasCritical ? 'border-destructive/30' : 'border-[color:color-mix(in_oklch,var(--data-warning)_28%,transparent)]'}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            {hasCritical ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <Info className="h-4 w-4 text-[var(--data-warning)]" />
            )}
            {hasCritical ? '异常提示' : '数据状态'}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {criticals.length > 0 && `${criticals.length} 个错误`}
            {criticals.length > 0 && warnings.length > 0 && ' · '}
            {warnings.length > 0 && `${warnings.length} 个提醒`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5">
          {displayErrors.map((err, i) => (
            <div
              key={i}
              className={`rounded-[1.2rem] border p-3.5 text-sm ${
                err.kind === 'error'
                  ? 'border-destructive/18 bg-destructive/6'
                  : 'border-[color:color-mix(in_oklch,var(--data-warning)_28%,transparent)] bg-[color:color-mix(in_oklch,var(--data-warning)_10%,transparent)]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <CircleAlert className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${err.kind === 'warning' ? 'text-[var(--data-warning)]' : 'text-destructive'}`} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium tracking-[-0.03em] text-foreground/90">{err.title ?? err.source}</span>
                    {err.sourceLabel ? <span className="text-xs text-muted-foreground">{err.sourceLabel}</span> : null}
                  </div>
                  <p className="leading-6 text-foreground/80">{err.message}</p>
                  {err.detail ? <p className="text-xs leading-6 text-muted-foreground">{err.detail}</p> : null}
                  {err.impact ? <p className="text-xs leading-6 text-muted-foreground">{err.impact}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMore ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                收起
                <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                查看全部 {errors.length} 条
                <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
