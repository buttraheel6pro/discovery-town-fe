/** Assign modal wrapper for pending staff assignments. */
'use client'

import { useState } from 'react'

import { staff } from '@/lib/mock-data'
import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface StaffAssignmentAssignModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onAssign: (staffId: string, notes: string) => void
}

export function StaffAssignmentAssignModal({
  open,
  onOpenChange,
  onAssign,
}: Readonly<StaffAssignmentAssignModalProps>) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title="Assign staff"
      description="Select available staff for this assignment."
      variant="edit"
      footer={null}
    >
      <div className="space-y-3">
        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
          <SelectTrigger>
            <SelectValue placeholder="Select staff member" />
          </SelectTrigger>
          <SelectContent>
            {staff
              .filter((person) => person.isActive)
              .map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.firstName} {person.lastName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes for assignment"
        />
        <Button
          disabled={!selectedStaffId}
          onClick={() => {
            onAssign(selectedStaffId, notes.trim())
            onOpenChange(false)
            setSelectedStaffId('')
            setNotes('')
          }}
        >
          Assign
        </Button>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          Close
        </Button>
      </div>
    </CrudModal>
  )
}
