/** Admin scheduling recurring page — create multiple sessions from one rule. */

'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { SlotRecurringForm } from '@/components/admin/slot-recurring-form'
import { Button } from '@/components/ui/button'

function AdminSchedulingRecurringNewPageInner() {
  const searchParams = useSearchParams()
  const initialServiceId = searchParams.get('serviceId')?.trim() ?? ''
  const rawReturnTo = searchParams.get('returnTo')?.trim() ?? '/admin/scheduling'
  const returnTo = rawReturnTo.startsWith('/admin/') ? rawReturnTo : '/admin/scheduling'

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-3">
        <Link href={returnTo}>
          <Button type="button" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Recurring series</h1>
        <p className="mt-2 text-muted-foreground">
          Create multiple sessions from a single recurrence rule.
        </p>
      </div>
      <SlotRecurringForm initialServiceId={initialServiceId} returnTo={returnTo} />
    </div>
  )
}

export default function AdminSchedulingRecurringNewPage() {
  return (
    <Suspense>
      <AdminSchedulingRecurringNewPageInner />
    </Suspense>
  )
}
