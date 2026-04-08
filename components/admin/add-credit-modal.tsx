/** AddCreditModal — adjusting a contact's credit balance. */
'use client'

import { useState } from 'react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AddCreditModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (amount: number, reason: string) => void
}

export function AddCreditModal({
  open,
  onOpenChange,
  onSubmit,
}: Readonly<AddCreditModalProps>) {
  const [amount, setAmount] = useState<string>('0')
  const [reason, setReason] = useState<string>('')

  function handleConfirm() {
    const value = Number.parseInt(amount, 10)
    if (!Number.isFinite(value) || value === 0) return
    onSubmit(value, reason.trim())
    setAmount('0')
    setReason('')
    onOpenChange(false)
  }

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add credit"
      description="Manual credit adjustment for this contact."
      size="sm"
      variant="create"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="credit-amount">Amount (credits)</Label>
          <Input
            id="credit-amount"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="credit-reason">Reason (optional)</Label>
          <Textarea
            id="credit-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Goodwill gesture, manual adjustment, promotion"
          />
        </div>
      </div>
    </CrudModal>
  )
}
