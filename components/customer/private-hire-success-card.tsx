/** Success state after private hire enquiry submission. */

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrivateHireEventType } from '@/lib/utils'
import type { PrivateHireInquiry } from '@/lib/types'

export interface PrivateHireSuccessCardProps {
  readonly inquiry: PrivateHireInquiry
}

export function PrivateHireSuccessCard({
  inquiry,
}: Readonly<PrivateHireSuccessCardProps>) {
  const when = (() => {
    try {
      return format(parseISO(inquiry.preferredDate), 'EEE d MMM yyyy, h:mm a')
    } catch {
      return inquiry.preferredDate
    }
  })()

  return (
    <Card className="border-border shadow-lg">
      <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
        <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" aria-hidden />
        <div>
          <h3
            className="text-xl font-black text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            Enquiry submitted!
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            We&apos;ll be in touch within 24 hours.
          </p>
        </div>
        <p className="font-mono text-xs bg-muted rounded-md px-2 py-1 inline-block">
          Ref: {inquiry.id}
        </p>
        <div className="text-left text-sm space-y-1 rounded-lg border border-border p-4 bg-muted/30">
          <p>
            <span className="text-muted-foreground">Event: </span>
            <span className="font-medium">{formatPrivateHireEventType(inquiry.eventType)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">When: </span>
            <span className="font-medium">{when}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Guests: </span>
            <span className="font-medium">{inquiry.guestCount}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Venue: </span>
            <span className="font-medium">{inquiry.locationName}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button variant="outline" asChild>
            <Link href="/account/private-hire">View my enquiries</Link>
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
