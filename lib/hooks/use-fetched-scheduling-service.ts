/** Fetches a scheduling service by id from the API for consumer detail pages. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchServiceById } from '@/lib/api/scheduling.api'
import { isApiEnabled } from '@/lib/config/data-source'
import { useAppDispatch } from '@/lib/redux/hooks'
import { upsertSchedulingServices } from '@/lib/redux/slices/scheduling-slice'
import {
  buildSchedulingCategoryById,
  isConsumerVisibleSchedulingService,
  isCurrentCatalogService,
} from '@/lib/scheduling-visibility'
import { useScheduling } from '@/lib/scheduling-store'
import type { SchedulingService } from '@/lib/types'

export function resolveConsumerDetailSchedulingService(
  storeService: SchedulingService | undefined,
  fetchedService: SchedulingService | undefined,
): SchedulingService | undefined {
  if (!isApiEnabled) {
    return storeService
  }
  if (storeService && isCurrentCatalogService(storeService.id)) {
    return storeService
  }
  return fetchedService ?? storeService
}

export interface UseFetchedSchedulingServiceResult {
  readonly fetchedService: SchedulingService | undefined
  readonly isFetching: boolean
}

export function useFetchedSchedulingService(
  serviceId: string,
): UseFetchedSchedulingServiceResult {
  const dispatch = useAppDispatch()
  const { categories } = useScheduling()
  const [fetchedService, setFetchedService] = useState<SchedulingService | undefined>()
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (!isApiEnabled || !serviceId) {
      setFetchedService(undefined)
      setIsFetching(false)
      return
    }

    let cancelled = false
    setIsFetching(true)

    const categoryMap = buildSchedulingCategoryById(categories)

    fetchServiceById(serviceId, categoryMap)
      .then((service) => {
        if (cancelled) {
          return
        }
        if (service) {
          setFetchedService(service)
          dispatch(upsertSchedulingServices([service]))
        } else {
          setFetchedService(undefined)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedService(undefined)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [categories, dispatch, serviceId])

  return { fetchedService, isFetching }
}

export interface UseConsumerSchedulingServiceDetailResult {
  readonly service: SchedulingService | undefined
  readonly isLoading: boolean
}

export function useConsumerSchedulingServiceDetail(
  serviceId: string,
): UseConsumerSchedulingServiceDetailResult {
  const { services, categories } = useScheduling()
  const { fetchedService, isFetching } = useFetchedSchedulingService(serviceId)
  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const service = useMemo(() => {
    const storeService = services.find((entry) => entry.id === serviceId)
    const candidate = resolveConsumerDetailSchedulingService(storeService, fetchedService)
    if (!candidate) {
      return undefined
    }
    return isConsumerVisibleSchedulingService(candidate, categoryById) ? candidate : undefined
  }, [categoryById, fetchedService, serviceId, services])

  const isLoading = isApiEnabled && isFetching && service == null

  return { service, isLoading }
}
