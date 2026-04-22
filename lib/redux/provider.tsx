/** Global Redux provider for client-side app state. */
'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import {
  hydrateInventoryState,
  INVENTORY_STORAGE_KEY,
  selectInventoryState,
  type InventoryState,
} from '@/lib/redux/slices/inventory-slice'
import {
  hydrateSchedulingState,
  SCHEDULING_STORAGE_KEY,
  selectSchedulingState,
  type SchedulingState,
} from '@/lib/redux/slices/scheduling-slice'
import { store } from '@/lib/redux/store'

interface AppStoreProviderProps {
  readonly children: ReactNode
}

function SchedulingPersistenceBridge() {
  const dispatch = useAppDispatch()
  const scheduling = useAppSelector(selectSchedulingState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const raw = window.localStorage.getItem(SCHEDULING_STORAGE_KEY)
    if (!raw) {
      setHydrated(true)
      return
    }

    try {
      const parsed = JSON.parse(raw) as SchedulingState
      dispatch(hydrateSchedulingState(parsed))
    } catch {
      // ignore malformed persisted payload and keep default state
    } finally {
      setHydrated(true)
    }
  }, [dispatch])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      SCHEDULING_STORAGE_KEY,
      JSON.stringify(scheduling),
    )
  }, [hydrated, scheduling])

  return null
}

function InventoryPersistenceBridge() {
  const dispatch = useAppDispatch()
  const inventory = useAppSelector(selectInventoryState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY)
    if (!raw) {
      setHydrated(true)
      return
    }

    try {
      const parsed = JSON.parse(raw) as InventoryState
      dispatch(hydrateInventoryState(parsed))
    } catch {
      // ignore malformed persisted payload and keep default state
    } finally {
      setHydrated(true)
    }
  }, [dispatch])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify(inventory),
    )
  }, [hydrated, inventory])

  return null
}

export function AppStoreProvider({ children }: AppStoreProviderProps) {
  return (
    <Provider store={store}>
      <InventoryPersistenceBridge />
      <SchedulingPersistenceBridge />
      {children}
    </Provider>
  )
}
