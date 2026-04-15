'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
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
        <div className="space-y-2">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm"
            >
              <span className="text-destructive shrink-0">●</span>
              <div>
                <span className="font-medium">{err.source}</span>
                <span className="text-muted-foreground ml-1">
                  {err.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
