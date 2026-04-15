/** Plan add-on links — admin membership plan detail section. */
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { useClients } from '@/lib/client-store'
import { useInventory } from '@/lib/inventory-store'
import { membershipSchedulingAddonCatalog } from '@/lib/mock-data'
import { resolveMembershipAddonName } from '@/lib/membership-helpers'
import type { PlanAddOn } from '@/lib/types'

export interface PlanAddOnManagerProps {
  readonly planId: string
}

function createPlanAddOnId(): string {
  return `pao-${Math.random().toString(16).slice(2, 10)}`
}

export function PlanAddOnManager({ planId }: Readonly<PlanAddOnManagerProps>) {
  const { planAddOns, addPlanAddOn, updatePlanAddOn, removePlanAddOn } = useClients()
  const { bookingAddOns } = useInventory()
  const [open, setOpen] = useState(false)

  const rows = useMemo(
    () => planAddOns.filter((r) => r.planId === planId),
    [planAddOns, planId],
  )

  const catalog = useMemo(() => {
    const fromBooking = bookingAddOns.map((a) => ({ id: a.id, name: a.name }))
    const fromScheduling = membershipSchedulingAddonCatalog.map((a) => ({
      id: a.id,
      name: a.name,
    }))
    const seen = new Set<string>()
    const out: { id: string; name: string }[] = []
    for (const x of [...fromBooking, ...fromScheduling]) {
      if (seen.has(x.id)) continue
      seen.add(x.id)
      out.push(x)
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }, [bookingAddOns])

  const linkedIds = useMemo(() => new Set(rows.map((r) => r.addOnId)), [rows])

  const candidates = useMemo(
    () => catalog.filter((c) => !linkedIds.has(c.id)),
    [catalog, linkedIds],
  )

  function linkAddOn(addOnId: string) {
    const row: PlanAddOn = {
      id: createPlanAddOnId(),
      planId,
      addOnId,
      isIncluded: false,
    }
    addPlanAddOn(row)
    setOpen(false)
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Play add-ons</p>
        <p className="text-xs text-muted-foreground">
          Catalog add-ons linked to this membership SKU (same as inventory / scheduling add-ons).
        </p>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((row) => {
            const label = resolveMembershipAddonName(
              row.addOnId,
              bookingAddOns,
              membershipSchedulingAddonCatalog,
            )
            return (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`inc-${row.id}`}
                      checked={row.isIncluded}
                      onCheckedChange={(v) =>
                        updatePlanAddOn(row.id, { isIncluded: Boolean(v) })
                      }
                    />
                    <Label htmlFor={`inc-${row.id}`} className="text-xs">
                      Included free
                    </Label>
                  </div>
                  {!row.isIncluded ? (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`disc-${row.id}`} className="text-xs whitespace-nowrap">
                        Discount %
                      </Label>
                      <Input
                        id={`disc-${row.id}`}
                        className="h-8 w-16"
                        inputMode="numeric"
                        placeholder="0"
                        value={row.discountPercent != null ? String(row.discountPercent) : ''}
                        onChange={(e) => {
                          const t = e.target.value.trim()
                          if (!t) {
                            updatePlanAddOn(row.id, { discountPercent: undefined })
                            return
                          }
                          const n = Number.parseFloat(t)
                          updatePlanAddOn(row.id, {
                            discountPercent: Number.isFinite(n) ? n : undefined,
                          })
                        }}
                      />
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => removePlanAddOn(row.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No add-ons linked yet.</p>
      )}

      <div className="space-y-2">
        <Label>Link add-on</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={candidates.length === 0}
              className="w-full justify-between"
            >
              Choose catalog add-on…
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search add-ons…" />
              <CommandList>
                <CommandEmpty>No add-ons left to link.</CommandEmpty>
                <CommandGroup>
                  {candidates.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.id}`}
                      onSelect={() => linkAddOn(c.id)}
                    >
                      {c.name}
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
