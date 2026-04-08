/** Legacy slot URL — redirects to unified class detail for the slot's service. */
'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

import { useScheduling } from '@/lib/scheduling-store'

export default function SlotDetailRedirectPage({
  params,
}: Readonly<{ params: Promise<{ slotId: string }> }>) {
  const { slotId } = use(params)
  const router = useRouter()
  const { slots } = useScheduling()

  useEffect(() => {
    const slot = slots.find((s) => s.id === slotId)
    if (slot) {
      router.replace(`/classes/${slot.serviceId}?slot=${encodeURIComponent(slotId)}`)
    } else {
      router.replace('/classes')
    }
  }, [router, slotId, slots])

  return (
    <main className="py-24 text-center text-muted-foreground">
      <p>Redirecting…</p>
    </main>
  )
}
