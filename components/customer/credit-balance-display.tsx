/** CreditBalanceDisplay — compact credit balance stat with icon. */
'use client'

import { Coins } from 'lucide-react'

import { cn } from '@/lib/utils'

interface CreditBalanceDisplayProps {
  readonly balance: number
  readonly className?: string
}

export function CreditBalanceDisplay({
  balance,
  className,
}: Readonly<CreditBalanceDisplayProps>) {
  const positive = balance > 0

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        positive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-50 text-slate-600',
        className,
      )}
    >
      <Coins
        className={cn(
          'h-4 w-4',
          positive ? 'text-emerald-500' : 'text-slate-400',
        )}
      />
      <span>{balance} credits</span>
    </div>
  )
}

