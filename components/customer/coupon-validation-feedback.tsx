/** CouponValidationFeedback — debounced mock coupon validation feedback. */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { validateCouponCode } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { CouponValidation } from '@/lib/types'

export interface CouponValidationFeedbackProps {
  readonly code: string
  readonly subtotal: number
  readonly className?: string
}

type State =
  | { kind: 'idle' }
  | { kind: 'validating' }
  | { kind: 'done'; result: CouponValidation }

export function CouponValidationFeedback({
  code,
  subtotal,
  className,
}: Readonly<CouponValidationFeedbackProps>) {
  const trimmed = useMemo(() => code.trim(), [code])
  const [state, setState] = useState<State>({ kind: 'idle' })

  useEffect(() => {
    if (!trimmed) {
      setState({ kind: 'idle' })
      return
    }

    setState({ kind: 'validating' })
    const t = window.setTimeout(() => {
      setState({ kind: 'done', result: validateCouponCode(trimmed, subtotal) })
    }, 500)

    return () => window.clearTimeout(t)
  }, [subtotal, trimmed])

  if (state.kind === 'idle') return null

  if (state.kind === 'validating') {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Validating…
      </div>
    )
  }

  const ok = state.result.valid
  return (
    <p
      className={cn(
        'text-xs font-semibold',
        ok ? 'text-green-700' : 'text-destructive',
        className,
      )}
    >
      {state.result.message}
    </p>
  )
}

