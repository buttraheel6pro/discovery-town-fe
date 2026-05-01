/** Global Redux provider for client-side app state. */
'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import {
  inventoryStateForLocalStorage,
  setLocalStorageJson,
} from '@/lib/browser-local-storage-json'
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

    setLocalStorageJson(SCHEDULING_STORAGE_KEY, scheduling)
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

    const wroteFullState = setLocalStorageJson(INVENTORY_STORAGE_KEY, inventory)
    if (wroteFullState) {
      return
    }
    setLocalStorageJson(INVENTORY_STORAGE_KEY, inventoryStateForLocalStorage(inventory))
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
