'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAccessToken } from '@/lib/api/token-storage'
import { isApiEnabled } from '@/lib/api/client'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // If API is not configured, allow access (mock/demo mode)
    if (!isApiEnabled) {
      setReady(true)
      return
    }
    if (!getAccessToken()) {
      router.replace('/admin-login')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) return null
  return <>{children}</>
}
