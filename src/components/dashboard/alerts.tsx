'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {hasCritical ? (
            <WarningCircle size={16} className="text-foreground" />
          ) : (
            <Info size={16} className="text-muted-foreground" />
          )}
          {hasCritical ? '需要处理的问题' : '数据状态'}
        </span>
        <span className="text-xs text-muted-foreground">
          {criticals.length > 0 && `${criticals.length} 个错误`}
          {criticals.length > 0 && warnings.length > 0 && ' · '}
          {warnings.length > 0 && `${warnings.length} 个提醒`}
        </span>
      </div>
      <div className="gap-0 divide-y divide-border/40 border-b border-border/40">
        {displayErrors.map((err, i) => (
          <div
            key={i}
            className={`py-4 flex items-start gap-4 ${err.kind === 'error' ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            <WarningCircle
              size={18}
              className={`mt-0.5 shrink-0`}
            />
            <div className="min-w-0 flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`font-medium ${err.kind === 'error' ? 'text-foreground' : 'text-foreground'}`}>
                  {err.title ?? err.source}
                </span>
                {err.sourceLabel ? (
                  <span className="text-xs tracking-wide uppercase px-2 py-0.5 bg-muted/30 text-muted-foreground">
                    {err.sourceLabel}
                  </span>
                ) : null}
              </div>
              <p className={`text-sm leading-6 ${err.kind === 'error' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                {err.message}
              </p>
              {err.detail ? <p className="text-xs text-muted-foreground/60">{err.detail}</p> : null}
              {err.impact ? <p className="text-xs text-muted-foreground/60">{err.impact}</p> : null}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between rounded-none px-2 text-xs text-foreground hover:bg-muted/20"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起' : `查看全部 ${errors.length} 条提醒`}
          {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </Button>
      )}
    </div>
  )
}
