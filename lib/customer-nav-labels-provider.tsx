/** React context for admin-overridable customer navbar labels and visibility. */
'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  clearPersistedCustomerNavLabels,
  persistCustomerNavSettings,
  readPersistedCustomerNavSettings,
} from '@/lib/client-customer-nav-labels-storage'
import {
  diffCustomerNavHiddenOverrides,
  diffCustomerNavLabelOverrides,
  resolveCustomerNavHidden,
  resolveCustomerNavLabels,
  type CustomerNavHiddenOverrides,
  type CustomerNavLabelKey,
  type CustomerNavLabelOverrides,
} from '@/lib/customer-nav-labels'

export interface CustomerNavSettingsInput {
  labels: Record<CustomerNavLabelKey, string>
  hidden: Record<CustomerNavLabelKey, boolean>
}

interface CustomerNavLabelsContextValue {
  labels: Record<CustomerNavLabelKey, string>
  hidden: Record<CustomerNavLabelKey, boolean>
  settingsLoaded: boolean
  labelOverrides: CustomerNavLabelOverrides
  hiddenOverrides: CustomerNavHiddenOverrides
  saveNavSettings: (settings: CustomerNavSettingsInput) => boolean
  resetNavSettings: () => boolean
}

const CustomerNavLabelsContext = createContext<CustomerNavLabelsContextValue | null>(null)

export function CustomerNavLabelsProvider({ children }: { readonly children: ReactNode }) {
  const [labelOverrides, setLabelOverrides] = useState<CustomerNavLabelOverrides>({})
  const [hiddenOverrides, setHiddenOverrides] = useState<CustomerNavHiddenOverrides>({})
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useLayoutEffect(() => {
    const persisted = readPersistedCustomerNavSettings()
    if (persisted != null) {
      setLabelOverrides(persisted.labels ?? {})
      setHiddenOverrides(persisted.hidden ?? {})
    }
    setSettingsLoaded(true)
  }, [])

  const labels = useMemo(() => resolveCustomerNavLabels(labelOverrides), [labelOverrides])
  const hidden = useMemo(() => resolveCustomerNavHidden(hiddenOverrides), [hiddenOverrides])

  const saveNavSettings = useCallback((settings: CustomerNavSettingsInput) => {
    const nextLabelOverrides = diffCustomerNavLabelOverrides(settings.labels)
    const nextHiddenOverrides = diffCustomerNavHiddenOverrides(settings.hidden)
    const ok = persistCustomerNavSettings({
      labels: nextLabelOverrides,
      hidden: nextHiddenOverrides,
    })
    if (ok) {
      setLabelOverrides(nextLabelOverrides)
      setHiddenOverrides(nextHiddenOverrides)
    }
    return ok
  }, [])

  const resetNavSettings = useCallback(() => {
    const ok = clearPersistedCustomerNavLabels()
    if (ok) {
      setLabelOverrides({})
      setHiddenOverrides({})
    }
    return ok
  }, [])

  const value = useMemo(
    () => ({
      labels,
      hidden,
      settingsLoaded,
      labelOverrides,
      hiddenOverrides,
      saveNavSettings,
      resetNavSettings,
    }),
    [
      labels,
      hidden,
      settingsLoaded,
      labelOverrides,
      hiddenOverrides,
      saveNavSettings,
      resetNavSettings,
    ],
  )

  return (
    <CustomerNavLabelsContext.Provider value={value}>
      {children}
    </CustomerNavLabelsContext.Provider>
  )
}

export function useCustomerNavLabelsContext(): CustomerNavLabelsContextValue {
  const context = useContext(CustomerNavLabelsContext)
  if (!context) {
    throw new Error('useCustomerNavLabels must be used within CustomerNavLabelsProvider')
  }
  return context
}
