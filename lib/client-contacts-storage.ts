/** Persist household / client contacts to localStorage (guardians, children, relationships). */
import { setLocalStorageJson } from '@/lib/browser-local-storage-json'
import type { CmContact, CmContactRelationship } from '@/lib/types'

export const CLIENT_CONTACTS_STORAGE_KEY = 'discovery-town-client-contacts'

function cloneRelationships(
  relationships: readonly CmContactRelationship[] | undefined,
): CmContactRelationship[] | undefined {
  if (!relationships?.length) {
    return undefined
  }
  return relationships.map((rel) => ({ ...rel }))
}

function cloneContact(contact: CmContact): CmContact {
  return {
    ...contact,
    metadata: contact.metadata ? { ...contact.metadata } : undefined,
    tags: contact.tags?.map((tag) => ({ ...tag })),
    relationships: cloneRelationships(contact.relationships),
    subscriptions: contact.subscriptions?.map((sub) => ({ ...sub })),
    creditPacks: contact.creditPacks?.map((pack) => ({ ...pack })),
    creditLedger: contact.creditLedger?.map((entry) => ({ ...entry })),
    documents: contact.documents?.map((doc) => ({ ...doc })),
  }
}

function isCmContact(value: unknown): value is CmContact {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    typeof row.firstName === 'string' &&
    typeof row.lastName === 'string' &&
    typeof row.contactType === 'string'
  )
}

export function readPersistedContacts(): CmContact[] | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(CLIENT_CONTACTS_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    const contacts = parsed.filter(isCmContact).map(cloneContact)
    return contacts.length > 0 ? contacts : null
  } catch {
    return null
  }
}

function mergeRelationships(
  seed: readonly CmContactRelationship[] | undefined,
  persisted: readonly CmContactRelationship[] | undefined,
): CmContactRelationship[] | undefined {
  if (!persisted?.length) {
    return cloneRelationships(seed)
  }
  const byId = new Map<string, CmContactRelationship>()
  for (const rel of seed ?? []) {
    byId.set(rel.id, { ...rel })
  }
  for (const rel of persisted) {
    byId.set(rel.id, { ...rel })
  }
  const merged = [...byId.values()]
  return merged.length > 0 ? merged : undefined
}

function mergeSeedContactWithPersisted(seed: CmContact, persisted: CmContact): CmContact {
  return {
    ...cloneContact(seed),
    relationships: mergeRelationships(seed.relationships, persisted.relationships),
  }
}

/** Rehydrate mock seed with saved contacts (new members + relationship edits on seed ids). */
export function mergePersistedContactsWithSeed(
  seed: readonly CmContact[],
  persisted: readonly CmContact[],
): CmContact[] {
  const seedContacts = seed.map(cloneContact)
  const persistedById = new Map(persisted.map((contact) => [contact.id, cloneContact(contact)]))
  const seedIds = new Set(seedContacts.map((contact) => contact.id))

  const mergedSeed = seedContacts.map((seedContact) => {
    const fromStore = persistedById.get(seedContact.id)
    if (!fromStore) {
      return seedContact
    }
    return mergeSeedContactWithPersisted(seedContact, fromStore)
  })

  const mergedIds = new Set(mergedSeed.map((contact) => contact.id))
  const extras = persisted
    .filter((contact) => !mergedIds.has(contact.id))
    .map(cloneContact)

  return [...extras, ...mergedSeed]
}

export function loadInitialContacts(seed: readonly CmContact[]): CmContact[] {
  const persisted = readPersistedContacts()
  if (!persisted) {
    return seed.map(cloneContact)
  }
  return mergePersistedContactsWithSeed(seed, persisted)
}

export function persistContacts(contacts: readonly CmContact[]): void {
  setLocalStorageJson(CLIENT_CONTACTS_STORAGE_KEY, contacts.map(cloneContact))
}
