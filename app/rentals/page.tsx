/** Rentals landing page with category browsing and featured items. */
'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

import { SchedulingProductMenuRails } from '@/components/customer/scheduling-product-menu-rails'
import { RentalCategoryGrid } from '@/components/customer/rental-category-grid'
import { useClients } from '@/lib/client-store'
import { buildSchedulingSectionsForProductMenu } from '@/lib/scheduling-product-menu-sections'
import {
  buildSchedulingMenuBrowseCrumbsFromPageOrder,
  schedulingProductMenuRailsCrumbs,
} from '@/lib/scheduling-menu-browse'
import { hasConsumerSchedulingOnProductMenu } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { RentalLandingHero } from '@/components/customer/rental-landing-hero'
import { useInventory } from '@/lib/inventory-store'
import {
  buildProductCategoryById,
  filterConsumerVisibleCategoriesForMenu,
  isConsumerVisibleProduct,
  isConsumerVisibleProductCategory,
} from '@/lib/product-visibility'

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
  const { categories: schedulingCategories, services, slots, packages } = useScheduling()
  const { membershipPlans } = useClients()
  const {
    products,
    productCategories,
    cart,
    addToCart,
    setRentalDates,
    setFulfillmentMode,
    setDeliveryFee,
  } = useInventory()

  const categoryById = useMemo(
    () => buildProductCategoryById(productCategories),
    [productCategories],
  )

  const categories = useMemo(
    () =>
      filterConsumerVisibleCategoriesForMenu(
        'rentals',
        productCategories,
        (category, byId) =>
          (category.parentId ?? null) !== null &&
          isConsumerVisibleProductCategory(category, byId),
      ),
    [productCategories],
  )

  const rentalCategoryIds = useMemo(
    () => new Set(categories.map((category) => category.id)),
    [categories],
  )

  const rentalProducts = useMemo(
    () =>
      products
        .filter(
          (product) =>
            isConsumerVisibleProduct(product, categoryById) &&
            rentalCategoryIds.has(product.categoryId),
        )
        .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured)),
    [categoryById, products, rentalCategoryIds],
  )

  const schedulingSections = useMemo(
    () =>
      buildSchedulingSectionsForProductMenu({
        productType: 'rentals',
        productCategories,
        schedulingCategories,
        services,
        slots,
        packages,
        plans: membershipPlans,
      }),
    [
      membershipPlans,
      packages,
      productCategories,
      schedulingCategories,
      services,
      slots,
    ],
  )

  const rentalCategoriesOnPage = useMemo(
    () =>
      categories.filter((category) =>
        rentalProducts.some((product) => product.categoryId === category.id),
      ),
    [categories, rentalProducts],
  )

  const breadcrumbItems = useMemo(
    () =>
      buildSchedulingMenuBrowseCrumbsFromPageOrder([
        ...schedulingProductMenuRailsCrumbs(schedulingSections),
        ...rentalCategoriesOnPage.map((category) => ({
          id: category.id,
          label: category.name,
          href: `#${category.slug}`,
        })),
      ]),
    [rentalCategoriesOnPage, schedulingSections],
  )

  const showSchedulingRails = hasConsumerSchedulingOnProductMenu(
    'rentals',
    schedulingCategories,
    productCategories,
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
          {showSchedulingRails ? (
            <SchedulingProductMenuRails productType="rentals" />
          ) : null}
          <RentalCategoryGrid
            breadcrumbItems={breadcrumbItems}
            categories={categories}
            products={rentalProducts}
          />
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
