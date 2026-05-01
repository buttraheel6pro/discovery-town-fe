/** Admin actions for rental order lifecycle transitions. */
'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInventory } from '@/lib/inventory-store'
import type { Order } from '@/lib/types'

interface RentalActionsPanelProps {
  readonly order: Order
}

export function RentalActionsPanel({ order }: Readonly<RentalActionsPanelProps>) {
  const {
    confirmRentalOrder,
    markRentalOut,
    markRentalReturned,
    reportRentalDamage,
  } = useInventory()
  const [capturedAmount, setCapturedAmount] = useState(order.depositCapturedAmount ?? 0)
  const [damageNotes, setDamageNotes] = useState(order.damageNotes ?? '')

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">Rental actions</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <Button variant="outline" onClick={() => confirmRentalOrder(order.id)}>
          Confirm
        </Button>
        <Button variant="outline" onClick={() => markRentalOut(order.id)}>
          Mark Out
        </Button>
        <Button variant="outline" onClick={() => markRentalReturned(order.id)}>
          Mark Returned
        </Button>
      </div>

      <div className="space-y-2 rounded-md border border-border p-3">
        <Label htmlFor="damage-capture">Damage capture amount</Label>
        <Input
          id="damage-capture"
          type="number"
          min={0}
          value={capturedAmount}
          onChange={(event) => setCapturedAmount(Number(event.target.value))}
        />
        <Label htmlFor="damage-notes">Damage notes</Label>
        <Input
          id="damage-notes"
          value={damageNotes}
          onChange={(event) => setDamageNotes(event.target.value)}
        />
        <Button
          variant="destructive"
          onClick={() => reportRentalDamage(order.id, capturedAmount, damageNotes)}
        >
          Report Damage
        </Button>
      </div>
    </div>
  )
}
