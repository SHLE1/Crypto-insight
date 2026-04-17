'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CircleAlert, Info, ChevronDown, ChevronUp } from 'lucide-react'
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
    <Card className={hasCritical ? 'border-destructive/30' : 'border-amber-500/20'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            {hasCritical ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <Info className="h-4 w-4 text-amber-500" />
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
        <div className="space-y-2">
          {displayErrors.map((err, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${
                err.kind === 'error'
                  ? 'bg-destructive/5 border border-destructive/10'
                  : 'bg-amber-500/5 border border-amber-500/10'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <CircleAlert className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${err.kind === 'warning' ? 'text-amber-500' : 'text-destructive'}`} />
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium text-foreground/90">{err.title ?? err.source}</span>
                    {err.sourceLabel ? <span className="text-xs text-muted-foreground">{err.sourceLabel}</span> : null}
                  </div>
                  <p className="text-foreground/80 leading-relaxed">{err.message}</p>
                  {err.detail ? <p className="text-muted-foreground text-xs leading-relaxed">{err.detail}</p> : null}
                  {err.impact ? <p className="text-muted-foreground text-xs leading-relaxed">{err.impact}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>收起 <ChevronUp className="ml-1 h-3 w-3" /></>
            ) : (
              <>查看全部 {errors.length} 条 <ChevronDown className="ml-1 h-3 w-3" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
