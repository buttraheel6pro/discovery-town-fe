/** Waitlist panel — admin management of waitlist entries per slot. */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useScheduling } from '@/lib/scheduling-store'
import { cn } from '@/lib/utils'
import type { WaitlistStatus } from '@/lib/types'

const statusStyles: Record<WaitlistStatus, string> = {
  WAITING: 'bg-amber-100 text-amber-700',
  NOTIFIED: 'bg-purple-100 text-purple-700',
  CONVERTED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-slate-100 text-slate-700',
  REMOVED: 'bg-red-100 text-red-700',
}

export function WaitlistPanel({ slotId }: Readonly<{ slotId: string }>) {
  const { waitlist, promoteWaitlist, removeFromWaitlist } = useScheduling()

  const entries = waitlist
    .filter((e) => e.serviceSlotId === slotId)
    .slice()
    .sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">
          Waitlist ({entries.length})
        </p>
        <Button variant="outline" size="sm" onClick={() => promoteWaitlist(slotId)}>
          Promote Next
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No one on the waitlist.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-5 pb-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {e.position}. {e.contactName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Joined {new Date(e.createdAt).toLocaleString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full',
                      statusStyles[e.status] ?? 'bg-secondary text-foreground',
                    )}
                  >
                    {e.status}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/5"
                    onClick={() => removeFromWaitlist(e.id)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

