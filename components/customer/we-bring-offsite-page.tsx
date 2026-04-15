/** Shared off-site request page used by party and play variants. */
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useInventory } from '@/lib/inventory-store'
import { formatPrice } from '@/lib/utils'

interface WeBringOffsitePageProps {
  readonly pageEyebrow: string
  readonly pageTitle: string
  readonly pageDescription: string
  readonly equipmentSectionTitle: string
  readonly equipmentSectionDescription: string
  readonly bundleName: string
  readonly requestType: string
  readonly productIds: readonly string[]
  readonly eventTypeOptions: readonly string[]
}

export function WeBringOffsitePage({
  pageEyebrow,
  pageTitle,
  pageDescription,
  equipmentSectionTitle,
  equipmentSectionDescription,
  bundleName,
  requestType,
  productIds,
  eventTypeOptions,
}: Readonly<WeBringOffsitePageProps>) {
  const { addCustomCartItem, products } = useInventory()
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})
  const [date, setDate] = useState('')
  const [address, setAddress] = useState('')
  const [guestCount, setGuestCount] = useState('20')
  const [eventType, setEventType] = useState(eventTypeOptions[0] ?? 'Birthday')
  const [notes, setNotes] = useState('')

  const equipment = useMemo(
    () =>
      products.filter(
        (product) => product.isActive && productIds.includes(product.id),
      ),
    [products, productIds],
  )
  const travelFee = useMemo(() => {
    if (address.trim().length < 5) {
      return 0
    }
    return 25 + Math.min(40, Math.floor(address.trim().length / 3))
  }, [address])

  const selectedProducts = useMemo(
    () =>
      equipment
        .filter(
          (product) =>
            Number.isFinite(selectedQuantities[product.id]) && selectedQuantities[product.id] > 0,
        )
        .map((product) => ({
          product,
          quantity: selectedQuantities[product.id],
        })),
    [equipment, selectedQuantities],
  )
  const equipmentTotal = useMemo(
    () =>
      selectedProducts.reduce(
        (sum, entry) =>
          sum + (entry.product.memberPrice ?? entry.product.price) * entry.quantity,
        0,
      ),
    [selectedProducts],
  )
  const total = equipmentTotal + travelFee

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

  function addInquiryBundleToCart() {
    if (selectedProducts.length === 0) {
      return
    }
    const selectedSummary = selectedProducts
      .map((entry) => `${entry.product.name} x${entry.quantity}`)
      .join(', ')
    const details = [
      `Event type: ${eventType}`,
      `Date: ${date || 'TBD'}`,
      `Address: ${address || 'TBD'}`,
      `Guests: ${guestCount}`,
      `Notes: ${notes || 'None'}`,
      `Items: ${selectedSummary}`,
    ].join('\n')

    addCustomCartItem({
      type: 'booking',
      name: bundleName,
      description: details,
      price: total,
      quantity: 1,
      imageUrl: '/placeholder.jpg',
      metadata: {
        requestType,
        date,
        address,
        guestCount,
        eventType,
        notes,
        selectedItems: selectedSummary,
        travelFee,
      },
    })

    setSelectedQuantities({})
    setDate('')
    setAddress('')
    setGuestCount('20')
    setEventType(eventTypeOptions[0] ?? 'Birthday')
    setNotes('')
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">
              {pageEyebrow}
            </p>
            <h1
              className="text-balance text-4xl font-black text-white sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/70">
              {pageDescription}
            </p>
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto grid max-w-[90rem] gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section>
              <HorizontalScrollSection
                title={equipmentSectionTitle}
                description={equipmentSectionDescription}
              >
                {equipment.map((item) => (
                  <div key={item.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
                    <SelectableProductCard
                      product={item}
                      selected={Boolean(selectedQuantities[item.id])}
                      onToggle={() => toggleSelected(item.id)}
                    />
                  </div>
                ))}
              </HorizontalScrollSection>
            </section>

            <aside className="w-full lg:min-w-[340px]">
              <ProminentSectionContainer className="top-24 lg:sticky">
                <h2
                  className="text-xl font-black text-foreground"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  Cart & inquiry
                </h2>

                <div className="mt-4 space-y-3">
                  {selectedProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No equipment selected yet. Use &quot;Select item&quot; on the cards.
                    </p>
                  ) : (
                    selectedProducts.map((entry) => (
                      <div
                        key={entry.product.id}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {entry.product.name}
                        </p>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelected(entry.product.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  <Label htmlFor="webring-date">Event date</Label>
                  <Input
                    id="webring-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                  <Label htmlFor="webring-address">Address</Label>
                  <Input
                    id="webring-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                  <Label htmlFor="webring-guests">Guest count</Label>
                  <Input
                    id="webring-guests"
                    type="number"
                    min={1}
                    value={guestCount}
                    onChange={(event) => setGuestCount(event.target.value)}
                  />
                  <Label>Event type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="webring-notes">Notes</Label>
                  <Textarea
                    id="webring-notes"
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>

                <div className="mt-5 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Equipment</span>
                    <span>{formatPrice(equipmentTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel fee</span>
                    <span>{formatPrice(travelFee)}</span>
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
                  onClick={addInquiryBundleToCart}
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
