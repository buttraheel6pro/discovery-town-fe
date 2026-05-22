/** Cafe product detail & customiser — adds configured lines to the shared cart. */
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

import { CafeModifierGroup } from '@/components/customer/cafe-modifier-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  defaultModifierSelections,
  modifierGroupsForProduct,
  modifiersSatisfied,
  resolveAttributeOptionsForProduct,
  sumModifierDeltaForGroups,
  toCartModifierSelections,
} from '@/lib/cafe-utils'
import { useInventory } from '@/lib/inventory-store'
import { cn, formatPrice } from '@/lib/utils'
import type { AttributeGroup, CafeProduct, ModifierGroup } from '@/lib/types'

export interface CafeProductDetailClientProps {
  readonly product: CafeProduct
  readonly modifierGroups: ModifierGroup[]
  readonly attributeGroups: AttributeGroup[]
}

export function CafeProductDetailClient({
  product,
  modifierGroups,
  attributeGroups,
}: Readonly<CafeProductDetailClientProps>) {
  const { addCustomCartItem } = useInventory()

  const groups = useMemo(
    () => modifierGroupsForProduct(product, modifierGroups),
    [product, modifierGroups],
  )
  const chips = useMemo(
    () => resolveAttributeOptionsForProduct(product, attributeGroups),
    [product, attributeGroups],
  )

  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>(() =>
    defaultModifierSelections(groups),
  )
  const availableAttributeGroups = useMemo(
    () =>
      attributeGroups
        .map((group) => {
          const allowedIds = product.attributeGroups[group.id] ?? []
          const allowedOptions = group.options.filter((option) => allowedIds.includes(option.id))
          if (allowedOptions.length === 0) return null
          return { group, allowedOptions }
        })
        .filter(
          (
            row,
          ): row is {
            group: AttributeGroup
            allowedOptions: AttributeGroup['options']
          } => Boolean(row),
        ),
    [attributeGroups, product.attributeGroups],
  )
  const [selectedAttributesByGroup, setSelectedAttributesByGroup] = useState<Record<string, string[]>>({})

  const [quantity, setQuantity] = useState(1)
  const [customerNote, setCustomerNote] = useState('')
  const [showSelectionCards, setShowSelectionCards] = useState(false)

  useEffect(() => {
    setShowSelectionCards(false)
  }, [product.id])

  useEffect(() => {
    setSelectedByGroup(defaultModifierSelections(groups))
  }, [groups])

  useEffect(() => {
    const next: Record<string, string[]> = {}
    for (const row of availableAttributeGroups) {
      if (row.group.selectionType === 'single') {
        const first = row.allowedOptions[0]?.id
        next[row.group.id] = first ? [first] : []
      } else {
        next[row.group.id] = []
      }
    }
    setSelectedAttributesByGroup(next)
  }, [availableAttributeGroups])

  const modifierTotal = useMemo(
    () => sumModifierDeltaForGroups(groups, selectedByGroup),
    [groups, selectedByGroup],
  )

  const unitPrice = product.basePrice + modifierTotal
  const lineTotal = unitPrice * quantity
  const canAdd = modifiersSatisfied(groups, selectedByGroup)

  function updateGroupSelections(groupId: string, next: string[]) {
    setSelectedByGroup((prev) => ({ ...prev, [groupId]: next }))
  }

  function toggleAttributeSelection(
    group: AttributeGroup,
    optionId: string,
  ) {
    setSelectedAttributesByGroup((prev) => {
      const current = prev[group.id] ?? []
      if (group.selectionType === 'single') {
        return { ...prev, [group.id]: [optionId] }
      }
      const cap = Math.max(1, (group.maxSelect ?? group.options.length) || 1)
      if (!current.includes(optionId) && current.length >= cap) {
        return prev
      }
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...prev, [group.id]: next }
    })
  }

  function handleAddToCart() {
    if (!canAdd) return
    const selectedModifiers = toCartModifierSelections(groups, selectedByGroup)
    const selectedAttributes = availableAttributeGroups.flatMap((row) => {
      const selectedIds = selectedAttributesByGroup[row.group.id] ?? []
      return selectedIds
        .map((id) => row.allowedOptions.find((opt) => opt.id === id))
        .filter((opt): opt is NonNullable<typeof opt> => Boolean(opt))
        .map((opt) => ({
          groupName: row.group.name,
          optionLabel: opt.label,
        }))
    })
    addCustomCartItem({
      type: 'product',
      name: product.name,
      description: product.subtype?.trim() || 'Cafe item',
      price: unitPrice,
      quantity,
      imageUrl: product.imageUrl,
      subtypeLabel: product.subtype?.trim() || undefined,
      modifierTotal,
      selectedModifiers,
      preparationTimeMinutes: product.preparationTimeMinutes,
      metadata: {
        itemType: 'cafe',
        cafeProductId: product.id,
        selectedByGroup,
        selectedAttributes,
        customerNote: customerNote.trim() || undefined,
      },
    })
  }

  const prep = product.preparationTimeMinutes ?? 0
  const notes = product.notes?.trim() ?? ''
  const checkoutCard = (
    <div className="w-full rounded-xl border border-border bg-card p-5">
      <h3
        className="text-lg font-black text-foreground"
        style={{ fontFamily: 'var(--font-barlow)' }}
      >
        Cart & checkout
      </h3>
      <div className="mt-5 space-y-3">
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-background px-3 py-3 sm:gap-x-4 sm:px-4 sm:py-3.5"
          aria-label={`Cafe item: ${product.name}`}
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image
              src={product.imageUrl ?? '/placeholder.jpg'}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="shrink-0 tabular-nums">
            <p className="text-sm font-semibold text-foreground">{formatPrice(unitPrice)}</p>
            <p className="text-xs text-muted-foreground">each</p>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                disabled={quantity >= 10}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-right text-sm font-bold tabular-nums text-foreground">
              {formatPrice(lineTotal)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Total</span>
          <span className="font-bold tabular-nums text-foreground">{formatPrice(lineTotal)}</span>
        </div>
        <Button
          type="button"
          className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          disabled={!canAdd}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to cart
        </Button>
        {!canAdd ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Select required options before adding to cart.
          </p>
        ) : null}
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        'space-y-8',
        showSelectionCards && 'xl:pr-[460px] 2xl:pr-[480px]',
      )}
    >
      <div className="grid items-stretch gap-8 lg:grid-cols-2">
        <div>
          <div className="h-full rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl bg-muted">
              <Image
                src={product.imageUrl ?? '/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>

        <div>
          <Card className="h-full">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {product.category}
                </p>
                <h1
                  className="text-4xl font-black tracking-tight text-foreground"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  {product.name}
                </h1>
                {product.subtype?.trim() ? (
                  <div className="mt-2 inline-flex w-fit items-center rounded-md border border-border bg-muted/40 px-3 py-1.5">
                    <p className="text-sm font-semibold text-foreground">{product.subtype}</p>
                  </div>
                ) : null}
                {product.description?.trim() ? (
                  <p className="pt-2 text-sm font-normal leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                ) : null}
              </div>

              {chips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <Badge key={c.id} variant="secondary">
                      {c.emoji.trim().length > 0 ? `${c.emoji} ` : ''}
                      {c.label}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p
                    className="text-3xl font-black text-foreground"
                    style={{ fontFamily: 'var(--font-barlow)' }}
                  >
                    {formatPrice(product.basePrice)}
                  </p>
                </div>
                {prep > 0 ? (
                  <Badge variant="outline">Prep ~{prep} min</Badge>
                ) : null}
              </div>

              {notes.length > 0 ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  <p className="font-semibold text-foreground">About this item</p>
                  <p className="mt-1 text-muted-foreground">📝 {notes}</p>
                </div>
              ) : null}

              {!showSelectionCards ? (
                <Button
                  type="button"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setShowSelectionCards(true)}
                >
                  Select items
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {showSelectionCards ? (
        <Card>
          <CardContent className="space-y-6 p-6">
            <h2 className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
              Customise
            </h2>
            {groups.map((g) => (
              <CafeModifierGroup
                key={g.id}
                group={g}
                selectedIds={selectedByGroup[g.id] ?? []}
                onChange={(next) => updateGroupSelections(g.id, next)}
              />
            ))}
            {availableAttributeGroups
              .filter((row) => row.group.selectionType === 'single')
              .map((row) => (
                <div key={row.group.id} className="space-y-2 rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold text-foreground">{row.group.name}</p>
                  <div className="space-y-2">
                    {row.allowedOptions.map((option) => {
                      const selected = selectedAttributesByGroup[row.group.id]?.includes(option.id) ?? false
                      return (
                        <label key={option.id} className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            className="h-4 w-4 accent-primary"
                            checked={selected}
                            onChange={() => toggleAttributeSelection(row.group, option.id)}
                            name={`cafe-attr-${row.group.id}`}
                          />
                          <span>{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            {availableAttributeGroups.some((row) => row.group.selectionType === 'multiple') ? (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="space-y-3">
                  {availableAttributeGroups
                    .filter((row) => row.group.selectionType === 'multiple')
                    .map((row) => (
                      <div key={row.group.id} className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                          {row.group.name}
                        </p>
                        <div className="space-y-2">
                          {row.allowedOptions.map((option) => {
                            const selected =
                              selectedAttributesByGroup[row.group.id]?.includes(option.id) ?? false
                            return (
                              <label
                                key={option.id}
                                className="flex items-center gap-2 text-sm text-foreground"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-primary"
                                  checked={selected}
                                  onChange={() => toggleAttributeSelection(row.group, option.id)}
                                />
                                <span>{option.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="cafe-customer-note" className="text-sm font-semibold text-foreground">
                Notes
              </label>
              <Textarea
                id="cafe-customer-note"
                value={customerNote}
                onChange={(event) => setCustomerNote(event.target.value)}
                placeholder="Add notes for your order (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showSelectionCards ? (
        <div className="relative">
          <div className="mt-6 xl:hidden">{checkoutCard}</div>
          <div className="hidden xl:block">
            <div className="fixed right-[max(1rem,calc((100vw-88rem)/2+1rem))] top-30 z-40 w-[min(420px,calc(100vw-2rem))]">
              {checkoutCard}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
