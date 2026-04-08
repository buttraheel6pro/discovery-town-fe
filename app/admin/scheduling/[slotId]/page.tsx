/** Admin scheduling slot detail — roster, waitlist, and slot details. */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { use } from 'react'

import { CapacityRing } from '@/components/admin/capacity-ring'
import { PublishStatusBadge } from '@/components/admin/publish-status-badge'
import { RosterTable } from '@/components/admin/roster-table'
import { SlotStatusBadge } from '@/components/admin/slot-status-badge'
import { WaitlistPanel } from '@/components/admin/waitlist-panel'
import { ServiceTypeBadge } from '@/components/customer/service-type-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { LABELS } from '@/lib/constants/ui-labels'
import { useScheduling } from '@/lib/scheduling-store'
import { formatSlotDate, formatSlotTimeRange, formatPrice } from '@/lib/utils'
import type { SchedulingSlot } from '@/lib/types'

export default function AdminSchedulingSlotPage({
  params,
}: Readonly<{ params: Promise<{ slotId: string }> }>) {
  const { slotId } = use(params)
  const { slots, publishSlot, draftSlot } = useScheduling()
  const { toast } = useToast()

  const slot = useMemo<SchedulingSlot | undefined>(() => {
    return slots.find((s) => s.id === slotId)
  }, [slotId, slots])

  if (!slot) {
    return (
      <div className="space-y-4">
        <p className="text-2xl font-bold text-muted-foreground">{LABELS.serviceSlot} not found</p>
        <Link href="/admin/scheduling" className="text-accent font-semibold">
          Back to {LABELS.serviceSlots}
        </Link>
      </div>
    )
  }

  const activeSlot = slot
  const isPublished = activeSlot.isActive !== false

  function togglePublish() {
    if (isPublished) {
      draftSlot(activeSlot.id)
      toast({ title: 'Set to draft' })
      return
    }
    publishSlot(activeSlot.id)
    toast({ title: 'Published' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{activeSlot.service.name}</h1>
            <ServiceTypeBadge serviceType={activeSlot.service.serviceType} />
            <PublishStatusBadge isActive={isPublished} />
            <SlotStatusBadge status={activeSlot.status} />
          </div>
          <p className="text-muted-foreground">
            {formatSlotDate(activeSlot.startAt)} ·{' '}
            {formatSlotTimeRange(activeSlot.startAt, activeSlot.endAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className={
              isPublished
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-green-600 text-white hover:bg-green-600/90'
            }
            onClick={togglePublish}
          >
            {isPublished ? 'Set to Draft' : 'Publish'}
          </Button>
          <Button variant="outline" disabled>
            Edit
          </Button>
            <Button variant="outline" className="text-destructive border-destructive" disabled>
            Cancel {LABELS.serviceSlot}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between gap-6 flex-wrap">
          <CapacityRing booked={slot.bookedCount} capacity={slot.effectiveCapacity} size="lg" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Price
            </p>
            <p className="text-2xl font-black text-foreground">
              {formatPrice(slot.effectivePrice)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="roster">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-4">
          <RosterTable slotId={slot.id} />
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4">
          <WaitlistPanel slotId={slot.id} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">{LABELS.serviceSlot} details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Instructor
                </p>
                <p className="font-semibold mt-1">{slot.staffName ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Location
                </p>
                <p className="font-semibold mt-1">{slot.locationId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Capacity
                </p>
                <p className="font-semibold mt-1">{slot.effectiveCapacity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notes
                </p>
                <p className="font-semibold mt-1">{slot.notes ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

