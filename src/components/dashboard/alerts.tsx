'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CaretDown, CaretUp, Info, WarningCircle } from '@phosphor-icons/react'
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
    <Card className={hasCritical ? 'border-destructive/25' : 'border-border/75'}>
      <CardHeader className="border-b border-border/75 pb-4">
        <CardTitle className="flex items-center justify-between gap-3 text-sm font-medium">
          <span className="flex items-center gap-2">
            {hasCritical ? (
              <WarningCircle size={16} weight="fill" className="text-destructive" />
            ) : (
              <Info size={16} weight="regular" className="text-amber-600 dark:text-amber-400" />
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
      <CardContent className="pt-4">
        <div className="space-y-2.5">
          {displayErrors.map((err, i) => (
            <div
              key={i}
              className={err.kind === 'error'
                ? 'rounded-[1rem] border border-destructive/12 bg-destructive/6 p-3.5 text-sm'
                : 'rounded-[1rem] border border-border/75 bg-muted/28 p-3.5 text-sm'}
            >
              <div className="flex items-start gap-2.5">
                <WarningCircle
                  size={15}
                  weight={err.kind === 'warning' ? 'regular' : 'fill'}
                  className={`mt-0.5 shrink-0 ${err.kind === 'warning' ? 'text-muted-foreground' : 'text-destructive'}`}
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium text-foreground/90">{err.title ?? err.source}</span>
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
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                收起
                <CaretUp size={12} weight="bold" className="ml-1" />
              </>
            ) : (
              <>
                查看全部 {errors.length} 条
                <CaretDown size={12} weight="bold" className="ml-1" />
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
