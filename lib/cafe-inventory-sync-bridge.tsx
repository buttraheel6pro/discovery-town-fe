/** Syncs cafe-store catalog into inventory so admin counts and store listings stay aligned. */
'use client'

import { useEffect, useRef } from 'react'

import { useCafe } from '@/lib/cafe-store'
import { useAppDispatch } from '@/lib/redux/hooks'
import { syncCafeCatalogProducts } from '@/lib/redux/slices/inventory-slice'
import { useInventory } from '@/lib/inventory-store'

export function CafeInventorySyncBridge() {
  const dispatch = useAppDispatch()
  const { cafeProducts } = useCafe()
  const { products, productCategories } = useInventory()
  const lastSignatureRef = useRef<string>('')

  useEffect(() => {
    if (cafeProducts.length === 0) {
      return
    }

    const productSignature = cafeProducts
      .map(
        (product) =>
          `${product.id}:${product.updatedAt}:${product.category}:${product.imageUrl ?? ''}`,
      )
      .sort()
      .join('|')
    const categorySignature = productCategories
      .filter((category) => (category.productType ?? '').toLowerCase() === 'cafe&food')
      .map((category) => `${category.id}:${category.name}`)
      .sort()
      .join('|')
    const signature = `${productSignature}::${categorySignature}`
    if (signature === lastSignatureRef.current) {
      return
    }
    lastSignatureRef.current = signature

    const tenantId = products[0]?.tenantId ?? 'tenant-1'
    dispatch(
      syncCafeCatalogProducts({
        cafeProducts,
        productCategories,
        tenantId,
      }),
    )
  }, [cafeProducts, dispatch, productCategories, products])

  return null
}
