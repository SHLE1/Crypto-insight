'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

export function DefiPlaceholder() {
  return (
    <Card className="opacity-60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lock className="h-4 w-4" />
          DeFi 仓位
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          即将支持
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          DeFi 仓位查询将在第二版上线，届时支持 Uniswap、Aave 等主流协议的仓位与收益追踪。
        </p>
      </CardContent>
    </Card>
  )
}
