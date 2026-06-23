/** Household child picker and guardian picker driven by category booking rules. */
'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'

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
  usesCampStyleRegistrationForm,
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

interface FamilyMemberSelectFieldProps {
  readonly id: string
  readonly label: string
  readonly placeholder: string
  readonly value: string
  readonly options: readonly CmContact[]
  readonly onValueChange: (contactId: string) => void
  readonly emptyMessage: string
  readonly helperText?: string
}

function FamilyMemberSelectField({
  id,
  label,
  placeholder,
  value,
  options,
  onValueChange,
  emptyMessage,
  helperText,
}: Readonly<FamilyMemberSelectFieldProps>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {options.length > 0 ? (
        <Select value={value.length > 0 ? value : undefined} onValueChange={onValueChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contactFullName(contact)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-xs text-muted-foreground">
          {emptyMessage}{' '}
          <Link href="/account/family" className="text-accent underline">
            Family members
          </Link>{' '}
          to continue.
        </p>
      )}
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
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
  const usesCampStyleLabels = usesCampStyleRegistrationForm(category)
  const showGuardian = needsGuardianPicker(category)
  const showChildren = needsHouseholdChildPicker(category)
  const showAgeParticipant = needsAgeParticipantPicker(
    category,
    service.ageMin,
    service.ageMax,
  )

  const guardianOptions = contacts.filter((c) => c.contactType === 'CUSTOMER')
  const participatingChildOptions = useMemo(
    () => contacts.filter((c) => c.contactType === 'CHILD'),
    [contacts],
  )

  const participatingChildValue = showChildren
    ? (selectedChildIds[0] ?? '')
    : participantContactId

  function handleParticipatingChildChange(childId: string): void {
    if (showChildren) {
      for (const existingId of selectedChildIds) {
        if (existingId !== childId) {
          onToggleChild(existingId, false)
        }
      }
      onToggleChild(childId, true)
      return
    }
    onParticipantContactChange(childId)
    const child = contacts.find((contact) => contact.id === childId) ?? null
    onParticipantNameChange(child ? contactFullName(child) : '')
  }

  useEffect(() => {
    if (participatingChildValue.length === 0) {
      return
    }
    const stillValid = participatingChildOptions.some(
      (child) => child.id === participatingChildValue,
    )
    if (stillValid) {
      return
    }
    if (showChildren) {
      onToggleChild(participatingChildValue, false)
      return
    }
    onParticipantContactChange('')
    onParticipantNameChange('')
  }, [
    onParticipantContactChange,
    onParticipantNameChange,
    onToggleChild,
    participatingChildOptions,
    participatingChildValue,
    showChildren,
  ])

  if (!showGuardian && !showChildren && !showAgeParticipant) {
    return null
  }

  const participatingChildLabel = usesCampStyleLabels ? 'Participating child' : 'Participant'
  const participatingChildPlaceholder = usesCampStyleLabels
    ? 'Select participating child'
    : 'Select a family member'

  return (
    <div className="space-y-4">
      {showGuardian ? (
        <FamilyMemberSelectField
          id={`${idPrefix}-guardian`}
          label="Guardian"
          placeholder="Select guardian"
          value={accompanyingAdultId}
          options={guardianOptions}
          onValueChange={onAccompanyingAdultChange}
          emptyMessage="Add a guardian profile under"
          helperText="The child being booked must attend with this responsible adult (you or another adult on the booking)."
        />
      ) : null}

      {showChildren || showAgeParticipant ? (
        <FamilyMemberSelectField
          id={`${idPrefix}-participant`}
          label={showChildren ? 'Participating child' : participatingChildLabel}
          placeholder={participatingChildPlaceholder}
          value={participatingChildValue}
          options={participatingChildOptions}
          onValueChange={handleParticipatingChildChange}
          emptyMessage="Add children to your family list under"
        />
      ) : null}
    </div>
  )
}
