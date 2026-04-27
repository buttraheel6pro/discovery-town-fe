/** Manage linked add-ons for an existing scheduling category. */
'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, MoveDown, MoveUp } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { samplePreschoolAddOns } from '@/lib/mock-data'
import { useInventory } from '@/lib/inventory-store'
import { useScheduling } from '@/lib/scheduling-store'
import { bookingAddOnToSchedulingAddOn, formatPrice } from '@/lib/utils'
import {
  CATEGORY_ADD_ON_CHARGE_FREQUENCIES,
  type CategoryAddOnChargeFrequency,
  type SchedulingServiceAddOn,
} from '@/lib/types'

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
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [pendingAddOnId, setPendingAddOnId] = useState('')
  const [linkAddOnId, setLinkAddOnId] = useState('')
  const [linkAddOnName, setLinkAddOnName] = useState('')
  const [linkAddOnQuantity, setLinkAddOnQuantity] = useState('1')
  const [linkAddOnUnitPrice, setLinkAddOnUnitPrice] = useState('')
  const [linkAddOnChargeFrequency, setLinkAddOnChargeFrequency] =
    useState<CategoryAddOnChargeFrequency>('ONE_TIME')

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

  const selectedLinkAddOn = useMemo(() => {
    if (!linkAddOnId) return null
    return addOnCatalog.find((entry) => entry.id === linkAddOnId) ?? null
  }, [addOnCatalog, linkAddOnId])

  function beginLinkAddOnFlow(addOn: SchedulingServiceAddOn): void {
    setLinkAddOnId(addOn.id)
    setLinkAddOnName(addOn.name)
    setLinkAddOnQuantity('1')
    setLinkAddOnUnitPrice(String(Number(addOn.price.toFixed(2))))
    setLinkAddOnChargeFrequency('ONE_TIME')
    setLinkModalOpen(true)
  }

  function openLinkModalFromPendingSelection(): void {
    if (!pendingAddOnId) return
    const addOn = addOnCatalog.find((entry) => entry.id === pendingAddOnId)
    if (!addOn) return
    beginLinkAddOnFlow(addOn)
  }

  function confirmLinkAddOnFlow(): void {
    if (!linkAddOnId) return
    const quantity = Number.parseInt(linkAddOnQuantity, 10)
    const unitPrice = Number.parseFloat(linkAddOnUnitPrice)
    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice)) {
      return
    }
    linkSchedulingAddOn('category', category.id, linkAddOnId, linkAddOnName, false, {
      quantity,
      unitPrice,
      chargeFrequency: linkAddOnChargeFrequency,
    })
    setLinkModalOpen(false)
    setLinkAddOnId('')
    setLinkAddOnName('')
    setPendingAddOnId('')
  }

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
                    {link.quantity != null ? (
                      <Badge variant="outline">{`Qty ${link.quantity}`}</Badge>
                    ) : null}
                    {link.unitPrice != null ? (
                      <Badge variant="outline">{`£${link.unitPrice}`}</Badge>
                    ) : null}
                    {link.chargeFrequency ? (
                      <Badge variant="outline">
                        {
                          CATEGORY_ADD_ON_CHARGE_FREQUENCIES.find(
                            (option) => option.value === link.chargeFrequency,
                          )?.label
                        }
                      </Badge>
                    ) : null}
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

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between sm:flex-1">
              {pendingAddOnId
                ? (addOnCatalog.find((entry) => entry.id === pendingAddOnId)?.name ?? 'Link add-on')
                : 'Link add-on'}
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
                        setPendingAddOnId(addOn.id)
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
        <Button
          type="button"
          variant="outline"
          onClick={openLinkModalFromPendingSelection}
          disabled={!pendingAddOnId}
        >
          Add
        </Button>
      </div>

      <CrudModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        title="Link add-on"
        description={
          selectedLinkAddOn
            ? `Configure how "${selectedLinkAddOn.name}" is priced for this category.`
            : 'Configure add-on pricing before linking.'
        }
        size="sm"
        variant="create"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmLinkAddOnFlow}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Add-on</Label>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm font-medium">
              {selectedLinkAddOn?.name ?? 'Select an add-on first'}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-link-addon-quantity">Quantity</Label>
            <Input
              id="category-link-addon-quantity"
              type="number"
              min={1}
              value={linkAddOnQuantity}
              onChange={(event) => setLinkAddOnQuantity(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-link-addon-price">Price</Label>
            <Input
              id="category-link-addon-price"
              type="number"
              min={0}
              step="0.01"
              value={linkAddOnUnitPrice}
              onChange={(event) => setLinkAddOnUnitPrice(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Charge frequency</Label>
            <Select
              value={linkAddOnChargeFrequency}
              onValueChange={(value) =>
                setLinkAddOnChargeFrequency(value as CategoryAddOnChargeFrequency)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ADD_ON_CHARGE_FREQUENCIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CrudModal>
    </div>
  )
}
