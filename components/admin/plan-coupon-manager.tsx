/** Plan coupon links — subscriber-exclusive coupons for a membership SKU. */
'use client'

import { useMemo, useState } from 'react'

import { ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { formatPrice } from '@/lib/utils'
import type { PlanCoupon } from '@/lib/types'

export interface PlanCouponManagerProps {
  readonly planId: string
}

function createPlanCouponId(): string {
  return `pco-${Math.random().toString(16).slice(2, 10)}`
}

export function PlanCouponManager({ planId }: Readonly<PlanCouponManagerProps>) {
  const { planCoupons, addPlanCoupon, removePlanCoupon } = useClients()
  const { coupons } = useInventory()
  const [open, setOpen] = useState(false)

  const rows = useMemo(
    () => planCoupons.filter((r) => r.planId === planId),
    [planCoupons, planId],
  )

  const linkedIds = useMemo(() => new Set(rows.map((r) => r.couponId)), [rows])

  const candidates = useMemo(
    () => coupons.filter((c) => c.isActive && !linkedIds.has(c.id)),
    [coupons, linkedIds],
  )

  function linkCoupon(couponId: string) {
    const row: PlanCoupon = {
      id: createPlanCouponId(),
      planId,
      couponId,
    }
    addPlanCoupon(row)
    setOpen(false)
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Play coupons</p>
        <p className="text-xs text-muted-foreground">
          These coupons are only usable by active members of this plan.
        </p>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => {
            const c = coupons.find((x) => x.id === row.couponId)
            const discountLabel =
              c?.type === 'PERCENTAGE'
                ? `${c.value}% off`
                : formatPrice(c?.value ?? 0)
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c?.code ?? row.couponId}</p>
                  <p className="text-xs text-muted-foreground">{discountLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {c?.validUntil ? new Date(c.validUntil).toLocaleDateString() : '—'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => removePlanCoupon(row.id)}
                >
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No coupons linked yet.</p>
      )}

      <div className="space-y-2">
        <Label>Add coupon</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={candidates.length === 0}
              className="w-full justify-between"
            >
              Choose coupon…
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search coupons…" />
              <CommandList>
                <CommandEmpty>No coupons available.</CommandEmpty>
                <CommandGroup>
                  {candidates.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.code} ${c.name}`}
                      onSelect={() => linkCoupon(c.id)}
                    >
                      <span className="font-semibold">{c.code}</span>
                      <span className="ml-2 truncate text-muted-foreground">{c.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
