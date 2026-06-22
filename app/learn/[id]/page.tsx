/** Learn program detail or category listing — routes `cat-*` to category pages. */
'use client'

import { use, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { ClassDetailContent } from '@/app/classes/[id]/page'
import { CustomerFooter } from '@/components/customer/footer'
import { CustomerNavbar } from '@/components/customer/navbar'
import { LearnCategoryRoutePage } from '@/components/customer/learn-category-route-page'
import { isLearnSchedulingService } from '@/lib/learn-catalog'
import { isLearnCategoryRouteParam } from '@/lib/learn-category-routes'
import { useScheduling } from '@/lib/scheduling-store'
import {
  buildSchedulingCategoryById,
  isConsumerVisibleSchedulingService,
} from '@/lib/scheduling-visibility'

interface LearnDetailPageProps {
  readonly params: Promise<{ readonly id: string }>
}

function LearnServiceDetailPage({ id }: Readonly<{ id: string }>) {
  const router = useRouter()
  const { services, categories } = useScheduling()

  const categoryById = useMemo(() => buildSchedulingCategoryById(categories), [categories])

  const service = useMemo(() => {
    const found = services.find((entry) => entry.id === id)
    if (!found || !isConsumerVisibleSchedulingService(found, categoryById)) {
      return null
    }
    if (!isLearnSchedulingService(found)) {
      return null
    }
    return found
  }, [categoryById, id, services])

  useEffect(() => {
    if (!service) {
      router.replace('/learn')
    }
  }, [router, service])

  if (!service) {
    return (
      <>
        <CustomerNavbar />
        <main className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">Program not found</p>
            <Link href="/learn" className="text-accent font-semibold">
              Back to Learn
            </Link>
          </div>
        </main>
        <CustomerFooter />
      </>
    )
  }

  return (
    <>
      <CustomerNavbar />
      <main>
        <ClassDetailContent service={service} />
      </main>
      <CustomerFooter />
    </>
  )
}

export default function LearnDetailPage({ params }: LearnDetailPageProps) {
  const { id } = use(params)

  if (isLearnCategoryRouteParam(id)) {
    return <LearnCategoryRoutePage categoryId={id} />
  }

  return <LearnServiceDetailPage id={id} />
}
