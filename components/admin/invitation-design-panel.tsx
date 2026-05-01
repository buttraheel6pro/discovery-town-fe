/** Invitation design workflow panel for invitation orders. */
'use client'

import { Button } from '@/components/ui/button'
import { useInventory } from '@/lib/inventory-store'
import type { Order } from '@/lib/types'

interface InvitationDesignPanelProps {
  readonly order: Order
}

export function InvitationDesignPanel({ order }: Readonly<InvitationDesignPanelProps>) {
  const { markInvitationDesignComplete } = useInventory()

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-semibold text-foreground">DESIGN PENDING</p>
      <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
        <p>Event name: {order.designBrief?.eventName ?? '—'}</p>
        <p>Theme: {order.designBrief?.theme ?? '—'}</p>
        <p>Date: {order.designBrief?.date ?? '—'}</p>
      </div>
      <Button onClick={() => markInvitationDesignComplete(order.id)}>Mark Design Complete</Button>
    </div>
  )
}
