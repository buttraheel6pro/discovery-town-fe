/** Shared checkout coupon UI — selectable eligible offers and manual promo code entry. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { Check, ChevronDown, Tag, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  coupons,
  getEligibleCoupons,
  shopCoupons,
  validateCouponForContext,
} from '@/lib/mock-data'
import { cn, formatPrice } from '@/lib/utils'
import type { Coupon, CouponContext } from '@/lib/types'

function lookupActiveCouponByCode(raw: string): Coupon | null {
  const normalized = raw.trim().toUpperCase()
  if (normalized.length === 0) {
    return null
  }
  for (const c of [...coupons, ...shopCoupons]) {
    if (c.code.toUpperCase() === normalized && c.isActive) {
      return c
    }
  }
  return null
}

function formatExpiry(validUntil: string): string {
  const d = new Date(validUntil)
  if (!Number.isFinite(d.getTime())) {
    return ''
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export interface CouponPanelProps {
  readonly context: CouponContext
  readonly subtotal: number
  readonly onCouponApplied: (coupon: Coupon | null, discountAmount: number) => void
  readonly hasActiveSubscription?: boolean
  readonly contactId?: string
  /** When parent holds applied coupon (e.g. cart persistence), keep UI in sync. */
  readonly externalAppliedCode?: string | null
  readonly externalDiscount?: number
}

export function CouponPanel({
  context,
  subtotal,
  onCouponApplied,
  hasActiveSubscription = false,
  contactId,
  externalAppliedCode,
  externalDiscount,
}: Readonly<CouponPanelProps>) {
  const [offersReady, setOffersReady] = useState(false)
  const [offersOpen, setOffersOpen] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [applyError, setApplyError] = useState<string | null>(null)

  const eligibleCoupons = useMemo(
    () => getEligibleCoupons(context, subtotal, { hasActiveSubscription }),
    [context, subtotal, hasActiveSubscription],
  )

  useEffect(() => {
    const t = window.setTimeout(() => setOffersReady(true), 300)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const code = externalAppliedCode?.trim() ?? ''
    const discount = externalDiscount ?? 0
    if (code && discount > 0) {
      const c = lookupActiveCouponByCode(code)
      if (c) {
        setAppliedCoupon(c)
        setAppliedDiscount(discount)
        setManualCode(c.code)
        setSelectedOfferId(c.id)
        setApplyError(null)
        return
      }
    }
    if (!code || discount <= 0) {
      setAppliedCoupon(null)
      setAppliedDiscount(0)
      setSelectedOfferId(null)
      setManualCode('')
    }
  }, [externalAppliedCode, externalDiscount])

  function clearApplied() {
    setAppliedCoupon(null)
    setAppliedDiscount(0)
    setSelectedOfferId(null)
    setManualCode('')
    setApplyError(null)
    onCouponApplied(null, 0)
  }

  function applyValidated(coupon: Coupon, discountAmount: number) {
    setAppliedCoupon(coupon)
    setAppliedDiscount(discountAmount)
    setManualCode(coupon.code)
    setApplyError(null)
    onCouponApplied(coupon, discountAmount)
  }

  function handleSelectOffer(coupon: Coupon) {
    const result = validateCouponForContext(
      coupon.code,
      context,
      subtotal,
      contactId,
      hasActiveSubscription,
    )
    if (!result.valid || !result.coupon) {
      setApplyError(result.message)
      return
    }
    setSelectedOfferId(coupon.id)
    setManualCode(coupon.code)
    applyValidated(result.coupon, result.discountAmount)
  }

  function handleManualApply() {
    const trimmed = manualCode.trim()
    if (!trimmed) {
      setApplyError('Enter a promo code')
      return
    }
    setSelectedOfferId(null)
    const result = validateCouponForContext(
      trimmed,
      context,
      subtotal,
      contactId,
      hasActiveSubscription,
    )
    if (!result.valid || !result.coupon) {
      setApplyError(result.message)
      return
    }
    applyValidated(result.coupon, result.discountAmount)
  }

  function handleManualChange(value: string) {
    setManualCode(value)
    setApplyError(null)
    if (selectedOfferId) {
      const prev = lookupActiveCouponByCode(manualCode)
      if (prev && value.trim().toUpperCase() !== prev.code.toUpperCase()) {
        setSelectedOfferId(null)
      }
    }
  }

  const showZoneA = offersReady && eligibleCoupons.length > 0
  const showLoadingSkeleton = !offersReady

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      {showLoadingSkeleton ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading offers">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : null}

      {offersReady && showZoneA ? (
        <Collapsible open={offersOpen} onOpenChange={setOffersOpen}>
          <CollapsibleTrigger
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <span>Offers for you ({eligibleCoupons.length})</span>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 transition-transform', offersOpen && 'rotate-180')}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {eligibleCoupons.map((coupon) => {
              const isCardSelected = selectedOfferId === coupon.id && appliedCoupon?.id === coupon.id
              return (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() => handleSelectOffer(coupon)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition-colors',
                    isCardSelected
                      ? 'border-emerald-500/70 bg-emerald-500/10'
                      : 'border-border bg-card hover:bg-muted/40',
                  )}
                >
                  <Tag
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      isCardSelected ? 'text-emerald-700' : 'text-muted-foreground',
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {coupon.code}
                      </span>
                      {isCardSelected ? (
                        <Badge className="h-5 border-emerald-600/50 bg-emerald-600/15 px-1.5 text-[10px] font-semibold text-emerald-900 dark:text-emerald-100">
                          <Check className="mr-0.5 h-3 w-3" aria-hidden />
                          Applied
                        </Badge>
                      ) : null}
                    </div>
                    {coupon.description ? (
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {coupon.description}
                      </p>
                    ) : null}
                    {coupon.validUntil ? (
                      <p className="text-[10px] text-muted-foreground">
                        Expires {formatExpiry(coupon.validUntil)}
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    className={cn(
                      'shrink-0 text-[10px] font-bold',
                      coupon.type === 'PERCENTAGE'
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100'
                        : 'border-sky-500/50 bg-sky-500/15 text-sky-950 dark:text-sky-100',
                    )}
                  >
                    {coupon.type === 'PERCENTAGE'
                      ? `${coupon.value}% OFF`
                      : `${formatPrice(coupon.value)} OFF`}
                  </Badge>
                </button>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Promo code</p>
        <div className="flex gap-2">
          <Input
            placeholder="Enter promo code"
            value={manualCode}
            onChange={(e) => handleManualChange(e.target.value)}
            className="h-9 font-mono text-sm"
            aria-invalid={Boolean(applyError)}
            autoComplete="off"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={handleManualApply}
          >
            Apply
          </Button>
        </div>
        {applyError ? (
          <p className="text-xs font-semibold text-destructive">{applyError}</p>
        ) : null}
        {offersReady && !showZoneA ? (
          <p className="text-[11px] text-muted-foreground">
            Have a promo code? Enter it above.
          </p>
        ) : null}
      </div>

      {appliedCoupon && appliedDiscount > 0 ? (
        <div
          className="flex items-center justify-between gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-950 dark:text-emerald-100"
          role="status"
        >
          <span className="min-w-0 truncate">
            <span className="font-mono">{appliedCoupon.code}</span> applied — saving{' '}
            {formatPrice(appliedDiscount)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-emerald-900 hover:bg-emerald-500/20 dark:text-emerald-100"
            onClick={clearApplied}
            aria-label="Remove coupon"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
