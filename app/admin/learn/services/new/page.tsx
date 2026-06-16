/** Admin learn program create/edit page — purpose-built field set for tutoring. */
'use client'

import Link from 'next/link'
import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { LearnServiceForm } from '@/components/admin/learn-service-form'
import { Button } from '@/components/ui/button'
import { isLearnSchedulingService } from '@/lib/learn-catalog'
import { useScheduling } from '@/lib/scheduling-store'

function AdminLearnServiceNewPageInner() {
  const searchParams = useSearchParams()
  const { services } = useScheduling()
  const requestedServiceId = searchParams.get('serviceId')?.trim() ?? ''
  const requestedCategoryId = searchParams.get('categoryId')?.trim() ?? ''
  const requestedServiceType = searchParams.get('serviceType')?.trim() ?? ''
  const rawReturnTo = searchParams.get('returnTo')?.trim() ?? '/admin/learn/services'
  const returnTo = rawReturnTo.startsWith('/admin/') ? rawReturnTo : '/admin/learn/services'

  const editingService = useMemo(() => {
    if (!requestedServiceId) {
      return null
    }
    const found = services.find((entry) => entry.id === requestedServiceId) ?? null
    if (!found || !isLearnSchedulingService(found)) {
      return null
    }
    return found
  }, [requestedServiceId, services])

  return (
    <div className="w-full space-y-3">
      <div className="space-y-2">
        <Link href={returnTo}>
          <Button type="button" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {editingService ? 'Edit learn program' : 'New learn program'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {editingService
            ? 'Update program details and academic metadata.'
            : 'Create a tutoring, test prep, or enrichment program.'}
        </p>
      </div>

      <LearnServiceForm
        editingService={editingService}
        initialCategoryId={requestedCategoryId}
        initialServiceType={
          requestedServiceType === 'TUTORING_SESSION' ||
          requestedServiceType === 'TEST_PREP' ||
          requestedServiceType === 'ENRICHMENT_CLASS'
            ? requestedServiceType
            : undefined
        }
        returnTo={returnTo}
      />
    </div>
  )
}

export default function AdminLearnServiceNewPage() {
  return (
    <Suspense>
      <AdminLearnServiceNewPageInner />
    </Suspense>
  )
}
