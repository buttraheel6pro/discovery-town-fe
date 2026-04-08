/** Reject private hire inquiry — reason required. */
'use client'

import { useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCalendar } from '@/lib/calendar-store'
import type { PrivateHireInquiry } from '@/lib/types'

interface RejectHireModalProps {
  readonly inquiry: PrivateHireInquiry
  readonly open: boolean
  readonly onClose: () => void
}

export function RejectHireModal({
  inquiry,
  open,
  onClose,
}: Readonly<RejectHireModalProps>) {
  const { rejectInquiry } = useCalendar()
  const [reason, setReason] = useState<string>('')

  function handleConfirm() {
    const trimmed = reason.trim()
    if (trimmed.length < 1) return
    rejectInquiry(inquiry.id, trimmed)
    setReason('')
    onClose()
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
      title="Reject enquiry"
      description={`This will mark the request from ${inquiry.contactName} as rejected.`}
      size="sm"
      variant="delete"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Confirm rejection
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="hire-reject-reason">Reason (required)</Label>
        <Textarea
          id="hire-reject-reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this date or request cannot be accommodated"
          required
        />
      </div>
    </CrudModal>
  )
}
