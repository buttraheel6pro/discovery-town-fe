'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchGiftProductsByCategory } from '@/lib/api/gifts.api'
import { isApiEnabled } from '@/lib/api/client'
import type { GiftPublicProduct } from '@/lib/api/gifts.api'

const PAGE_SIZE = 10

export interface GiftSectionPageData {
  products: GiftPublicProduct[]
  hasMore: boolean
  page: number
  isLoading: boolean
  isLoadingMore: boolean
}

export interface GiftCategory {
  id: string
  name: string
  displayOrder?: number
}

interface UseGiftsPageProductsResult {
  sectionMap: Map<string, GiftSectionPageData>
  loadMore: (categoryId: string) => void
}

export function useGiftsPageProducts(
  categories: readonly GiftCategory[],
): UseGiftsPageProductsResult {
  const [sectionMap, setSectionMap] = useState<Map<string, GiftSectionPageData>>(new Map())

  const fetchingRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!isApiEnabled || initializedRef.current || categories.length === 0) return
    initializedRef.current = true

    setSectionMap(
      new Map(
        categories.map((c) => [
          c.id,
          { products: [], hasMore: false, page: 1, isLoading: true, isLoadingMore: false },
        ]),
      ),
    )

    Promise.allSettled(
      categories.map((c) => fetchGiftProductsByCategory(c.id, 1, PAGE_SIZE)),
    ).then((results) => {
      setSectionMap(() => {
        const next = new Map<string, GiftSectionPageData>()
        results.forEach((result, i) => {
          const catId = categories[i]!.id
          if (result.status === 'fulfilled') {
            next.set(catId, {
              products: result.value.products,
              hasMore: result.value.hasMore,
              page: 1,
              isLoading: false,
              isLoadingMore: false,
            })
          } else {
            next.set(catId, {
              products: [],
              hasMore: false,
              page: 1,
              isLoading: false,
              isLoadingMore: false,
            })
          }
        })
        return next
      })
    })
  }, [categories])

  const loadMore = useCallback((categoryId: string) => {
    if (!isApiEnabled || fetchingRef.current.has(categoryId)) return

    setSectionMap((prev) => {
      const section = prev.get(categoryId)
      if (!section || !section.hasMore || section.isLoadingMore) return prev

      fetchingRef.current.add(categoryId)

      const next = new Map(prev)
      next.set(categoryId, { ...section, isLoadingMore: true })

      fetchGiftProductsByCategory(categoryId, section.page + 1, PAGE_SIZE)
        .then((result) => {
          setSectionMap((p) => {
            const s = p.get(categoryId)
            if (!s) return p
            const n = new Map(p)
            n.set(categoryId, {
              products: [...s.products, ...result.products],
              hasMore: result.hasMore,
              page: result.page,
              isLoading: false,
              isLoadingMore: false,
            })
            fetchingRef.current.delete(categoryId)
            return n
          })
        })
        .catch(() => {
          setSectionMap((p) => {
            const s = p.get(categoryId)
            if (!s) return p
            const n = new Map(p)
            n.set(categoryId, { ...s, isLoadingMore: false })
            fetchingRef.current.delete(categoryId)
            return n
          })
        })

      return next
    })
  }, [])

  return { sectionMap, loadMore }
}
