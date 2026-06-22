/**
 * Page-level batch loader for scheduling section services.
 *
 * Fires one parallel fetch per category on mount (all at once) instead of
 * N independent per-section hooks. Works for any page (play, gym, etc.) —
 * just pass whatever categories array that page uses.
 *
 * Load-more is per-section and triggered either by clicking the "Load more"
 * button or (when autoLoadMore is wired in HorizontalScrollSection) by the
 * button scrolling into view.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchServicesByCategory } from '@/lib/api/scheduling.api'
import { isApiEnabled } from '@/lib/config/data-source'
import { useAppDispatch } from '@/lib/redux/hooks'
import { upsertSchedulingServices } from '@/lib/redux/slices/scheduling-slice'
import type { SchedulingCategory, SchedulingService } from '@/lib/types'

const PAGE_SIZE = 10

export interface SectionPageData {
  services: SchedulingService[]
  hasMore: boolean
  page: number
  isLoading: boolean
  isLoadingMore: boolean
}

interface UseCatalogPageServicesResult {
  sectionMap: Map<string, SectionPageData>
  loadMore: (categoryId: string) => void
}

export function useCatalogPageServices(
  categories: readonly SchedulingCategory[],
): UseCatalogPageServicesResult {
  const dispatch = useAppDispatch()
  const [sectionMap, setSectionMap] = useState<Map<string, SectionPageData>>(new Map())

  const categoryMapRef = useRef<Map<string, SchedulingCategory>>(new Map())
  const fetchingRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    for (const cat of categories) {
      categoryMapRef.current.set(cat.id, cat)
    }
  }, [categories])

  // Batch-fetch all categories' page 1 in parallel the first time categories are available.
  useEffect(() => {
    if (!isApiEnabled || initializedRef.current || categories.length === 0) return
    initializedRef.current = true

    setSectionMap(
      new Map(
        categories.map((c) => [
          c.id,
          { services: [], hasMore: false, page: 1, isLoading: true, isLoadingMore: false },
        ]),
      ),
    )

    Promise.allSettled(
      categories.map((c) => fetchServicesByCategory(c.id, 1, PAGE_SIZE, categoryMapRef.current)),
    ).then((results) => {
      const fetchedServices: SchedulingService[] = []
      setSectionMap(() => {
        const next = new Map<string, SectionPageData>()
        results.forEach((result, i) => {
          const catId = categories[i]!.id
          if (result.status === 'fulfilled') {
            fetchedServices.push(...result.value.services)
            next.set(catId, {
              services: result.value.services,
              hasMore: result.value.hasMore,
              page: 1,
              isLoading: false,
              isLoadingMore: false,
            })
          } else {
            next.set(catId, {
              services: [],
              hasMore: false,
              page: 1,
              isLoading: false,
              isLoadingMore: false,
            })
          }
        })
        return next
      })
      if (fetchedServices.length > 0) {
        dispatch(upsertSchedulingServices(fetchedServices))
      }
    })
  }, [categories, dispatch])

  const loadMore = useCallback((categoryId: string) => {
    if (!isApiEnabled || fetchingRef.current.has(categoryId)) return

    setSectionMap((prev) => {
      const section = prev.get(categoryId)
      if (!section || !section.hasMore || section.isLoadingMore) return prev

      fetchingRef.current.add(categoryId)

      const next = new Map(prev)
      next.set(categoryId, { ...section, isLoadingMore: true })

      fetchServicesByCategory(categoryId, section.page + 1, PAGE_SIZE, categoryMapRef.current)
        .then((result) => {
          if (result.services.length > 0) {
            dispatch(upsertSchedulingServices(result.services))
          }
          setSectionMap((p) => {
            const s = p.get(categoryId)
            if (!s) return p
            const n = new Map(p)
            n.set(categoryId, {
              services: [...s.services, ...result.services],
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
  }, [dispatch])

  return { sectionMap, loadMore }
}
