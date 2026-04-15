/** Manage linked add-ons for an existing scheduling category. */
'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, MoveDown, MoveUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { samplePreschoolAddOns } from '@/lib/mock-data'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import { bookingAddOnToSchedulingAddOn, formatPrice } from '@/lib/utils'
import type { SchedulingServiceAddOn } from '@/lib/types'

interface CategoryAddOnManagerProps {
  readonly categoryId: string
}

export function CategoryAddOnManager({ categoryId }: CategoryAddOnManagerProps) {
  const { bookingAddOns } = useInventory()
  const {
    categories,
    services,
    updateCategory,
    linkSchedulingAddOn,
    unlinkSchedulingAddOn,
    setSchedulingAddOnFree,
  } = useScheduling()
  const [pickerOpen, setPickerOpen] = useState(false)

  const category = useMemo(
    () => categories.find((entry) => entry.id === categoryId) ?? null,
    [categories, categoryId],
  )

  const addOnCatalog = useMemo(() => {
    const map = new Map<string, SchedulingServiceAddOn>()
    for (const service of services) {
      for (const addOn of service.addOns ?? []) {
        if (addOn.isActive) {
          map.set(addOn.id, addOn)
        }
      }
    }
    for (const addOn of samplePreschoolAddOns) {
      map.set(addOn.id, addOn)
    }
    for (const addOn of bookingAddOns) {
      if (addOn.isActive) {
        map.set(addOn.id, bookingAddOnToSchedulingAddOn(addOn))
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [bookingAddOns, services])

  const links = category?.linkedAddOns ?? []
  const availableToLink = addOnCatalog.filter(
    (addOn) => !links.some((linked) => linked.addOnId === addOn.id),
  )

  function moveLink(fromIndex: number, toIndex: number) {
    if (!category) return
    const nextLinks = category.linkedAddOns ? [...category.linkedAddOns] : []
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= nextLinks.length || toIndex >= nextLinks.length) {
      return
    }
    const [item] = nextLinks.splice(fromIndex, 1)
    nextLinks.splice(toIndex, 0, item)
    updateCategory(category.id, { linkedAddOns: nextLinks })
  }

  if (!category) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Category add-ons</h3>
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
          {links.length} linked
        </Badge>
      </div>

      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
            No add-ons linked yet. Use the picker below to attach booking add-ons.
          </p>
        ) : (
          links.map((link, index) => {
            const addOn = addOnCatalog.find((entry) => entry.id === link.addOnId)
            return (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {addOn?.name ?? link.addOnId}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={link.isFree ? 'bg-emerald-100 text-emerald-800' : ''}
                    >
                      {link.isFree ? 'Free' : formatPrice(addOn?.price ?? 0)}
                    </Badge>
                    <Badge variant="outline">
                      {link.isOptional ? 'Optional' : 'Included'}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Free</Label>
                    <Switch
                      checked={link.isFree}
                      onCheckedChange={(checked) =>
                        setSchedulingAddOnFree('category', category.id, link.addOnId, checked)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveLink(index, index - 1)}
                    aria-label="Move add-on up"
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={index === links.length - 1}
                    onClick={() => moveLink(index, index + 1)}
                    aria-label="Move add-on down"
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => unlinkSchedulingAddOn('category', category.id, link.addOnId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="mt-3 w-full justify-between">
            Link add-on
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search add-ons..." />
            <CommandList>
              <CommandEmpty>No add-ons available.</CommandEmpty>
              <CommandGroup>
                {availableToLink.map((addOn) => (
                  <CommandItem
                    key={addOn.id}
                    value={addOn.name}
                    onSelect={() => {
                      linkSchedulingAddOn('category', category.id, addOn.id, false)
                      setPickerOpen(false)
                    }}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    {addOn.name}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatPrice(addOn.price)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
