/** Household child multi-select and guardian picker driven by category booking rules. */
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
import {
  needsAgeParticipantPicker,
  needsGuardianPicker,
  needsHouseholdChildPicker,
} from '@/lib/booking-category-rules'
import type { CmContact, SchedulingService } from '@/lib/types'

export interface BookingFamilyMemberFieldsProps {
  readonly service: SchedulingService
  readonly contacts: readonly CmContact[]
  readonly selectedChildIds: readonly string[]
  readonly onToggleChild: (childId: string, checked: boolean) => void
  readonly accompanyingAdultId: string
  readonly onAccompanyingAdultChange: (contactId: string) => void
  readonly participantContactId: string
  readonly onParticipantContactChange: (contactId: string) => void
  readonly participantName: string
  readonly onParticipantNameChange: (name: string) => void
  readonly idPrefix?: string
}

function contactFullName(contact: CmContact): string {
  return `${contact.firstName} ${contact.lastName}`.trim()
}

export function BookingFamilyMemberFields({
  service,
  contacts,
  selectedChildIds,
  onToggleChild,
  accompanyingAdultId,
  onAccompanyingAdultChange,
  participantContactId,
  onParticipantContactChange,
  participantName,
  onParticipantNameChange,
  idPrefix = 'booking',
}: Readonly<BookingFamilyMemberFieldsProps>) {
  const category = service.category
  const showGuardian = needsGuardianPicker(category)
  const showChildren = needsHouseholdChildPicker(category)
  const showAgeParticipant = needsAgeParticipantPicker(
    category,
    service.ageMin,
    service.ageMax,
  )

  const guardianOptions = contacts.filter((c) => c.contactType === 'CUSTOMER')
  const childOptions = contacts.filter((c) => c.contactType === 'CHILD')

  if (!showGuardian && !showChildren && !showAgeParticipant) {
    return null
  }

  return (
    <div className="space-y-4">
      {showGuardian ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-guardian`}>Guardian</Label>
          {guardianOptions.length > 0 ? (
            <Select value={accompanyingAdultId} onValueChange={onAccompanyingAdultChange}>
              <SelectTrigger id={`${idPrefix}-guardian`}>
                <SelectValue placeholder="Select guardian" />
              </SelectTrigger>
              <SelectContent>
                {guardianOptions.map((guardian) => (
                  <SelectItem key={guardian.id} value={guardian.id}>
                    {contactFullName(guardian)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">
              Add a guardian profile under{' '}
              <Link href="/account/family" className="text-accent underline">
                Family members
              </Link>{' '}
              to continue.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            The child being booked must attend with this responsible adult (you or another adult on
            the booking).
          </p>
        </div>
      ) : null}

      {showChildren ? (
        <div className="space-y-2">
          <Label>Participating children (household)</Label>
          <p className="text-xs text-muted-foreground">
            Select every child from your household who will take part in this session.
          </p>
          {childOptions.length === 0 ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm text-foreground">
                You need to add children to your family list first.
              </p>
              <Button type="button" variant="secondary" size="sm" asChild>
                <Link href="/account/family">Add family member</Link>
              </Button>
            </div>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
              {childOptions.map((child) => {
                const checkboxId = `${idPrefix}-child-${child.id}`
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
      ) : null}

      {showAgeParticipant ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-participant`}>Participant</Label>
          {childOptions.length > 0 ? (
            <Select value={participantContactId} onValueChange={onParticipantContactChange}>
              <SelectTrigger id={`${idPrefix}-participant`}>
                <SelectValue placeholder="Select a family member" />
              </SelectTrigger>
              <SelectContent>
                {childOptions.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {contactFullName(child)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`${idPrefix}-participant`}
              value={participantName}
              onChange={(e) => onParticipantNameChange(e.target.value)}
              placeholder="Participant full name"
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
