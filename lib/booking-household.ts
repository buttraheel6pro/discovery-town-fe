/** Household guardians & children for open-play session booking (mock + bypass user). */
import { isLoginBypassEnabled } from '@/lib/config/auth'
import { isOpenPlaySessionPassOffering } from '@/lib/open-play-session-pass'
import type { CmContact, CmContactRelationship, SchedulingService } from '@/lib/types'

export const BYPASS_PRIMARY_GUARDIAN_CONTACT_ID = 'cm-bypass-primary' as const
export const SECONDARY_GUARDIAN_CONTACT_ID = 'cm-secondary-guardian' as const

import { PARENTS_NIGHT_OUT_SERVICE_ID } from '@/lib/mock-data'

export { PARENTS_NIGHT_OUT_SERVICE_ID }

export const OPEN_PLAY_SESSION_SERVICE_IDS = new Set<string>([
  'svc-open-play-2-hour-pass',
  'svc-open-play-sibling-pass',
  'svc-open-play-multi-pass',
  PARENTS_NIGHT_OUT_SERVICE_ID,
])

export const SIBLING_PASS_SERVICE_ID = 'svc-open-play-sibling-pass' as const

type OpenPlaySessionPassFields = Pick<
  SchedulingService,
  | 'id'
  | 'serviceType'
  | 'bookingMode'
  | 'bookingOfferingKind'
  | 'category'
  | 'categoryId'
  | 'isPackageService'
>

export function isOpenPlaySessionBookingService(
  serviceOrId: string | OpenPlaySessionPassFields,
): boolean {
  if (typeof serviceOrId === 'string') {
    return OPEN_PLAY_SESSION_SERVICE_IDS.has(serviceOrId)
  }
  if (OPEN_PLAY_SESSION_SERVICE_IDS.has(serviceOrId.id)) {
    return true
  }
  return isOpenPlaySessionPassOffering(serviceOrId)
}

/** Sibling Pass books siblings via pass count — no extra adult/sibling quantity fields. */
export function isSiblingPassBookingService(serviceId: string): boolean {
  return serviceId === SIBLING_PASS_SERVICE_ID
}

export function getBookingPrimaryGuardianId(
  contacts: readonly Pick<CmContact, 'id' | 'contactType'>[],
): string {
  if (isLoginBypassEnabled()) {
    const bypass = contacts.find((c) => c.id === BYPASS_PRIMARY_GUARDIAN_CONTACT_ID)
    if (bypass) {
      return BYPASS_PRIMARY_GUARDIAN_CONTACT_ID
    }
  }
  const firstCustomer = contacts.find((c) => c.contactType === 'CUSTOMER')
  return firstCustomer?.id ?? BYPASS_PRIMARY_GUARDIAN_CONTACT_ID
}

function childIdsLinkedToPrimary(
  primary: CmContact | undefined,
  contacts: readonly CmContact[],
): Set<string> {
  const ids = new Set<string>()
  if (!primary) {
    return ids
  }
  for (const rel of primary.relationships ?? []) {
    if (rel.relationshipType === 'PARENT_CHILD') {
      ids.add(rel.relatedContactId)
    }
  }
  for (const child of contacts) {
    if (child.contactType !== 'CHILD') {
      continue
    }
    const linked = (child.relationships ?? []).some(
      (rel) =>
        rel.relationshipType === 'PARENT_CHILD' && rel.relatedContactId === primary.id,
    )
    if (linked) {
      ids.add(child.id)
    }
  }
  return ids
}

/** Anchor household — logged-in / default primary; children belong to this unit. */
export function getHouseholdAnchorPrimaryId(
  contacts: readonly Pick<CmContact, 'id' | 'contactType'>[],
): string {
  return getBookingPrimaryGuardianId(contacts)
}

/** Children shared by every primary guardian in the same household. */
export function getHouseholdChildContacts(
  contacts: readonly CmContact[],
  _bookingPrimaryId?: string,
): CmContact[] {
  const anchor = contacts.find((c) => c.id === getHouseholdAnchorPrimaryId(contacts))
  const linkedIds = childIdsLinkedToPrimary(anchor, contacts)
  return contacts.filter((c) => c.contactType === 'CHILD' && linkedIds.has(c.id))
}

function secondaryGuardianIdsLinkedToPrimary(
  primary: CmContact | undefined,
  contacts: readonly CmContact[],
): Set<string> {
  const ids = new Set<string>()
  if (!primary) {
    return ids
  }
  for (const rel of primary.relationships ?? []) {
    if (rel.relationshipType === 'GUARDIAN') {
      ids.add(rel.relatedContactId)
    }
  }
  for (const contact of contacts) {
    if (contact.id === primary.id || contact.contactType !== 'CUSTOMER') {
      continue
    }
    const linked = (contact.relationships ?? []).some(
      (rel) =>
        rel.relationshipType === 'GUARDIAN' && rel.relatedContactId === primary.id,
    )
    if (linked) {
      ids.add(contact.id)
    }
  }
  return ids
}

/** Extra primary guardian added via booking modal (not the logged-in account). */
export function isAlternatePrimaryGuardianFromModal(contact: CmContact): boolean {
  if (contact.contactType !== 'CUSTOMER') {
    return false
  }
  if (contact.id.startsWith('cm-primary-guardian-')) {
    return true
  }
  const notes = contact.metadata?.notes ?? ''
  return notes.includes(PRIMARY_GUARDIAN_ACCOUNT_NOTE)
}

/** Logged-in primary plus any co-primary added through the family modal. */
export function getPrimaryGuardianCandidates(contacts: readonly CmContact[]): CmContact[] {
  const anchorId = getHouseholdAnchorPrimaryId(contacts)
  const anchor = contacts.find((c) => c.id === anchorId)
  const alternates = contacts.filter(
    (c) => c.id !== anchorId && isAlternatePrimaryGuardianFromModal(c),
  )
  const roster: CmContact[] = []
  if (anchor) {
    roster.push(anchor)
  }
  roster.push(...alternates)
  return roster
}

/** Secondary adults linked to the household anchor via GUARDIAN relationships. */
export function getSecondaryGuardianCandidates(
  contacts: readonly CmContact[],
  bookingPrimaryId: string,
): CmContact[] {
  const anchor = contacts.find((c) => c.id === getHouseholdAnchorPrimaryId(contacts))
  const linkedIds = secondaryGuardianIdsLinkedToPrimary(anchor, contacts)
  const primaryIds = new Set(getPrimaryGuardianCandidates(contacts).map((c) => c.id))
  return contacts.filter(
    (c) =>
      c.contactType === 'CUSTOMER' &&
      c.id !== bookingPrimaryId &&
      !primaryIds.has(c.id) &&
      linkedIds.has(c.id),
  )
}

export function contactFullName(contact: Pick<CmContact, 'firstName' | 'lastName'>): string {
  return `${contact.firstName} ${contact.lastName}`.trim()
}

export type HouseholdBookingMemberRole = 'primary' | 'secondary' | 'child'

export interface HouseholdBookingMember {
  readonly contact: CmContact
  readonly role: HouseholdBookingMemberRole
}

export const PRIMARY_GUARDIAN_ACCOUNT_NOTE = 'Primary guardian account' as const

export const HOUSEHOLD_FAMILY_MEMBER_TYPE_OPTIONS = [
  { value: 'PRIMARY_GUARDIAN', label: 'Primary guardian' },
  { value: 'SECONDARY_GUARDIAN', label: 'Secondary guardian' },
  { value: 'CHILD', label: 'Child' },
] as const

export type HouseholdFamilyMemberType =
  (typeof HOUSEHOLD_FAMILY_MEMBER_TYPE_OPTIONS)[number]['value']

/** Age label for household roster cards — months for under 2 years, else years. */
export function formatHouseholdAgeLabel(dateOfBirth: string | undefined): string {
  if (!dateOfBirth?.trim()) {
    return ''
  }
  const normalized = dateOfBirth.includes('T')
    ? dateOfBirth
    : `${dateOfBirth}T00:00:00`
  const dob = new Date(normalized)
  if (Number.isNaN(dob.getTime())) {
    return ''
  }
  const now = new Date()
  let months =
    (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
  if (now.getDate() < dob.getDate()) {
    months -= 1
  }
  if (months < 0) {
    return ''
  }
  if (months < 24) {
    return ` (${months} month${months === 1 ? '' : 's'})`
  }
  const years = Math.floor(months / 12)
  return ` (${years}y)`
}

export function householdRoleLabel(role: HouseholdBookingMemberRole): string {
  switch (role) {
    case 'primary':
      return 'Primary guardian'
    case 'secondary':
      return 'Secondary guardian'
    case 'child':
      return 'Child'
    default:
      return 'Family member'
  }
}

export function buildHouseholdBookingRoster(
  contacts: readonly CmContact[],
  primaryGuardianId: string,
  secondaryGuardianId: string,
  selectedChildIds: readonly string[],
): HouseholdBookingMember[] {
  const roster: HouseholdBookingMember[] = []
  const primary = contacts.find((c) => c.id === primaryGuardianId)
  if (primary) {
    roster.push({ contact: primary, role: 'primary' })
  }
  if (secondaryGuardianId) {
    const secondary = contacts.find((c) => c.id === secondaryGuardianId)
    if (secondary) {
      roster.push({ contact: secondary, role: 'secondary' })
    }
  }
  for (const childId of selectedChildIds) {
    const child = contacts.find((c) => c.id === childId)
    if (child) {
      roster.push({ contact: child, role: 'child' })
    }
  }
  return roster
}

/** All household members available in the booking multi-select (excludes primary). */
export function buildHouseholdPickerOptions(
  contacts: readonly CmContact[],
  primaryGuardianId: string,
): HouseholdBookingMember[] {
  const options: HouseholdBookingMember[] = []
  for (const contact of getSecondaryGuardianCandidates(contacts, primaryGuardianId)) {
    options.push({ contact, role: 'secondary' })
  }
  for (const contact of getHouseholdChildContacts(contacts)) {
    options.push({ contact, role: 'child' })
  }
  return options
}

/** Labels for how the child relates to the primary guardian on household booking. */
export const HOUSEHOLD_CHILD_RELATION_OPTIONS = [
  'Son',
  'Daughter',
  'Step-son',
  'Step-daughter',
  'Ward',
  'Other',
] as const

export type HouseholdChildRelation = (typeof HOUSEHOLD_CHILD_RELATION_OPTIONS)[number]

export function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx === -1) {
    return { firstName: trimmed, lastName: '' }
  }
  return {
    firstName: trimmed.slice(0, spaceIdx).trim(),
    lastName: trimmed.slice(spaceIdx + 1).trim(),
  }
}

export function buildParentChildRelationship(
  primaryGuardianId: string,
  childId: string,
  relationToGuardian?: string,
): CmContactRelationship {
  const nowIso = new Date().toISOString()
  const relationNote = relationToGuardian?.trim()
  return {
    id: `cmrel-${primaryGuardianId}-${childId}-${Date.now()}`,
    tenantId: 'tenant-1',
    contactId: primaryGuardianId,
    relatedContactId: childId,
    relationshipType: 'PARENT_CHILD',
    isPrimaryGuardian: true,
    canBookFor: true,
    canViewDocuments: true,
    canManageMembership: true,
    notes: relationNote || undefined,
    createdAt: nowIso,
  }
}

export function buildGuardianRelationship(
  primaryGuardianId: string,
  secondaryGuardianId: string,
): CmContactRelationship {
  const nowIso = new Date().toISOString()
  return {
    id: `cmrel-guardian-${primaryGuardianId}-${secondaryGuardianId}-${Date.now()}`,
    tenantId: 'tenant-1',
    contactId: primaryGuardianId,
    relatedContactId: secondaryGuardianId,
    relationshipType: 'GUARDIAN',
    isPrimaryGuardian: false,
    canBookFor: true,
    canViewDocuments: true,
    canManageMembership: false,
    createdAt: nowIso,
  }
}

/** Links a modal-added co-primary to the household anchor and shared children. */
export function buildCoPrimaryGuardianRelationships(
  anchorPrimaryId: string,
  coPrimaryId: string,
  childIds: readonly string[],
): CmContactRelationship[] {
  const nowIso = new Date().toISOString()
  const relationships: CmContactRelationship[] = [
    {
      id: `cmrel-co-primary-${anchorPrimaryId}-${coPrimaryId}-${Date.now()}`,
      tenantId: 'tenant-1',
      contactId: anchorPrimaryId,
      relatedContactId: coPrimaryId,
      relationshipType: 'GUARDIAN',
      isPrimaryGuardian: false,
      canBookFor: true,
      canViewDocuments: true,
      canManageMembership: true,
      notes: PRIMARY_GUARDIAN_ACCOUNT_NOTE,
      createdAt: nowIso,
    },
  ]
  for (const childId of childIds) {
    relationships.push(buildParentChildRelationship(coPrimaryId, childId))
  }
  return relationships
}
