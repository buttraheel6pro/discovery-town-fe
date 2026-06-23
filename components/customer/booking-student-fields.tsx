/** Learn program enrollment — student selection from household (no guardian picker). */
'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CmContact, SchedulingService } from '@/lib/types'

export interface BookingStudentFieldsProps {
  readonly service: SchedulingService
  readonly contacts: readonly CmContact[]
  readonly selectedChildIds: readonly string[]
  readonly onToggleChild: (childId: string, checked: boolean) => void
  readonly participantContactId: string
  readonly onParticipantContactChange: (contactId: string) => void
  readonly participantName: string
  readonly onParticipantNameChange: (name: string) => void
  readonly idPrefix?: string
}

function contactFullName(contact: CmContact): string {
  return `${contact.firstName} ${contact.lastName}`.trim()
}

function isAdultLearnProgram(service: SchedulingService): boolean {
  return service.gradeLevel === 'Adult'
}

export function BookingStudentFields({
  service,
  contacts,
  selectedChildIds,
  onToggleChild,
  participantContactId,
  onParticipantContactChange,
  participantName,
  onParticipantNameChange,
  idPrefix = 'learn-student',
}: Readonly<BookingStudentFieldsProps>) {
  const adultProgram = isAdultLearnProgram(service)
  const childOptions = contacts.filter((contact) => contact.contactType === 'CHILD')
  const studentAccountOptions = contacts.filter((contact) => contact.contactType === 'CUSTOMER')

  if (adultProgram) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-student`}>Student</Label>
        <p className="text-xs text-muted-foreground">
          Select the learner for this program, or enter their name if they are not on your account
          yet.
        </p>
        {studentAccountOptions.length > 0 ? (
          <Select value={participantContactId} onValueChange={onParticipantContactChange}>
            <SelectTrigger id={`${idPrefix}-student`}>
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {studentAccountOptions.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {contactFullName(student)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={`${idPrefix}-student`}
            value={participantName}
            onChange={(event) => onParticipantNameChange(event.target.value)}
            placeholder="Student full name"
          />
        )}
        {studentAccountOptions.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-student-name`}>Or enter student name</Label>
            <Input
              id={`${idPrefix}-student-name`}
              value={participantName}
              onChange={(event) => onParticipantNameChange(event.target.value)}
              placeholder="Student full name"
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Students enrolling</Label>
      <p className="text-xs text-muted-foreground">
        Select each student from your household who will attend this program.
      </p>
      {childOptions.length === 0 ? (
        <div className="space-y-2 rounded-lg border border-border bg-white p-3">
          <p className="text-sm text-foreground">
            Add students to your family list before enrolling.
          </p>
          <Button type="button" variant="secondary" size="sm" asChild>
            <Link href="/account/family">Add family member</Link>
          </Button>
        </div>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
          {childOptions.map((child) => {
            const checkboxId = `${idPrefix}-student-${child.id}`
            return (
              <li
                key={child.id}
                className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2"
              >
                <Checkbox
                  id={checkboxId}
                  checked={selectedChildIds.includes(child.id)}
                  onCheckedChange={(checked) => onToggleChild(child.id, Boolean(checked))}
                />
                <Label htmlFor={checkboxId} className="text-sm font-medium leading-none">
                  {contactFullName(child)}
                </Label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
