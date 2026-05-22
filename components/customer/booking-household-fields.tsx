/** Open-play session booking — family roster dropdown + add-family modal. */
'use client'

import { useEffect, useMemo, useState } from 'react'

import { ChevronDown, Minus, UserPlus } from 'lucide-react'

import { HouseholdBookingModal } from '@/components/customer/household-booking-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildCoPrimaryGuardianRelationships,
  buildGuardianRelationship,
  buildHouseholdBookingRoster,
  buildHouseholdPickerOptions,
  buildParentChildRelationship,
  contactFullName,
  formatHouseholdAgeLabel,
  getHouseholdAnchorPrimaryId,
  getHouseholdChildContacts,
  getPrimaryGuardianCandidates,
  HOUSEHOLD_FAMILY_MEMBER_TYPE_OPTIONS,
  householdRoleLabel,
  parseFullName,
  PRIMARY_GUARDIAN_ACCOUNT_NOTE,
  type HouseholdFamilyMemberType,
} from '@/lib/booking-household'
import { cn } from '@/lib/utils'
import type { CmContact, CmContactRelationship } from '@/lib/types'

export interface BookingHouseholdFieldsProps {
  readonly contacts: readonly CmContact[]
  readonly primaryGuardianId: string
  readonly onPrimaryGuardianChange: (contactId: string) => void
  readonly secondaryGuardianId: string
  readonly onSecondaryGuardianChange: (contactId: string) => void
  readonly selectedChildIds: readonly string[]
  readonly onToggleChild: (childId: string, checked: boolean) => void
  /** Max children selectable (passes + additional siblings); omit for no cap. */
  readonly maxChildSelections?: number | null
  readonly passCount?: number
  readonly additionalSiblingCount?: number
  readonly onAddContact: (contact: CmContact) => void
  readonly onAddRelationship: (relationship: CmContactRelationship) => void
  readonly idPrefix?: string
  /** When set, only children with eligible DOB can be selected (e.g. Parents Night age band). */
  readonly isChildAgeEligible?: (dateOfBirth: string | undefined) => boolean
  readonly ageRestrictionLabel?: string | null
}

export function BookingHouseholdFields({
  contacts,
  primaryGuardianId,
  onPrimaryGuardianChange,
  secondaryGuardianId,
  onSecondaryGuardianChange,
  selectedChildIds,
  onToggleChild,
  maxChildSelections = null,
  passCount = 0,
  additionalSiblingCount = 0,
  onAddContact,
  onAddRelationship,
  idPrefix = 'household',
  isChildAgeEligible,
  ageRestrictionLabel,
}: Readonly<BookingHouseholdFieldsProps>) {
  const [addFamilyOpen, setAddFamilyOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftPrimaryId, setDraftPrimaryId] = useState('')
  const [draftSecondaryId, setDraftSecondaryId] = useState('')
  const [draftChildIds, setDraftChildIds] = useState<string[]>([])

  const [memberName, setMemberName] = useState('')
  const [memberType, setMemberType] = useState<HouseholdFamilyMemberType | ''>('')
  const [memberDob, setMemberDob] = useState('')
  const [emergencyContact, setEmergencyContact] = useState(false)
  const [familyFormAgeError, setFamilyFormAgeError] = useState<string | null>(null)

  const primaryCandidates = useMemo(
    () => getPrimaryGuardianCandidates(contacts),
    [contacts],
  )

  const canChangePrimary = primaryCandidates.length > 1

  const bookingRoster = useMemo(
    () =>
      buildHouseholdBookingRoster(
        contacts,
        primaryGuardianId,
        secondaryGuardianId,
        selectedChildIds,
      ),
    [contacts, primaryGuardianId, secondaryGuardianId, selectedChildIds],
  )

  const primaryContact = useMemo(
    () => contacts.find((c) => c.id === primaryGuardianId) ?? null,
    [contacts, primaryGuardianId],
  )

  const pickerOptions = useMemo(
    () => buildHouseholdPickerOptions(contacts, primaryGuardianId),
    [contacts, primaryGuardianId],
  )

  const householdChildren = useMemo(
    () => getHouseholdChildContacts(contacts),
    [contacts],
  )

  const pickerTriggerLabel = useMemo(() => {
    const childCount = selectedChildIds.length
    const parts: string[] = []
    if (primaryContact) {
      parts.push(contactFullName(primaryContact))
    }
    if (secondaryGuardianId) {
      parts.push('1 secondary')
    }
    if (childCount > 0) {
      parts.push(`${childCount} child${childCount === 1 ? '' : 'ren'}`)
    }
    return parts.join(', ')
  }, [primaryContact, secondaryGuardianId, selectedChildIds.length])

  const householdAnchorId = useMemo(
    () => getHouseholdAnchorPrimaryId(contacts),
    [contacts],
  )

  useEffect(() => {
    if (!pickerOpen) {
      return
    }
    setDraftPrimaryId(primaryGuardianId)
    setDraftSecondaryId(secondaryGuardianId)
    setDraftChildIds([...selectedChildIds])
  }, [pickerOpen, primaryGuardianId, secondaryGuardianId, selectedChildIds])

  function resetAddFamilyForm() {
    setMemberName('')
    setMemberType('')
    setMemberDob('')
    setEmergencyContact(false)
  }

  function handlePickerOpenChange(open: boolean) {
    setPickerOpen(open)
  }

  function toggleDraftSecondary(contactId: string, checked: boolean) {
    setDraftSecondaryId(checked ? contactId : '')
  }

  function toggleDraftChild(contactId: string, checked: boolean) {
    setDraftChildIds((prev) => {
      if (!checked) {
        return prev.filter((id) => id !== contactId)
      }
      if (prev.includes(contactId)) {
        return prev
      }
      if (maxChildSelections != null && prev.length >= maxChildSelections) {
        return prev
      }
      return [...prev, contactId]
    })
  }

  function canSelectAnotherChild(currentCount: number): boolean {
    return maxChildSelections == null || currentCount < maxChildSelections
  }

  function applyPickerDraft() {
    if (canChangePrimary) {
      onPrimaryGuardianChange(draftPrimaryId)
    }
    onSecondaryGuardianChange(draftSecondaryId)

    const sharedChildren = getHouseholdChildContacts(contacts)

    for (const child of sharedChildren) {
      const shouldSelect = draftChildIds.includes(child.id)
      const isSelected = selectedChildIds.includes(child.id)
      if (shouldSelect !== isSelected) {
        onToggleChild(child.id, shouldSelect)
      }
    }
    for (const childId of selectedChildIds) {
      if (!draftChildIds.includes(childId)) {
        onToggleChild(childId, false)
      }
    }
    setPickerOpen(false)
  }

  function handleRemoveFromBooking(
    contactId: string,
    role: 'primary' | 'secondary' | 'child',
  ) {
    if (role === 'primary') {
      if (!canChangePrimary) {
        return
      }
      const nextPrimary = primaryCandidates.find((c) => c.id !== contactId)
      if (nextPrimary) {
        onPrimaryGuardianChange(nextPrimary.id)
      }
      return
    }
    if (role === 'secondary') {
      onSecondaryGuardianChange('')
      return
    }
    onToggleChild(contactId, false)
  }

  function handleCreateFamilyMember(event: React.FormEvent) {
    event.preventDefault()
    if (!memberName.trim() || !memberType) {
      return
    }
    if (!memberDob) {
      return
    }
    if (
      memberType === 'CHILD' &&
      isChildAgeEligible != null &&
      !isChildAgeEligible(memberDob)
    ) {
      setFamilyFormAgeError(
        ageRestrictionLabel != null
          ? `Birth date must match ${ageRestrictionLabel}.`
          : 'Child is outside the allowed age range.',
      )
      return
    }
    setFamilyFormAgeError(null)

    const { firstName, lastName } = parseFullName(memberName)
    if (!firstName) {
      return
    }

    const nowIso = new Date().toISOString()
    const isChild = memberType === 'CHILD'
    const isPrimary = memberType === 'PRIMARY_GUARDIAN'
    const newId = isChild
      ? `cm-child-${Date.now()}`
      : isPrimary
        ? `cm-primary-guardian-${Date.now()}`
        : `cm-guardian-${Date.now()}`

    const noteParts: string[] = []
    if (isPrimary) {
      noteParts.push(PRIMARY_GUARDIAN_ACCOUNT_NOTE)
    }
    if (emergencyContact) {
      noteParts.push('Emergency contact')
    }

    const newContact: CmContact = {
      id: newId,
      tenantId: 'tenant-1',
      contactType: isChild ? 'CHILD' : 'CUSTOMER',
      firstName,
      lastName,
      dateOfBirth: memberDob,
      gender: 'OTHER',
      metadata: {
        marketingOptIn: false,
        notes: noteParts.length > 0 ? noteParts.join(' · ') : undefined,
      },
      tags: [],
      relationships: [],
      subscriptions: [],
      creditPacks: [],
      creditLedger: [],
      documents: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    onAddContact(newContact)
    if (isChild) {
      onAddRelationship(buildParentChildRelationship(householdAnchorId, newId))
      if (canSelectAnotherChild(selectedChildIds.length)) {
        onToggleChild(newId, true)
      }
    } else if (isPrimary) {
      const sharedChildIds = getHouseholdChildContacts(contacts).map((child) => child.id)
      for (const relationship of buildCoPrimaryGuardianRelationships(
        householdAnchorId,
        newId,
        sharedChildIds,
      )) {
        onAddRelationship(relationship)
      }
      onPrimaryGuardianChange(newId)
    } else {
      onAddRelationship(buildGuardianRelationship(householdAnchorId, newId))
      onSecondaryGuardianChange(newId)
    }

    resetAddFamilyForm()
    setAddFamilyOpen(false)
  }

  return (
    <div className="space-y-3">
      {ageRestrictionLabel ? (
        <p className="text-xs text-muted-foreground">
          Children must meet the age requirement:{' '}
          <span className="font-semibold text-foreground">{ageRestrictionLabel}</span>
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-muted-foreground">Family members</Label>
        <Button
          type="button"
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => setAddFamilyOpen(true)}
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          Add family
        </Button>
      </div>

      <Popover open={pickerOpen} onOpenChange={handlePickerOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={`${idPrefix}-family-select`}
            className="h-10 w-full justify-between font-normal"
            aria-expanded={pickerOpen}
          >
            <span className="truncate text-left">
              {pickerTriggerLabel || 'Select family members'}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="max-h-64 space-y-1 overflow-y-auto p-2">
            {canChangePrimary ? (
              <div className="space-y-1 border-b border-border pb-2">
                <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Primary guardian
                </p>
                {primaryCandidates.map((candidate) => {
                  const radioId = `${idPrefix}-primary-${candidate.id}`
                  return (
                    <label
                      key={candidate.id}
                      htmlFor={radioId}
                      className="flex cursor-pointer items-center gap-3 rounded-md border border-border/60 px-3 py-2 hover:bg-muted/50"
                    >
                      <input
                        id={radioId}
                        type="radio"
                        name={`${idPrefix}-primary-guardian`}
                        className="h-4 w-4 accent-accent"
                        checked={draftPrimaryId === candidate.id}
                        onChange={() => setDraftPrimaryId(candidate.id)}
                      />
                      <span className="min-w-0 flex-1 text-sm font-medium">
                        {contactFullName(candidate)}
                        {formatHouseholdAgeLabel(candidate.dateOfBirth)}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : primaryContact ? (
              <label className="flex cursor-not-allowed items-center gap-3 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 opacity-90">
                <Checkbox checked disabled />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{contactFullName(primaryContact)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {householdRoleLabel('primary')} · always included
                  </span>
                </span>
              </label>
            ) : null}
            {pickerOptions.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                Add family members with the button above, then select them here.
              </p>
            ) : (
              pickerOptions.map((option) => {
                const checkboxId = `${idPrefix}-pick-${option.role}-${option.contact.id}`
                const isSecondary = option.role === 'secondary'
                const checked = isSecondary
                  ? draftSecondaryId === option.contact.id
                  : draftChildIds.includes(option.contact.id)
                const isChildOption = option.role === 'child'
                const childAtCap =
                  isChildOption &&
                  maxChildSelections != null &&
                  !checked &&
                  draftChildIds.length >= maxChildSelections
                const childAgeIneligible =
                  isChildOption &&
                  isChildAgeEligible != null &&
                  !isChildAgeEligible(option.contact.dateOfBirth)
                const optionDisabled = childAtCap || childAgeIneligible

                return (
                  <label
                    key={`${option.role}-${option.contact.id}`}
                    htmlFor={checkboxId}
                    className={cn(
                      'flex items-center gap-3 rounded-md border border-border/60 px-3 py-2',
                      optionDisabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-muted/50',
                    )}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      disabled={optionDisabled}
                      onCheckedChange={(value) => {
                        if (isSecondary) {
                          toggleDraftSecondary(option.contact.id, Boolean(value))
                          return
                        }
                        toggleDraftChild(option.contact.id, Boolean(value))
                      }}
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">
                        {contactFullName(option.contact)}
                        {formatHouseholdAgeLabel(option.contact.dateOfBirth)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {householdRoleLabel(option.role)}
                        {childAgeIneligible ? ' · Outside age range' : ''}
                      </span>
                    </span>
                  </label>
                )
              })
            )}
          </div>
          <div className="flex justify-end border-t border-border p-2">
            <Button
              type="button"
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={draftChildIds.length < 1}
              onClick={applyPickerDraft}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="space-y-2">
        {bookingRoster.map((member) => {
          const ageLabel = formatHouseholdAgeLabel(member.contact.dateOfBirth)
          const canRemove =
            member.role === 'secondary' ||
            member.role === 'child' ||
            (member.role === 'primary' && canChangePrimary)

          return (
            <div
              key={`${member.role}-${member.contact.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {contactFullName(member.contact)}
                  <span className="font-normal text-muted-foreground">{ageLabel}</span>
                </p>
                <Badge variant="outline" className="mt-1 text-[10px] font-semibold">
                  {householdRoleLabel(member.role)}
                </Badge>
              </div>
              {canRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${contactFullName(member.contact)} from booking`}
                  onClick={() => handleRemoveFromBooking(member.contact.id, member.role)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>

      {maxChildSelections != null ? (
        <p className="text-xs text-muted-foreground">
          Select up to {maxChildSelections} child{maxChildSelections === 1 ? '' : 'ren'} (
          {passCount} pass{passCount === 1 ? '' : 'es'}
          {additionalSiblingCount > 0
            ? ` + ${additionalSiblingCount} additional sibling${additionalSiblingCount === 1 ? '' : 's'}`
            : ''}
          ). {selectedChildIds.length} selected.
        </p>
      ) : null}
      {selectedChildIds.length < 1 ? (
        <p className="text-xs text-muted-foreground">
          Select at least one child from the dropdown for this session.
        </p>
      ) : null}

      <HouseholdBookingModal
        open={addFamilyOpen}
        onOpenChange={(open) => {
          setAddFamilyOpen(open)
          if (!open) {
            resetAddFamilyForm()
          }
        }}
        title="Create new family member"
        description="Add someone to your household. They can be selected for open play bookings."
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetAddFamilyForm()
                setAddFamilyOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              form={`${idPrefix}-add-family-form`}
            >
              Save
            </Button>
          </>
        }
      >
        <form
          id={`${idPrefix}-add-family-form`}
          onSubmit={handleCreateFamilyMember}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-fm-name`}>Name</Label>
            <Input
              id={`${idPrefix}-fm-name`}
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`${idPrefix}-fm-type`}>Family member type</Label>
              <Select
                value={memberType || undefined}
                onValueChange={(value) =>
                  setMemberType(value as HouseholdFamilyMemberType)
                }
              >
                <SelectTrigger id={`${idPrefix}-fm-type`} className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {HOUSEHOLD_FAMILY_MEMBER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`${idPrefix}-fm-dob`}>Birth date</Label>
              <Input
                id={`${idPrefix}-fm-dob`}
                type="date"
                className="w-full"
                value={memberDob}
                onChange={(e) => {
                  setMemberDob(e.target.value)
                  setFamilyFormAgeError(null)
                }}
                required
              />
              {familyFormAgeError ? (
                <p className="text-xs text-destructive">{familyFormAgeError}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-fm-emergency`}
              checked={emergencyContact}
              onCheckedChange={(checked) => setEmergencyContact(Boolean(checked))}
            />
            <Label htmlFor={`${idPrefix}-fm-emergency`} className="text-sm font-normal">
              Emergency contact
            </Label>
          </div>
        </form>
      </HouseholdBookingModal>
    </div>
  )
}
