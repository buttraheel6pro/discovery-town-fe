/** Client store — local in-memory state for contacts, memberships, packs, and documents. */
'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

import {
  clientDocuments as initialClientDocuments,
  cmContacts as initialCmContacts,
  cmCreditPackDefinitions as initialPackDefinitions,
  contactNotes as initialNotes,
  contactTags as initialTags,
  membershipPlans as initialMembershipPlans,
  planAddOns as initialPlanAddOns,
  planCoupons as initialPlanCoupons,
} from '@/lib/mock-data'
import { loadInitialContacts, persistContacts } from '@/lib/client-contacts-storage'
import {
  loadInitialMembershipPlans,
  persistMembershipPlans,
} from '@/lib/client-membership-plans-storage'
import type {
  ClientDocument,
  CmContact,
  CmContactRelationship,
  CmCreditPackDefinition,
  ContactFilters,
  ContactNote,
  ContactSubscription,
  ContactTag,
  ContactTagAssignment,
  CreditLedgerEntry,
  CreditTransactionType,
  MembershipPlan,
  PlanAddOn,
  PlanCoupon,
  SubscriptionStatus,
} from '@/lib/types'

interface ClientStore {
  contacts: CmContact[]
  tags: ContactTag[]
  /** Membership product catalog (admin + account plan picker). */
  membershipPlans: MembershipPlan[]
  planAddOns: PlanAddOn[]
  planCoupons: PlanCoupon[]
  subscriptions: ContactSubscription[]
  packDefinitions: CmCreditPackDefinition[]
  documents: ClientDocument[]
  notes: ContactNote[]
  filteredContacts: (filters: ContactFilters) => CmContact[]
  addContact: (contact: CmContact) => void
  updateContact: (contactId: string, patch: Partial<CmContact>) => void
  deactivateContact: (contactId: string) => void
  addCredit: (contactId: string, entry: CreditLedgerEntry) => void
  deductCredit: (contactId: string, entry: CreditLedgerEntry) => void
  addTag: (tag: ContactTag) => void
  updateTag: (tagId: string, patch: Partial<ContactTag>) => void
  deleteTag: (tagId: string) => void
  assignTag: (contactId: string, tagId: string) => void
  removeTag: (contactId: string, assignmentId: string) => void
  enrollContact: (subscription: ContactSubscription) => void
  pauseSubscription: (subscriptionId: string) => void
  resumeSubscription: (subscriptionId: string) => void
  cancelSubscription: (subscriptionId: string) => void
  addMembershipPlan: (plan: MembershipPlan) => void
  addMembershipPlansBulk: (monthly: MembershipPlan, annual: MembershipPlan) => void
  updateMembershipPlan: (planId: string, patch: Partial<MembershipPlan>) => void
  addPlanAddOn: (row: PlanAddOn) => void
  updatePlanAddOn: (id: string, patch: Partial<PlanAddOn>) => void
  removePlanAddOn: (id: string) => void
  addPlanCoupon: (row: PlanCoupon) => void
  removePlanCoupon: (id: string) => void
  addPackDefinition: (def: CmCreditPackDefinition) => void
  updatePackDefinition: (
    id: string,
    patch: Partial<CmCreditPackDefinition>,
  ) => void
  purchasePack: (purchase: CreditLedgerEntry) => void
  signDocument: (contactId: string, documentId: string) => void
  addDocument: (doc: ClientDocument) => void
  updateDocument: (documentId: string, patch: Partial<ClientDocument>) => void
  removeDocument: (documentId: string) => void
  addNote: (note: ContactNote) => void
  addRelationship: (relationship: CmContactRelationship) => void
  removeRelationship: (contactId: string, relationshipId: string) => void
}

const ClientContext = createContext<ClientStore | null>(null)

function commitMembershipPlans(
  setMembershipPlans: Dispatch<SetStateAction<MembershipPlan[]>>,
  next: SetStateAction<MembershipPlan[]>,
): void {
  setMembershipPlans((prev) => {
    const resolved = typeof next === 'function' ? next(prev) : next
    persistMembershipPlans(resolved)
    return resolved
  })
}

export function ClientProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [contacts, setContacts] = useState<CmContact[]>(() =>
    initialCmContacts.map((c) => ({
      ...c,
      relationships: c.relationships?.map((r) => ({ ...r })),
    })),
  )
  const [contactsHydrated, setContactsHydrated] = useState(false)

  useEffect(() => {
    setContacts(loadInitialContacts(initialCmContacts))
    setContactsHydrated(true)
  }, [])

  useEffect(() => {
    if (!contactsHydrated) {
      return
    }
    persistContacts(contacts)
  }, [contacts, contactsHydrated])
  const [tags, setTags] = useState<ContactTag[]>(() =>
    initialTags.map((t) => ({ ...t })),
  )
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>(() =>
    initialMembershipPlans.map((p) => ({
      ...p,
      benefits: [...p.benefits],
    })),
  )
  useLayoutEffect(() => {
    setMembershipPlans(loadInitialMembershipPlans(initialMembershipPlans))
  }, [])
  const [planAddOns, setPlanAddOns] = useState<PlanAddOn[]>(() =>
    initialPlanAddOns.map((r) => ({ ...r })),
  )
  const [planCoupons, setPlanCoupons] = useState<PlanCoupon[]>(() =>
    initialPlanCoupons.map((r) => ({ ...r })),
  )
  const [packDefinitions, setPackDefinitions] = useState<
    CmCreditPackDefinition[]
  >(() => initialPackDefinitions.map((p) => ({ ...p })))
  const [documents, setDocuments] = useState<ClientDocument[]>(() =>
    initialClientDocuments.map((d) => ({ ...d })),
  )
  const [notes, setNotes] = useState<ContactNote[]>(() =>
    initialNotes.map((n) => ({ ...n })),
  )

  const [subscriptions, setSubscriptions] = useState<ContactSubscription[]>(
    () => initialCmContacts.flatMap((c) => c.subscriptions ?? []),
  )

  const value = useMemo<ClientStore>(() => {
    function filteredContacts(filters: ContactFilters): CmContact[] {
      return contacts.filter((c) => {
        if (filters.search) {
          const q = filters.search.toLowerCase()
          const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
          if (
            !fullName.includes(q) &&
            !(c.email ?? '').toLowerCase().includes(q) &&
            !(c.phone ?? '').toLowerCase().includes(q)
          ) {
            return false
          }
        }

        if (filters.contactTypes?.length) {
          if (!filters.contactTypes.includes(c.contactType)) return false
        }

        if (filters.tagIds?.length) {
          const cTagIds = (c.tags ?? []).map((t) => t.tagId)
          const hasAny = filters.tagIds.some((id) => cTagIds.includes(id))
          if (!hasAny) return false
        }

        if (filters.subscriptionStatuses?.length) {
          const subStatuses = (c.subscriptions ?? []).map((s) => s.status)
          const hasMatch = subStatuses.some((s) =>
            filters.subscriptionStatuses?.includes(s),
          )
          if (!hasMatch) return false
        }

        if (filters.hasActiveMembership !== undefined) {
          const hasActive = (c.subscriptions ?? []).some(
            (s) => s.status === 'ACTIVE' || s.status === 'TRIALING',
          )
          if (filters.hasActiveMembership !== hasActive) return false
        }

        if (filters.hasActivePack !== undefined) {
          const hasActivePack = (c.creditPacks ?? []).some(
            (p) => p.status === 'ACTIVE',
          )
          if (filters.hasActivePack !== hasActivePack) return false
        }

        return true
      })
    }

    function addContact(contact: CmContact) {
      setContacts((prev) => [contact, ...prev])
    }

    function updateContact(contactId: string, patch: Partial<CmContact>) {
      const updatedAt = new Date().toISOString()
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId ? { ...c, ...patch, updatedAt } : c,
        ),
      )
    }

    function deactivateContact(contactId: string) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                metadata: {
                  ...(c.metadata ?? { marketingOptIn: false }),
                  marketingOptIn: false,
                  notes: `${c.metadata?.notes ?? ''}\n[Deactivated]`.trim(),
                },
              }
            : c,
        ),
      )
    }

    function mutateCredit(
      contactId: string,
      entry: CreditLedgerEntry,
      kind: CreditTransactionType,
    ) {
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== contactId) return c
          const currentBalance = (c.creditLedger ?? [])[0]?.balanceAfter ?? 0
          const delta =
            kind === 'PURCHASE' || kind === 'MANUAL_ADD'
              ? Math.abs(entry.creditsChange)
              : -Math.abs(entry.creditsChange)
          const balanceAfter = currentBalance + delta
          const ledgerEntry: CreditLedgerEntry = {
            ...entry,
            transactionType: kind,
            creditsChange: delta,
            balanceAfter,
          }
          const creditLedger = [ledgerEntry, ...(c.creditLedger ?? [])]
          return { ...c, creditLedger }
        }),
      )
    }

    function addCredit(contactId: string, entry: CreditLedgerEntry) {
      mutateCredit(contactId, entry, 'MANUAL_ADD')
    }

    function deductCredit(contactId: string, entry: CreditLedgerEntry) {
      mutateCredit(contactId, entry, 'MANUAL_REMOVE')
    }

    function addTag(tag: ContactTag) {
      setTags((prev) => [tag, ...prev])
    }

    function updateTag(tagId: string, patch: Partial<ContactTag>) {
      setTags((prev) =>
        prev.map((t) => (t.id === tagId ? { ...t, ...patch } : t)),
      )
    }

    function deleteTag(tagId: string) {
      setTags((prev) => prev.filter((t) => t.id !== tagId))
      setContacts((prev) =>
        prev.map((c) => ({
          ...c,
          tags: (c.tags ?? []).filter((a) => a.tagId !== tagId),
        })),
      )
    }

    function assignTag(contactId: string, tagId: string) {
      const tag = tags.find((t) => t.id === tagId)
      if (!tag) return
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== contactId) return c
          const assignments = c.tags ?? []
          if (assignments.some((a) => a.tagId === tagId)) return c
          const assignment: ContactTagAssignment = {
            id: `cta-${contactId}-${tagId}-${Date.now()}`,
            tenantId: c.tenantId,
            contactId,
            tagId,
            tag,
            createdAt: new Date().toISOString(),
          }
          return { ...c, tags: [...assignments, assignment] }
        }),
      )
    }

    function removeTag(contactId: string, assignmentId: string) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                tags: (c.tags ?? []).filter((a) => a.id !== assignmentId),
              }
            : c,
        ),
      )
    }

    function enrollContact(subscription: ContactSubscription) {
      const plan = membershipPlans.find((p) => p.id === subscription.planId)
      const withPlan = plan ? { ...subscription, plan } : subscription
      setSubscriptions((prev) => [withPlan, ...prev])
      setContacts((prev) =>
        prev.map((c) =>
          c.id === subscription.contactId
            ? {
                ...c,
                subscriptions: [withPlan, ...(c.subscriptions ?? [])],
              }
            : c,
        ),
      )
    }

    function updateSubscriptionStatus(
      subscriptionId: string,
      nextStatus: SubscriptionStatus,
    ) {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === subscriptionId ? { ...s, status: nextStatus } : s,
        ),
      )
      setContacts((prev) =>
        prev.map((c) => {
          if (!c.subscriptions) return c
          return {
            ...c,
            subscriptions: c.subscriptions.map((s) =>
              s.id === subscriptionId ? { ...s, status: nextStatus } : s,
            ),
          }
        }),
      )
    }

    function pauseSubscription(subscriptionId: string) {
      updateSubscriptionStatus(subscriptionId, 'PAUSED')
    }

    function resumeSubscription(subscriptionId: string) {
      updateSubscriptionStatus(subscriptionId, 'ACTIVE')
    }

    function cancelSubscription(subscriptionId: string) {
      updateSubscriptionStatus(subscriptionId, 'CANCELLED')
    }

    function addMembershipPlan(plan: MembershipPlan) {
      commitMembershipPlans(setMembershipPlans, (prev) => [plan, ...prev])
    }

    function addMembershipPlansBulk(monthly: MembershipPlan, annual: MembershipPlan) {
      commitMembershipPlans(setMembershipPlans, (prev) => [monthly, annual, ...prev])
    }

    function updateMembershipPlan(planId: string, patch: Partial<MembershipPlan>) {
      const updatedAt = new Date().toISOString()
      commitMembershipPlans(setMembershipPlans, (prev) =>
        prev.map((p) =>
          p.id === planId ? { ...p, ...patch, updatedAt } : p,
        ),
      )
    }

    function addPlanAddOn(row: PlanAddOn) {
      setPlanAddOns((prev) => [row, ...prev])
    }

    function updatePlanAddOn(id: string, patch: Partial<PlanAddOn>) {
      setPlanAddOns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
    }

    function removePlanAddOn(id: string) {
      setPlanAddOns((prev) => prev.filter((r) => r.id !== id))
    }

    function addPlanCoupon(row: PlanCoupon) {
      setPlanCoupons((prev) => [row, ...prev])
    }

    function removePlanCoupon(id: string) {
      setPlanCoupons((prev) => prev.filter((r) => r.id !== id))
    }

    function addPackDefinition(def: CmCreditPackDefinition) {
      setPackDefinitions((prev) => [def, ...prev])
    }

    function updatePackDefinition(
      id: string,
      patch: Partial<CmCreditPackDefinition>,
    ) {
      setPackDefinitions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      )
    }

    function purchasePack(entry: CreditLedgerEntry) {
      addCredit(entry.contactId, entry)
    }

    function signDocument(contactId: string, documentId: string) {
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== contactId) return c
          const now = new Date().toISOString()
          const signatures = c.documents ?? []
          const existing = signatures.find((s) => s.documentId === documentId)
          if (existing) {
            const updated = signatures.map((s) =>
              s.documentId === documentId ? { ...s, signedAt: now } : s,
            )
            return { ...c, documents: updated }
          }
          const newSignature = {
            id: `sig-${contactId}-${documentId}`,
            tenantId: c.tenantId,
            documentId,
            contactId,
            signedAt: now,
          }
          return { ...c, documents: [newSignature, ...signatures] }
        }),
      )
    }

    function addDocument(doc: ClientDocument) {
      setDocuments((prev) => [doc, ...prev])
    }

    function updateDocument(documentId: string, patch: Partial<ClientDocument>) {
      const updatedAt = new Date().toISOString()
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, ...patch, updatedAt } : d)),
      )
    }

    function removeDocument(documentId: string) {
      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
    }

    function addNote(note: ContactNote) {
      setNotes((prev) => [note, ...prev])
    }

    function addRelationship(relationship: CmContactRelationship) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === relationship.contactId
            ? {
                ...c,
                relationships: [...(c.relationships ?? []), relationship],
              }
            : c,
        ),
      )
    }

    function removeRelationship(contactId: string, relationshipId: string) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                relationships: (c.relationships ?? []).filter(
                  (r) => r.id !== relationshipId,
                ),
              }
            : c,
        ),
      )
    }

    return {
      contacts,
      tags,
      membershipPlans,
      planAddOns,
      planCoupons,
      subscriptions,
      packDefinitions,
      documents,
      notes,
      filteredContacts,
      addContact,
      updateContact,
      deactivateContact,
      addCredit,
      deductCredit,
      addTag,
      updateTag,
      deleteTag,
      assignTag,
      removeTag,
      enrollContact,
      pauseSubscription,
      resumeSubscription,
      cancelSubscription,
      addMembershipPlan,
      addMembershipPlansBulk,
      updateMembershipPlan,
      addPlanAddOn,
      updatePlanAddOn,
      removePlanAddOn,
      addPlanCoupon,
      removePlanCoupon,
      addPackDefinition,
      updatePackDefinition,
      purchasePack,
      signDocument,
      addDocument,
      updateDocument,
      removeDocument,
      addNote,
      addRelationship,
      removeRelationship,
    }
  }, [
    contacts,
    tags,
    membershipPlans,
    planAddOns,
    planCoupons,
    packDefinitions,
    documents,
    notes,
    subscriptions,
  ])

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  )
}

export function useClients(): ClientStore {
  const ctx = useContext(ClientContext)
  if (!ctx) {
    throw new Error('useClients must be used within ClientProvider')
  }
  return ctx
}
