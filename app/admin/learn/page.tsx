/** Learn admin dashboard — KPIs and active tutoring / test prep programs. */
'use client'

import Link from 'next/link'
import { BookOpen, Calendar, GraduationCap, Users } from 'lucide-react'

import { KpiCard } from '@/components/admin/kpi-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatLearningFormat,
  formatProgramTermLabel,
  isLearnSchedulingService,
} from '@/lib/learn-catalog'
import { useScheduling } from '@/lib/scheduling-store'

export default function AdminLearnPage() {
  const { services, slots, bookings } = useScheduling()

  const learnServices = services.filter((service) => isLearnSchedulingService(service))
  const activePrograms = learnServices.filter((service) => service.isActive)

  const now = Date.now()
  const weekEnd = now + 7 * 24 * 60 * 60 * 1000
  const upcomingThisWeek = slots.filter((slot) => {
    if (!learnServices.some((service) => service.id === slot.serviceId)) {
      return false
    }
    const start = new Date(slot.startAt).getTime()
    return start >= now && start <= weekEnd && slot.status !== 'CANCELLED'
  }).length

  const learnBookings = bookings.filter((booking) =>
    learnServices.some((service) => service.id === booking.serviceId),
  )
  const enrolledStudents = learnBookings.filter(
    (booking) => booking.status === 'CONFIRMED' || booking.status === 'COMPLETED',
  ).length

  const revenueMtd = learnBookings
    .filter((booking) => {
      const created = new Date(booking.createdAt)
      const nowDate = new Date()
      return (
        created.getMonth() === nowDate.getMonth() &&
        created.getFullYear() === nowDate.getFullYear() &&
        booking.status !== 'CANCELLED'
      )
    })
    .reduce((sum, booking) => sum + booking.totalAmount, 0)

  const rows = activePrograms.map((service) => {
    const serviceSlots = slots
      .filter(
        (slot) =>
          slot.serviceId === service.id &&
          slot.status !== 'CANCELLED' &&
          new Date(slot.startAt).getTime() >= now,
      )
      .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
    const nextSlot = serviceSlots[0]
    const enrolled = serviceSlots.reduce((sum, slot) => sum + slot.bookedCount, 0)

    return {
      service,
      nextSession: nextSlot
        ? new Date(nextSlot.startAt).toLocaleString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : '—',
      enrolled,
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Learn</h1>
          <p className="mt-2 text-muted-foreground">
            Tutoring, test prep, and enrichment program overview.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/learn/services">All programs</Link>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground">
            <Link href="/admin/learn/services/new">New program</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active programs"
          value={activePrograms.length}
          icon={BookOpen}
        />
        <KpiCard
          label="Sessions this week"
          value={upcomingThisWeek}
          icon={Calendar}
        />
        <KpiCard
          label="Enrolled students"
          value={enrolledStudents}
          icon={Users}
        />
        <KpiCard
          label="Revenue MTD"
          value={revenueMtd}
          icon={GraduationCap}
          valueIsCurrency
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active learn programs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Program</th>
                <th className="pb-3 pr-4 font-medium">Grade</th>
                <th className="pb-3 pr-4 font-medium">Subject</th>
                <th className="pb-3 pr-4 font-medium">Format</th>
                <th className="pb-3 pr-4 font-medium">Term</th>
                <th className="pb-3 pr-4 font-medium">Enrolled</th>
                <th className="pb-3 font-medium">Next session</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ service, nextSession, enrolled }) => (
                <tr key={service.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/learn/services/new?serviceId=${service.id}`}
                      className="font-semibold text-foreground hover:text-accent"
                    >
                      {service.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {service.gradeLevel ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {service.subjectArea ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {formatLearningFormat(service.learningFormat)}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {formatProgramTermLabel(service.programTerm, service.programYear)}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {enrolled} / {service.capacity}
                  </td>
                  <td className="py-3 text-muted-foreground">{nextSession}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active learn programs yet.{' '}
              <Link href="/admin/learn/services/new" className="text-accent underline">
                Create one
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/learn/services/new?serviceType=TUTORING_SESSION">
            New tutoring program
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/learn/services/new?serviceType=TEST_PREP">
            New test prep bootcamp
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/learn/services/new?serviceType=ENRICHMENT_CLASS">
            New enrichment class
          </Link>
        </Button>
      </div>
    </div>
  )
}
