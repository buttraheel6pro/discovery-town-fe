/** CreditPackCard — visual card for a credit pack with progress and expiry. */
'use client'

import { format, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getPackProgressPct, isPackExpiringSoon } from '@/lib/utils'
import type { CmCreditPackPurchase } from '@/lib/types'

interface CreditPackCardProps {
  readonly purchase: CmCreditPackPurchase
  readonly onSelect?: (purchaseId: string) => void
  readonly compact?: boolean
}

export function CreditPackCard({
  purchase,
  onSelect,
  compact = false,
}: Readonly<CreditPackCardProps>) {
  const pct = getPackProgressPct(purchase)
  const expiringSoon =
    purchase.status === 'ACTIVE' && isPackExpiringSoon(purchase)

  const used = purchase.creditsPurchased - purchase.creditsRemaining

  const expiresLabel = `Expires ${format(parseISO(purchase.expiresAt), 'd MMM yyyy')}`

  return (
    <Card className={compact ? 'border border-border' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold">
          {purchase.creditPackDefinition?.name ?? 'Credit Pack'}
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {purchase.status}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {used} used / {purchase.creditsPurchased} total
            </span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{expiresLabel}</span>
          {expiringSoon ? (
            <span className="text-amber-600 font-medium">Expiring soon</span>
          ) : null}
        </div>

        {onSelect ? (
          <Button
            type="button"
            size="sm"
            className="w-full mt-1"
            onClick={() => onSelect(purchase.id)}
          >
            Use pack
            <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

