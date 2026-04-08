/** Account private hire list — mock user emma@example.com. */
'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'

import { PrivateHireStatusBadge } from '@/components/admin/private-hire-status-badge'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCalendar } from '@/lib/calendar-store'
import { formatPrivateHireEventType } from '@/lib/utils'

const DEMO_EMAIL = 'emma@example.com'

function formatWhen(iso: string): string {
  try {
    return format(parseISO(iso), 'EEE d MMM yyyy, h:mm a')
  } catch {
    return iso
  }
}

export function AccountPrivateHireClient() {
  const { inquiries } = useCalendar()
  const mine = inquiries.filter((i) => i.contactEmail === DEMO_EMAIL)

  return (
    <>
      <CustomerNavbar />
      <main className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                My private hire enquiries
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Status updates for venue hire requests submitted with {DEMO_EMAIL}.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account">Back to dashboard</Link>
            </Button>
          </div>

          {mine.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-sm text-muted-foreground">No enquiries yet.</p>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                  <Link href="/private-hire">Make an enquiry</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-4">
              {mine.map((i) => (
                <li key={i.id}>
                  <Card>
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">
                          {formatPrivateHireEventType(i.eventType)}
                        </p>
                        <PrivateHireStatusBadge status={i.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preferred: {formatWhen(i.preferredDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">Guests: {i.guestCount}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatWhen(i.submittedAt)} · Ref {i.id}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
