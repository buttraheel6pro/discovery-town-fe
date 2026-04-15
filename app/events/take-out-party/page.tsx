/** Take Out Party page with local item selection and grouped cart submission. */
'use client'

import { useMemo, useState } from 'react'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { ProminentSectionContainer } from '@/components/customer/prominent-section-container'
import { SelectableProductCard } from '@/components/customer/selectable-product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useInventory } from '@/lib/inventory-store'
import { formatPrice } from '@/lib/utils'

export default function TakeOutPartyPage() {
  const { addCustomCartItem, productCategories, products } = useInventory()
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})
  const [fulfillment, setFulfillment] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [zipCode, setZipCode] = useState('')
  const [address, setAddress] = useState('')

  const takeOutCategoryIds = useMemo(() => {
    const root = productCategories.find((category) => category.id === 'pcat-takeout-party')
    if (!root) {
      return new Set<string>()
    }
    const ids = new Set<string>([root.id])
    const queue = [root.id]
    while (queue.length > 0) {
      const currentId = queue.shift()
      const children = productCategories.filter((category) => category.parentId === currentId)
      for (const child of children) {
        ids.add(child.id)
        queue.push(child.id)
      }
    }
    return ids
  }, [productCategories])

  const takeOutProducts = useMemo(
    () => products.filter((product) => product.isActive && takeOutCategoryIds.has(product.categoryId)),
    [products, takeOutCategoryIds],
  )

  const sections = useMemo(() => {
    const categories = productCategories
      .filter((category) => category.parentId === 'pcat-takeout-party')
      .sort((left, right) => left.displayOrder - right.displayOrder)
    return categories.map((category) => ({
      id: category.id,
      title: category.name,
      description: category.description ?? 'Party-ready picks for this category.',
      products: takeOutProducts.filter((product) => product.categoryId === category.id),
    }))
  }, [productCategories, takeOutProducts])

  const selectedProducts = useMemo(
    () =>
      takeOutProducts
        .filter((product) => Number.isFinite(selectedQuantities[product.id]) && selectedQuantities[product.id] > 0)
        .map((product) => ({
          product,
          quantity: selectedQuantities[product.id],
        })),
    [selectedQuantities, takeOutProducts],
  )

  const subtotal = useMemo(
    () => selectedProducts.reduce((sum, entry) => sum + (entry.product.memberPrice ?? entry.product.price) * entry.quantity, 0),
    [selectedProducts],
  )
  const deliveryFee = fulfillment === 'DELIVERY' && zipCode.trim().length >= 4 ? 12 : 0
  const total = subtotal + deliveryFee

  function toggleSelected(productId: string) {
    setSelectedQuantities((prev) => {
      if (prev[productId]) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: 1 }
    })
  }

  function updateSelectedQuantity(productId: string, quantity: number) {
    const nextQuantity = Math.max(1, quantity)
    setSelectedQuantities((prev) => ({ ...prev, [productId]: nextQuantity }))
  }

  function removeSelected(productId: string) {
    setSelectedQuantities((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  function addToCartBundle() {
    if (selectedProducts.length === 0) {
      return
    }
    const selectedSummary = selectedProducts
      .map((entry) => `${entry.product.name} x${entry.quantity}`)
      .join(', ')
    const details = [
      `Fulfillment: ${fulfillment}`,
      fulfillment === 'DELIVERY' && zipCode ? `ZIP: ${zipCode}` : null,
      fulfillment === 'DELIVERY' && address ? `Address: ${address}` : null,
      `Items: ${selectedSummary}`,
    ]
      .filter(Boolean)
      .join('\n')

    addCustomCartItem({
      type: 'booking',
      name: 'Add To The Party Items',
      description: details,
      price: total,
      quantity: 1,
      imageUrl: '/placeholder.jpg',
      metadata: {
        requestType: 'TAKE_OUT_PARTY',
        fulfillment,
        zipCode,
        address,
        selectedItems: selectedSummary,
      },
    })

    setSelectedQuantities({})
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
              Party Essentials
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              TAKE OUT PARTY
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/70">
              Select items first, adjust quantities, then add one complete party bundle to cart.
            </p>
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-[2fr_1fr]">
            <section className="space-y-6">
              {sections.map((section) => (
                <HorizontalScrollSection
                  key={section.id}
                  title={section.title}
                  description={section.description}
                >
                  {section.products.map((product) => (
                    <div key={product.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
                      <SelectableProductCard
                        product={product}
                        selected={Boolean(selectedQuantities[product.id])}
                        onToggle={() => toggleSelected(product.id)}
                      />
                    </div>
                  ))}
                </HorizontalScrollSection>
              ))}
            </section>

            <aside>
              <ProminentSectionContainer className="sticky top-24">
                <h2 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-barlow)' }}>
                  Cart & checkout
                </h2>

                <div className="mt-4 space-y-3">
                  {selectedProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No items selected yet. Use “Select item” on the cards.
                    </p>
                  ) : (
                    selectedProducts.map((entry) => (
                      <div key={entry.product.id} className="rounded-lg border border-border bg-background p-3">
                        <p className="text-sm font-semibold text-foreground">{entry.product.name}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={entry.quantity}
                            onChange={(event) =>
                              updateSelectedQuantity(
                                entry.product.id,
                                Number.parseInt(event.target.value || '1', 10),
                              )
                            }
                            className="h-9 w-24"
                          />
                          <Button variant="ghost" size="sm" onClick={() => removeSelected(entry.product.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <Label>Fulfillment</Label>
                    <RadioGroup
                      value={fulfillment}
                      onValueChange={(value) => setFulfillment(value as 'PICKUP' | 'DELIVERY')}
                      className="mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="takeout-pickup" value="PICKUP" />
                        <Label htmlFor="takeout-pickup">Pickup</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="takeout-delivery" value="DELIVERY" />
                        <Label htmlFor="takeout-delivery">Delivery</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {fulfillment === 'DELIVERY' ? (
                    <div className="space-y-2">
                      <Label htmlFor="takeout-zip">ZIP code</Label>
                      <Input
                        id="takeout-zip"
                        value={zipCode}
                        onChange={(event) => setZipCode(event.target.value)}
                      />
                      <Label htmlFor="takeout-address">Delivery address</Label>
                      <Input
                        id="takeout-address"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-black">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  className="mt-5 w-full"
                  disabled={selectedProducts.length === 0}
                  onClick={addToCartBundle}
                >
                  Add to cart
                </Button>
              </ProminentSectionContainer>
            </aside>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
