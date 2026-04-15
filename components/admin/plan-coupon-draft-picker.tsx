/** Controlled coupon ids for plan create — saved when parent persists the plan. */
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
import { useInventory } from '@/lib/inventory-store'
import { formatPrice } from '@/lib/utils'

export interface PlanCouponDraftPickerProps {
  readonly couponIds: readonly string[]
  readonly onChange: (next: string[]) => void
  readonly title?: string
}

export function PlanCouponDraftPicker({
  couponIds,
  onChange,
  title = 'Play coupons',
}: Readonly<PlanCouponDraftPickerProps>) {
  const { coupons } = useInventory()
  const [open, setOpen] = useState(false)

  const linkedSet = useMemo(() => new Set(couponIds), [couponIds])

  const candidates = useMemo(
    () => coupons.filter((c) => c.isActive && !linkedSet.has(c.id)),
    [coupons, linkedSet],
  )

  function linkCoupon(id: string) {
    onChange([...couponIds, id])
    setOpen(false)
  }

  function removeId(id: string) {
    onChange(couponIds.filter((x) => x !== id))
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          These coupons are only usable by active members of this plan.
        </p>
      </div>

      {couponIds.length > 0 ? (
        <ul className="space-y-2">
          {couponIds.map((id) => {
            const c = coupons.find((x) => x.id === id)
            const discountLabel =
              c?.type === 'PERCENTAGE'
                ? `${c.value}% off`
                : formatPrice(c?.value ?? 0)
            return (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c?.code ?? id}</p>
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
                  onClick={() => removeId(id)}
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
