/** Dynamic store page grouped by product type and category sections. */
'use client'

import { use, useMemo } from 'react'
import { notFound, redirect } from 'next/navigation'

import { CustomerFooter } from '@/components/customer/footer'
import { HorizontalScrollSection } from '@/components/customer/horizontal-scroll-section'
import { CustomerNavbar } from '@/components/customer/navbar'
import { PromoLinkGridSection } from '@/components/customer/promo-link-grid-section'
import { ScrollableSectionBreadcrumbs } from '@/components/customer/scrollable-section-breadcrumbs'
import { CafeStoreProductCard } from '@/components/customer/cafe-store-product-card'
import { SchedulingProductMenuRails } from '@/components/customer/scheduling-product-menu-rails'
import { ShopProductCard } from '@/components/customer/shop-product-card'
import { useClients } from '@/lib/client-store'
import { useCafe } from '@/lib/cafe-store'
import {
  cafeProductIdsForInventoryCategory,
  filterCafeProducts,
  isCafeCatalogProductId,
  mergedCafeProductsForCustomer,
} from '@/lib/cafe-utils'
import { useInventory } from '@/lib/inventory-store'
import {
  buildProductCategoryById,
  filterConsumerVisibleCategoriesForMenu,
  hasConsumerVisibleProductType,
  isConsumerVisibleProduct,
  isConsumerVisibleProductCategory,
  isShopCatalogVisibleProduct,
  isShopCatalogVisibleProductCategory,
} from '@/lib/product-visibility'
import { buildSchedulingSectionsForProductMenu } from '@/lib/scheduling-product-menu-sections'
import {
  buildSchedulingMenuBrowseCrumbsFromPageOrder,
  schedulingProductMenuRailsCrumbs,
} from '@/lib/scheduling-menu-browse'
import type { SchedulingMenuBrowseCrumb } from '@/lib/scheduling-menu-browse'
import { hasConsumerSchedulingOnProductMenu } from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import type { ProductCategory } from '@/lib/types'

interface StoreTypePageProps {
  readonly params: Promise<{
    slug: string
  }>
}

interface CategorySection {
  readonly category: ProductCategory
  readonly productIds: readonly string[]
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  shop: 'Shop',
  gifts: 'Gifts',
  rentals: 'Rentals',
  'cafe&food': 'Cafe & Food',
}

const CAFE_SERVICE_LINK_ITEMS = [
  {
    id: 'cafe-take-out',
    title: 'Take Out',
    imageUrl: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&q=80',
    href: '/store/cafe-food#take-out-party',
  },
  {
    id: 'cafe-delivery-catering',
    title: 'Delivery / Catering',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    href: '/rentals#we-bring-play-to-you',
  },
] as const

function fromSlug(value: string): string {
  if (value === 'cafe-food') {
    return 'cafe&food'
  }
  return value
}

export default function StoreTypePage({ params }: Readonly<StoreTypePageProps>) {
  const resolvedParams = use(params)
  const { products, productCategories } = useInventory()
  const { categories: schedulingCategories, services, slots, packages } = useScheduling()
  const { membershipPlans } = useClients()
  const { cafeProducts, attributeGroups } = useCafe()
  const productType = fromSlug(resolvedParams.slug)
  if (productType === 'rentals') {
    redirect('/rentals')
  }
  const categoryById = useMemo(
    () => buildProductCategoryById(productCategories),
    [productCategories],
  )

  const hasProducts = hasConsumerVisibleProductType(productType, productCategories)
  const hasScheduling = hasConsumerSchedulingOnProductMenu(
    productType,
    schedulingCategories,
    productCategories,
  )
  if (!hasProducts && !hasScheduling) {
    notFound()
  }

  const isShopStore = productType === 'shop'
  const isCategoryVisible = isShopStore
    ? isShopCatalogVisibleProductCategory
    : isConsumerVisibleProductCategory
  const isProductVisible = isShopStore
    ? isShopCatalogVisibleProduct
    : isConsumerVisibleProduct

  const sections = useMemo<CategorySection[]>(() => {
    const categoriesForType = filterConsumerVisibleCategoriesForMenu(
      productType,
      productCategories,
      isCategoryVisible,
    )
    const categoriesById = new Map(categoriesForType.map((category) => [category.id, category]))
    const rootCategoryIds = new Set(
      categoriesForType.filter((category) => category.parentId === null).map((category) => category.id),
    )
    const displayCategories = categoriesForType.filter(
      (category) => category.parentId !== null || rootCategoryIds.size === 0,
    )

    return displayCategories
      .map((category) => {
        const directProducts = products
          .filter(
            (product) =>
              isProductVisible(product, categoryById) &&
              product.categoryId === category.id,
          )
          .map((product) => product.id)
        const childProducts = products
          .filter((product) => {
            if (!isProductVisible(product, categoryById)) {
              return false
            }
            const childCategory = categoriesById.get(product.categoryId)
            return childCategory?.parentId === category.id
          })
          .map((product) => product.id)
        const productIds = directProducts.length > 0 ? directProducts : childProducts
        return { category, productIds }
      })
      .filter((section) => section.productIds.length > 0)
  }, [categoryById, isShopStore, productCategories, productType, products])

  const title = PRODUCT_TYPE_LABELS[productType] ?? productType
  const isCafeAndFood = productType === 'cafe&food'
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const customerCafeProducts = useMemo(
    () => mergedCafeProductsForCustomer(cafeProducts, products, productCategories),
    [cafeProducts, productCategories, products],
  )
  const cafeProductById = useMemo(
    () => new Map(customerCafeProducts.map((product) => [product.id, product])),
    [customerCafeProducts],
  )
  const cafeDisplayCategories = useMemo(() => {
    if (!isCafeAndFood) {
      return [] as ProductCategory[]
    }
    const categoriesForType = filterConsumerVisibleCategoriesForMenu(
      productType,
      productCategories,
      isConsumerVisibleProductCategory,
    )
    const rootCategoryIds = new Set(
      categoriesForType
        .filter((category) => category.parentId === null)
        .map((category) => category.id),
    )
    return categoriesForType.filter(
      (category) => category.parentId !== null || rootCategoryIds.size === 0,
    )
  }, [isCafeAndFood, productCategories, productType])

  const cafeSections = useMemo(() => {
    if (!isCafeAndFood) return []
    const today = new Date().getDay()
    const eligible = filterCafeProducts(customerCafeProducts, today)
    const eligibleIdSet = new Set(
      [...eligible.visible, ...eligible.soldOut].map((product) => product.id),
    )
    const categoriesById = new Map(productCategories.map((category) => [category.id, category]))

    return cafeDisplayCategories
      .map((category) => {
        const directProducts = products
          .filter(
            (product) =>
              isConsumerVisibleProduct(product, categoryById) &&
              product.categoryId === category.id &&
              isCafeCatalogProductId(product.id),
          )
          .map((product) => product.id)
        const childProducts = products
          .filter((product) => {
            if (!isConsumerVisibleProduct(product, categoryById)) {
              return false
            }
            if (!isCafeCatalogProductId(product.id)) {
              return false
            }
            const childCategory = categoriesById.get(product.categoryId)
            return childCategory?.parentId === category.id
          })
          .map((product) => product.id)
        const inventoryIds = directProducts.length > 0 ? directProducts : childProducts
        const cafeStoreIds = cafeProductIdsForInventoryCategory(
          category.id,
          eligible.visible,
          productCategories,
        )
        const soldOutCafeIds = cafeProductIdsForInventoryCategory(
          category.id,
          eligible.soldOut,
          productCategories,
        )
        const productIds = [
          ...new Set([...inventoryIds, ...cafeStoreIds, ...soldOutCafeIds]),
        ].filter((productId) => eligibleIdSet.has(productId))

        return {
          id: category.id,
          category: category.name,
          slug: category.slug || category.id,
          productIds,
        }
      })
      .filter((section) => section.productIds.length > 0)
  }, [
    cafeDisplayCategories,
    categoryById,
    customerCafeProducts,
    isCafeAndFood,
    productCategories,
    products,
  ])

  const schedulingSections = useMemo(
    () =>
      buildSchedulingSectionsForProductMenu({
        productType,
        productCategories,
        schedulingCategories,
        services,
        slots,
        packages,
        plans: membershipPlans,
      }),
    [
      membershipPlans,
      productCategories,
      productType,
      packages,
      schedulingCategories,
      services,
      slots,
    ],
  )

  const breadcrumbItems = useMemo((): SchedulingMenuBrowseCrumb[] => {
    const schedulingCrumbs = schedulingProductMenuRailsCrumbs(schedulingSections)
    if (isCafeAndFood) {
      const cafeCrumbs = cafeSections.map((section) => ({
        id: section.id,
        label: section.category,
        href: `#${section.slug}`,
      }))
      return buildSchedulingMenuBrowseCrumbsFromPageOrder([
        ...schedulingCrumbs,
        ...cafeCrumbs,
      ])
    }
    const productCrumbs = sections.map((section) => ({
      id: section.category.id,
      label: section.category.name,
      href: `#${section.category.slug || section.category.id}`,
    }))
    return buildSchedulingMenuBrowseCrumbsFromPageOrder([
      ...schedulingCrumbs,
      ...productCrumbs,
    ])
  }, [cafeSections, isCafeAndFood, schedulingSections, sections])

  const hasStoreContent =
    sections.length > 0 ||
    schedulingSections.length > 0 ||
    (isCafeAndFood && cafeSections.length > 0)

  return (
    <>
      <CustomerNavbar />
      <main>
        <section className="bg-primary py-14 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Store</p>
            <h1
              className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl"
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Explore curated categories with a smoother browsing experience.
            </p>
          </div>
        </section>

        <section className="bg-background py-10">
          <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
            {!hasStoreContent ? (
                  <div className="rounded-xl border border-border bg-card p-10 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      No products available right now.
                    </p>
                  </div>
                ) : isCafeAndFood ? (
                  <>
                    <section className="space-y-4">
                      <h2 className="text-2xl font-black text-foreground">
                        Browse {title.toLowerCase()} categories
                      </h2>
                      <ScrollableSectionBreadcrumbs items={breadcrumbItems} />
                    </section>
                    <SchedulingProductMenuRails productType={productType} />
                    {cafeSections.map((section) => (
                      <div key={section.id} id={section.slug} className="scroll-mt-32">
                        <HorizontalScrollSection
                          title={section.category}
                          description="Cafe & Food"
                          viewAllHref={`/cafe/${section.slug}`}
                        >
                          {section.productIds.map((productId) => {
                            const product = cafeProductById.get(productId) ?? null
                            if (!product) return null
                            return (
                              <div
                                key={product.id}
                                className="w-[280px] shrink-0 snap-start sm:w-[300px]"
                              >
                                <CafeStoreProductCard
                                  product={product}
                                  className="h-full"
                                />
                              </div>
                            )
                          })}
                        </HorizontalScrollSection>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <section className="space-y-4">
                      <h2 className="text-2xl font-black text-foreground">
                        Browse {title.toLowerCase()} categories
                      </h2>
                      <ScrollableSectionBreadcrumbs items={breadcrumbItems} />
                    </section>
                    <SchedulingProductMenuRails productType={productType} />
                    {sections.map((section) => (
                      <div
                        key={section.category.id}
                        id={section.category.slug || section.category.id}
                        className="scroll-mt-32"
                      >
                        <HorizontalScrollSection
                          title={section.category.name}
                          description={section.category.description}
                          viewAllHref={`/shop?category=${section.category.id}`}
                        >
                          {section.productIds.map((productId) => {
                            const product = productById.get(productId)
                            if (!product) {
                              return null
                            }
                            return (
                              <div
                                key={product.id}
                                className="w-[280px] shrink-0 snap-start sm:w-[300px]"
                              >
                                <ShopProductCard product={product} className="h-full" />
                              </div>
                            )
                          })}
                        </HorizontalScrollSection>
                      </div>
                    ))}
                  </>
                )}

            {productType === 'cafe&food' ? (
              <PromoLinkGridSection
                eyebrow="Services"
                title="Take Out & Delivery"
                description="Need cafe items for an event? Choose pickup or full delivery and catering support."
                items={CAFE_SERVICE_LINK_ITEMS}
              />
            ) : null}
          </div>
        </section>
      </main>
      <CustomerFooter />
    </>
  )
}
