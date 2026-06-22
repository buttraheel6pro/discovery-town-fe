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

import { CartAddedToastListener } from '@/components/customer/cart-added-toast-listener'
import {
  extractProductCategoryImageMap,
  extractSchedulingCategoryImageMap,
  getLocalStorageJson,
  inventoryStateForLocalStorage,
  mergeProductCategoryImages,
  mergeSchedulingCategoryImages,
  PRODUCT_CATEGORY_IMAGE_STORAGE_KEY,
  SCHEDULING_CATEGORY_IMAGE_STORAGE_KEY,
  schedulingStateForLocalStorage,
  setLocalStorageJson,
} from '@/lib/browser-local-storage-json'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import {
  hydrateInventoryState,
  INVENTORY_STORAGE_KEY,
  selectInventoryState,
  updateProductCategory,
  type InventoryState,
} from '@/lib/redux/slices/inventory-slice'
import {
  hydrateSchedulingSessionState,
  hydrateSchedulingState,
  loadSchedulingCatalog,
  setBookingsFromApi,
  SCHEDULING_STORAGE_KEY,
  selectSchedulingState,
  updateCategory,
  type SchedulingState,
} from '@/lib/redux/slices/scheduling-slice'
import { store } from '@/lib/redux/store'
import { isAdminApiReady } from '@/lib/api/client'
import { isApiEnabled, isMockDataEnabled } from '@/lib/config/data-source'

const InventoryHydrationContext = createContext(false)

/** True after inventory state has been loaded from localStorage (or confirmed absent). */
export function useInventoryHydrated(): boolean {
  return useContext(InventoryHydrationContext)
}

interface AppStoreProviderProps {
  readonly children: ReactNode
}

/**
 * Loads scheduling catalog data from the real API once on mount.
 * Only runs when API mode is active (mocks off + URL + tenant configured).
 */
function SchedulingApiLoader() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isApiEnabled) return

    dispatch(loadSchedulingCatalog()).catch(() => {
      // API not reachable — catalog stays empty in API mode
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

/**
 * Hydrates admin bookings from GET /bookings when an admin JWT is present.
 */
function SchedulingOperationalLoader() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isAdminApiReady()) return

    void import('@/lib/api/bookings.api')
      .then(({ listBookings, mapApiBooking }) =>
        listBookings({ limit: 100 }).then((rows) => {
          dispatch(setBookingsFromApi(rows.map((row) => mapApiBooking(row))))
        }),
      )
      .catch(() => {
        // Admin bookings stay on local/session state when the API is unreachable
      })
  }, [dispatch])

  return null
}

const SCHEDULING_PERSIST_DEBOUNCE_MS = 400
const INVENTORY_PERSIST_DEBOUNCE_MS = 400

function SchedulingPersistenceBridge() {
  const dispatch = useAppDispatch()
  const scheduling = useAppSelector(selectSchedulingState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const parsed = getLocalStorageJson<SchedulingState>(SCHEDULING_STORAGE_KEY)
    const categoryImages = getLocalStorageJson<Record<string, string>>(
      SCHEDULING_CATEGORY_IMAGE_STORAGE_KEY,
    )
    if (parsed) {
      const hydratedState: SchedulingState = {
        ...parsed,
        categories: mergeSchedulingCategoryImages(parsed.categories ?? [], categoryImages),
      }
      if (isMockDataEnabled()) {
        dispatch(hydrateSchedulingState(hydratedState))
      } else if (isApiEnabled) {
        dispatch(
          hydrateSchedulingSessionState({
            bookings: parsed.bookings ?? [],
            slots: parsed.slots ?? [],
            waitlist: parsed.waitlist ?? [],
          }),
        )
      }
    }
    setHydrated(true)
  }, [dispatch])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    const imageMap = getLocalStorageJson<Record<string, string>>(
      SCHEDULING_CATEGORY_IMAGE_STORAGE_KEY,
    )
    if (!imageMap || Object.keys(imageMap).length === 0) {
      return
    }

    for (const category of scheduling.categories) {
      const localImage = imageMap[category.id]
      if (localImage && !category.imageUrl?.trim()) {
        dispatch(
          updateCategory({
            categoryId: category.id,
            patch: { imageUrl: localImage },
          }),
        )
      }
    }
  }, [dispatch, hydrated, scheduling.categories])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (isMockDataEnabled()) {
        setLocalStorageJson(SCHEDULING_STORAGE_KEY, schedulingStateForLocalStorage(scheduling))
      }
      setLocalStorageJson(
        SCHEDULING_CATEGORY_IMAGE_STORAGE_KEY,
        extractSchedulingCategoryImageMap(scheduling.categories),
      )
    }, SCHEDULING_PERSIST_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
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
    const categoryImages = getLocalStorageJson<Record<string, string>>(
      PRODUCT_CATEGORY_IMAGE_STORAGE_KEY,
    )
    if (parsed && isMockDataEnabled()) {
      dispatch(
        hydrateInventoryState({
          ...parsed,
          productCategories: mergeProductCategoryImages(
            parsed.productCategories ?? [],
            categoryImages,
          ),
        }),
      )
    }
    setHydrated(true)
  }, [dispatch])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    const imageMap = getLocalStorageJson<Record<string, string>>(
      PRODUCT_CATEGORY_IMAGE_STORAGE_KEY,
    )
    if (!imageMap || Object.keys(imageMap).length === 0) {
      return
    }

    for (const category of inventory.productCategories) {
      const localImage = imageMap[category.id]
      if (localImage && !category.imageUrl?.trim()) {
        dispatch(
          updateProductCategory({
            id: category.id,
            patch: { imageUrl: localImage },
          }),
        )
      }
    }
  }, [dispatch, hydrated, inventory.productCategories])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (isMockDataEnabled()) {
        const wroteFullState = setLocalStorageJson(INVENTORY_STORAGE_KEY, inventory)
        if (!wroteFullState) {
          setLocalStorageJson(INVENTORY_STORAGE_KEY, inventoryStateForLocalStorage(inventory))
        }
      }
      setLocalStorageJson(
        PRODUCT_CATEGORY_IMAGE_STORAGE_KEY,
        extractProductCategoryImageMap(inventory.productCategories),
      )
    }, INVENTORY_PERSIST_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
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
        <SchedulingApiLoader />
        <SchedulingOperationalLoader />
        <CartAddedToastListener />
        {children}
      </InventoryHydrationProvider>
    </Provider>
  )
}
