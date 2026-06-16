/** Learn admin services list — filtered view of tutoring and enrichment programs. */
'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatLearningFormat,
  formatProgramTermLabel,
  isLearnSchedulingService,
} from '@/lib/learn-catalog'
import { useScheduling } from '@/lib/scheduling-store'
import { formatPrice } from '@/lib/utils'

export default function AdminLearnServicesPage() {
  const { services } = useScheduling()

  const learnServices = services
    .filter((service) => isLearnSchedulingService(service))
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Learn programs</h1>
          <p className="mt-2 text-muted-foreground">
            Manage tutoring, test prep, and enrichment services.
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground">
          <Link href="/admin/learn/services/new">
            <Plus className="mr-2 h-4 w-4" />
            New program
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All programs ({learnServices.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {learnServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/admin/learn/services/new?serviceId=${service.id}`}
                  className="font-semibold text-foreground hover:text-accent"
                >
                  {service.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {service.category.name} · {service.subjectArea ?? '—'} ·{' '}
                  {formatLearningFormat(service.learningFormat)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {formatProgramTermLabel(service.programTerm, service.programYear)}
                </Badge>
                <Badge variant="secondary">{formatPrice(service.basePrice)}/session</Badge>
                <Badge variant={service.isActive ? 'default' : 'secondary'}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          ))}
          {learnServices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No learn programs found.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
