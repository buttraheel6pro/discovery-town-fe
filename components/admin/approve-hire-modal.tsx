/** Approve private hire inquiry — deposit + internal notes. */
'use client'

import { useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCalendar } from '@/lib/calendar-store'
import type { PrivateHireInquiry } from '@/lib/types'

interface ApproveHireModalProps {
  readonly inquiry: PrivateHireInquiry
  readonly open: boolean
  readonly onClose: () => void
}

export function ApproveHireModal({
  inquiry,
  open,
  onClose,
}: Readonly<ApproveHireModalProps>) {
  const { approveInquiry } = useCalendar()
  const [deposit, setDeposit] = useState<string>('0')
  const [internalNotes, setInternalNotes] = useState<string>('')

  function handleConfirm() {
    const amount = Number.parseFloat(deposit)
    if (!Number.isFinite(amount) || amount < 0) return
    approveInquiry(inquiry.id, amount, internalNotes.trim())
    setDeposit('0')
    setInternalNotes('')
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
      title="Approve enquiry"
      description={`Confirm approval for ${inquiry.contactName}.`}
      size="sm"
      variant="edit"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleConfirm}
          >
            Confirm approval
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hire-deposit">Deposit amount ($)</Label>
          <Input
            id="hire-deposit"
            type="number"
            min={0}
            step={0.01}
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hire-internal">Internal notes (optional)</Label>
          <Textarea
            id="hire-internal"
            rows={3}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="e.g. deposit reference, catering notes"
          />
        </div>
      </div>
    </CrudModal>
  )
}
