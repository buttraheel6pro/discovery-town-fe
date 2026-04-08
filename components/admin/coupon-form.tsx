/** Coupon form — shared create/edit form for coupon management. */
'use client'

import { useCallback } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Coupon, CouponType } from '@/lib/types'

export type CouponDraft = {
  code: string
  name: string
  description: string
  type: CouponType
  value: string
  usageLimit: string
  perContactLimit: string
  validFrom: string
  validUntil: string
  requiresSubscription: boolean
  isActive: boolean
  applicableToShop: boolean
  applicableToBooking: boolean
  applicableToMembership: boolean
}

export interface CouponFormProps {
  readonly value: CouponDraft
  readonly onChange: (next: CouponDraft) => void
  readonly disabled?: boolean
  readonly className?: string
}

export function couponToDraft(coupon: Coupon): CouponDraft {
  return {
    code: coupon.code ?? '',
    name: coupon.name ?? '',
    description: coupon.description ?? '',
    type: coupon.type,
    value: String(coupon.value ?? ''),
    usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
    perContactLimit: coupon.perContactLimit != null ? String(coupon.perContactLimit) : '',
    validFrom: coupon.validFrom ?? new Date().toISOString(),
    validUntil: coupon.validUntil ?? '',
    requiresSubscription: coupon.requiresSubscription ?? false,
    isActive: coupon.isActive ?? true,
    applicableToShop: coupon.applicableTo?.includes('SHOP') ?? false,
    applicableToBooking: coupon.applicableTo?.includes('BOOKING') ?? false,
    applicableToMembership: coupon.applicableTo?.includes('MEMBERSHIP') ?? false,
  }
}

function numberOrUndefined(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

export function draftToCouponPatch(draft: CouponDraft): Partial<Coupon> {
  const usageLimit = numberOrUndefined(draft.usageLimit)
  const perContactLimit = numberOrUndefined(draft.perContactLimit)
  const value = Number.parseFloat(draft.value)

  const applicableTo: Array<'BOOKING' | 'SHOP' | 'MEMBERSHIP'> = []
  if (draft.applicableToBooking) applicableTo.push('BOOKING')
  if (draft.applicableToShop) applicableTo.push('SHOP')
  if (draft.applicableToMembership) applicableTo.push('MEMBERSHIP')

  return {
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    type: draft.type,
    value: Number.isFinite(value) ? value : 0,
    usageLimit,
    perContactLimit,
    validFrom: draft.validFrom,
    validUntil: draft.validUntil,
    requiresSubscription: draft.requiresSubscription,
    isActive: draft.isActive,
    applicableTo,
  }
}

export function CouponForm({
  value,
  onChange,
  disabled = false,
  className,
}: Readonly<CouponFormProps>) {
  const set = useCallback(
    <K extends keyof CouponDraft>(key: K, next: CouponDraft[K]) => {
      onChange({ ...value, [key]: next })
    },
    [onChange, value],
  )

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cpn-code">Code</Label>
          <Input
            id="cpn-code"
            value={value.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            disabled={disabled}
            placeholder="WELCOME10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpn-name">Name</Label>
          <Input
            id="cpn-name"
            value={value.name}
            onChange={(e) => set('name', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpn-desc">Description</Label>
        <Textarea
          id="cpn-desc"
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cpn-type">Type</Label>
          <Select
            value={value.type}
            onValueChange={(v) => set('type', v as CouponType)}
            disabled={disabled}
          >
            <SelectTrigger id="cpn-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              <SelectItem value="FIXED_AMOUNT">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpn-value">{value.type === 'PERCENTAGE' ? 'Value (%)' : 'Value (£)'}</Label>
          <Input
            id="cpn-value"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.value}
            onChange={(e) => set('value', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpn-usage">Usage limit</Label>
          <Input
            id="cpn-usage"
            type="number"
            step="1"
            value={value.usageLimit}
            onChange={(e) => set('usageLimit', e.target.value)}
            disabled={disabled}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cpn-per">Per-contact limit</Label>
          <Input
            id="cpn-per"
            type="number"
            step="1"
            value={value.perContactLimit}
            onChange={(e) => set('perContactLimit', e.target.value)}
            disabled={disabled}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpn-from">Valid from</Label>
          <Input
            id="cpn-from"
            type="date"
            value={value.validFrom.slice(0, 10)}
            onChange={(e) => set('validFrom', new Date(e.target.value).toISOString())}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpn-until">Valid until</Label>
          <Input
            id="cpn-until"
            type="date"
            value={value.validUntil ? value.validUntil.slice(0, 10) : ''}
            onChange={(e) =>
              set('validUntil', e.target.value ? new Date(e.target.value).toISOString() : '')
            }
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Applies to</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="cpn-shop">Shop</Label>
            <Switch
              id="cpn-shop"
              checked={value.applicableToShop}
              onCheckedChange={(v) => set('applicableToShop', v)}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="cpn-booking">Booking</Label>
            <Switch
              id="cpn-booking"
              checked={value.applicableToBooking}
              onCheckedChange={(v) => set('applicableToBooking', v)}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="cpn-membership">Membership</Label>
            <Switch
              id="cpn-membership"
              checked={value.applicableToMembership}
              onCheckedChange={(v) => set('applicableToMembership', v)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="cpn-sub">Requires subscription</Label>
          <Switch
            id="cpn-sub"
            checked={value.requiresSubscription}
            onCheckedChange={(v) => set('requiresSubscription', v)}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="cpn-active">Active</Label>
          <Switch
            id="cpn-active"
            checked={value.isActive}
            onCheckedChange={(v) => set('isActive', v)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

