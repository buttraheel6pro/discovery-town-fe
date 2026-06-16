/** Learn admin sub-categories — menu placement and catalog grouping like Gym / Play / Events. */
'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  patchSchedulingCategoryPlacement,
  productSubCategoryAppearsUnderMenuSlug,
  resolveCatalogMenuTarget,
} from '@/lib/catalog-placement'
import {
  CATALOG_MENU_ORDER,
  catalogSlugFromProductType,
  catalogSlugFromSchedulingCategoryId,
  getCatalogMenuLabel,
  isProductCatalogSlug,
  normalizeCatalogSlug,
  type CatalogSlug,
} from '@/lib/catalog-slugs'
import type { SchedulingCategory } from '@/lib/types'
import { useInventory } from '@/lib/inventory-store'
import { getSchedulingTopLevelId } from '@/lib/scheduling-consumer-categories'
import { useScheduling } from '@/lib/scheduling-store'

function resolveCategoryMenuSlug(category: SchedulingCategory): CatalogSlug {
  const placement = normalizeCatalogSlug(category.placementCatalogSlug ?? null)
  if (placement) {
    return placement
  }
  return catalogSlugFromSchedulingCategoryId(category.id)
}

export default function AdminLearnCategoriesPage() {
  const { categories, services, updateCategory } = useScheduling()
  const { productCategories } = useInventory()

  const productRootBySlug = useMemo(() => {
    const out: Record<string, string | undefined> = {}
    for (const root of productCategories.filter((row) => (row.parentId ?? null) === null)) {
      const slug = catalogSlugFromProductType(root.productType ?? 'shop')
      out[slug] = root.id
    }
    return out
  }, [productCategories])

  const learnSubCategories = useMemo(() => {
    return categories
      .filter((category) => getSchedulingTopLevelId(category.id) === 'LEARN')
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder)
  }, [categories])

  const serviceCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const service of services) {
      counts.set(service.categoryId, (counts.get(service.categoryId) ?? 0) + 1)
    }
    return counts
  }, [services])

  const productSubsOnLearnMenu = useMemo(() => {
    return productCategories
      .filter((category) => (category.parentId ?? null) !== null)
      .filter((category) =>
        productSubCategoryAppearsUnderMenuSlug(
          category,
          'learn',
          undefined,
          true,
        ),
      )
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder)
  }, [productCategories])

  function handleMenuPlacementChange(categoryId: string, menuSlug: CatalogSlug): void {
    const existing = categories.find((category) => category.id === categoryId)
    if (!existing) {
      return
    }
    const productRootId = isProductCatalogSlug(menuSlug)
      ? (productRootBySlug[menuSlug] ?? null)
      : null
    updateCategory(
      categoryId,
      patchSchedulingCategoryPlacement(
        existing,
        resolveCatalogMenuTarget({
          catalogSlug: menuSlug,
          productRootId,
        }),
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Learn sub-categories</h1>
          <p className="mt-2 text-muted-foreground">
            Group programs under Learn and control which customer menu each sub-category appears on.
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground">
          <Link
            href="/admin/scheduling/services/categories/new?topLevelId=LEARN&returnTo=/admin/learn/categories"
          >
            <Plus className="mr-2 h-4 w-4" />
            New sub-category
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sub-categories ({learnSubCategories.length})</CardTitle>
          <CardDescription>
            Category is always Learn. Use menu placement to list a sub-category under another
            catalog menu when needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {learnSubCategories.map((category) => {
            const menuSlug = resolveCategoryMenuSlug(category)
            const programCount = serviceCountByCategory.get(category.id) ?? 0
            return (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-foreground">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Learn · {programCount} program{programCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Menu placement</Label>
                    <Select
                      value={menuSlug}
                      onValueChange={(value) =>
                        handleMenuPlacementChange(category.id, value as CatalogSlug)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATALOG_MENU_ORDER.map((entry) => (
                          <SelectItem key={entry.slug} value={entry.slug}>
                            {entry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )
          })}
          {learnSubCategories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No Learn sub-categories yet.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {productSubsOnLearnMenu.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Product sub-categories on Learn menu</CardTitle>
            <CardDescription>
              Shop, gifts, rentals, and cafe sub-categories placed on the Learn customer menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {productSubsOnLearnMenu.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2"
              >
                <span className="text-sm font-medium text-foreground">{category.name}</span>
                <Badge variant="outline">{getCatalogMenuLabel('learn')}</Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Manage product sub-category placement from the service catalog sidebar (drag onto Learn
              or use Edit).
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
