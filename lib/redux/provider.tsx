/** Global Redux provider for client-side app state. */
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Provider } from 'react-redux'

import {
  getLocalStorageJson,
  inventoryStateForLocalStorage,
  setLocalStorageJson,
} from '@/lib/browser-local-storage-json'
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

const InventoryHydrationContext = createContext(false)

/** True after inventory state has been loaded from localStorage (or confirmed absent). */
export function useInventoryHydrated(): boolean {
  return useContext(InventoryHydrationContext)
}

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

    const parsed = getLocalStorageJson<SchedulingState>(SCHEDULING_STORAGE_KEY)
    if (parsed) {
      dispatch(hydrateSchedulingState(parsed))
    }
    setHydrated(true)
  }, [dispatch])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    setLocalStorageJson(SCHEDULING_STORAGE_KEY, scheduling)
  }, [hydrated, scheduling])

  return null
}

function InventoryHydrationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const dispatch = useAppDispatch()
  const inventory = useAppSelector(selectInventoryState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const parsed = getLocalStorageJson<InventoryState>(INVENTORY_STORAGE_KEY)
    if (parsed) {
      dispatch(hydrateInventoryState(parsed))
    }
    setHydrated(true)
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

  return (
    <InventoryHydrationContext.Provider value={hydrated}>
      {children}
    </InventoryHydrationContext.Provider>
  )
}

export function AppStoreProvider({ children }: AppStoreProviderProps) {
  return (
    <Provider store={store}>
      <InventoryHydrationProvider>
        <SchedulingPersistenceBridge />
        {children}
      </InventoryHydrationProvider>
    </Provider>
  )
}
