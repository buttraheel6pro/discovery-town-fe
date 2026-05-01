/** Rentals landing page with category browsing and featured items. */
'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

import { RentalCategoryGrid } from '@/components/customer/rental-category-grid'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { RentalLandingHero } from '@/components/customer/rental-landing-hero'
import { useInventory } from '@/lib/inventory-store'

export default function RentalsLandingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">Loading rentals...</div>}>
      <RentalsLandingPageContent />
    </Suspense>
  )
}

function RentalsLandingPageContent() {
  const searchParams = useSearchParams()
  const hasSeededDemo = useRef(false)
  const {
    products,
    productCategories,
    cart,
    addToCart,
    setRentalDates,
    setFulfillmentMode,
    setDeliveryFee,
  } = useInventory()

  const categories = useMemo(
    () =>
      productCategories
        .filter((category) => category.productType === 'rentals' && category.parentId === 'pcat-rentals')
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [productCategories],
  )
  const rentalProducts = useMemo(
    () =>
      products
        .filter((product) => product.isActive && product.categoryId.startsWith('pcat-rentals-'))
        .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)),
    [products],
  )

  useEffect(() => {
    if (searchParams.get('demo') !== 'cart' || hasSeededDemo.current) {
      return
    }
    const demoProductIds = [
      'prod-rental-giant-jenga',
      'prod-rental-giant-connect-four',
      'prod-rental-popcorn-cart',
    ]
    for (const id of demoProductIds) {
      const product = products.find((entry) => entry.id === id)
      if (product) {
        addToCart({ product, quantity: 1 })
      }
    }
    if (cart.items.length === 0) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const iso = tomorrow.toISOString().slice(0, 16)
      setRentalDates(iso, iso)
      setFulfillmentMode('PICKUP')
      setDeliveryFee(0)
    }
    hasSeededDemo.current = true
  }, [
    addToCart,
    cart.items.length,
    products,
    searchParams,
    setDeliveryFee,
    setFulfillmentMode,
    setRentalDates,
  ])

  return (
    <>
      <CustomerNavbar />
      <main className="space-y-8 pb-10">
        <RentalLandingHero />
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <RentalCategoryGrid categories={categories} products={rentalProducts} />
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
