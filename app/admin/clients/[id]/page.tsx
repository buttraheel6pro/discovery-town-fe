/** Admin client detail — sidebar + tabbed CRM workspace. */
'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { AddCreditModal } from '@/components/admin/add-credit-modal'
import { ClientNotesList } from '@/components/admin/client-notes-list'
import { CapacityRing } from '@/components/admin/capacity-ring'
import { DocumentSubTypeBadge } from '@/components/admin/document-sub-type-badge'
import { BookingHistoryCard } from '@/components/customer/booking-history-card'
import { ContactAvatar } from '@/components/customer/contact-avatar'
import { ContactTypeBadge } from '@/components/customer/contact-type-badge'
import { CreditPackCard } from '@/components/customer/credit-pack-card'
import { MembershipCard } from '@/components/customer/membership-card'
import { SignDocumentWidget } from '@/components/customer/sign-document-widget'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClients } from '@/lib/client-store'
import { useScheduling } from '@/lib/scheduling-store'
import { isDocumentSignedAndValid } from '@/lib/utils'
import type { ClientDocument, DocumentType } from '@/lib/types'
import { ChevronLeft } from 'lucide-react'

const documentTypeLabel: Record<DocumentType, string> = {
  WAIVER: 'Waiver',
  PARENTAL_CONSENT: 'Parental consent',
  MEMBERSHIP_TERMS: 'Membership terms',
  FACILITY_RULES: 'Facility rules',
  CONTRACT: 'Contract',
  CUSTOM: 'Custom',
}

export default function AdminClientDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const {
    contacts,
    documents,
    membershipPlans,
    notes,
    addCredit,
    addNote,
    signDocument,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
  } = useClients()
  const { bookings } = useScheduling()

  const contact = contacts.find((c) => c.id === id)
  const [creditOpen, setCreditOpen] = useState(false)
  const [signDoc, setSignDoc] = useState<ClientDocument | null>(null)

  const clientBookings = useMemo(() => {
    if (!contact) return []
    const fullName = `${contact.firstName} ${contact.lastName}`
    return bookings.filter(
      (b) => b.contactId === contact.id || b.contactName === fullName,
    )
  }, [bookings, contact])

  const creditBalance = contact?.creditLedger?.[0]?.balanceAfter ?? 0
  const activeSub = contact?.subscriptions?.find(
    (s) =>
      s.status === 'ACTIVE' ||
      s.status === 'TRIALING' ||
      s.status === 'PAUSED',
  )

  const packForSlot =
    contact && contact.creditPacks?.length
      ? contact.creditPacks[0]
      : null
  const ringBooked =
    packForSlot && packForSlot.creditsPurchased > 0
      ? packForSlot.creditsPurchased - packForSlot.creditsRemaining
      : 0
  const ringCap = packForSlot?.creditsPurchased ?? 1

  if (!contact) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Contact not found.</p>
        <Link href="/admin/clients">
          <Button variant="outline" size="sm">
            Back to clients
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/clients">
          <Button variant="ghost" size="sm" className="gap-1 pl-0">
            <ChevronLeft className="h-4 w-4" />
            Clients
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <Card className="h-fit lg:sticky lg:top-4">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col items-center text-center gap-2">
              <ContactAvatar
                firstName={contact.firstName}
                lastName={contact.lastName}
                imageUrl={contact.avatarUrl}
                contactType={contact.contactType}
                className="h-16 w-16"
              />
              <h1
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                {contact.firstName} {contact.lastName}
              </h1>
              <ContactTypeBadge contactType={contact.contactType} />
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Contact
              </p>
              <p>{contact.email ?? '—'}</p>
              <p>{contact.phone ?? '—'}</p>
              <p className="text-xs text-muted-foreground">
                {contact.city ?? ''} {contact.postcode ?? ''}
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Credits
                </p>
                <p className="text-2xl font-bold tabular-nums">{creditBalance}</p>
              </div>
              <CapacityRing booked={ringBooked} capacity={ringCap} size="sm" />
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() => setCreditOpen(true)}
            >
              Add credit
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="family" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="family">Family</TabsTrigger>
            <TabsTrigger value="waivers">Waivers</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="packs">Class packs</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="family" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relationships</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(contact.relationships ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No linked contacts.
                  </p>
                ) : (
                  (contact.relationships ?? []).map((r) => {
                    const other = contacts.find((c) => c.id === r.relatedContactId)
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          {other ? (
                            <Link
                              href={`/admin/clients/${other.id}`}
                              className="text-sm font-medium hover:text-accent"
                            >
                              {other.firstName} {other.lastName}
                            </Link>
                          ) : (
                            <span className="text-sm">{r.relatedContactId}</span>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {r.relationshipType}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waivers" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documents.map((doc) => {
                  const ok = isDocumentSignedAndValid(contact.documents, doc.id)
                  const requiredBy =
                    doc.documentSubType === 'HOST'
                      ? 'Organiser'
                      : doc.documentSubType === 'GUEST'
                        ? 'Participant'
                        : null
                  return (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {documentTypeLabel[doc.documentType]}
                        </p>
                        {requiredBy ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            Required by: {requiredBy}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <DocumentSubTypeBadge subType={doc.documentSubType} />
                        {ok ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Signed</Badge>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setSignDoc(doc)}
                          >
                            Sign as client
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership">
            {activeSub ? (
              <MembershipCard
                plan={
                  membershipPlans.find((p) => p.id === activeSub.planId) ??
                  membershipPlans[0]
                }
                subscription={activeSub}
                onPause={pauseSubscription}
                onResume={resumeSubscription}
                onCancel={cancelSubscription}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No active membership.</p>
            )}
          </TabsContent>

          <TabsContent value="packs" className="grid gap-4 md:grid-cols-2">
            {(contact.creditPacks ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No class packs.</p>
            ) : (
              (contact.creditPacks ?? []).map((p) => (
                <CreditPackCard key={p.id} purchase={p} />
              ))
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3">
            {clientBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings.</p>
            ) : (
              clientBookings.map((b) => (
                <BookingHistoryCard key={b.id} booking={b} />
              ))
            )}
          </TabsContent>

          <TabsContent value="notes">
            <ClientNotesList
              notes={notes}
              contactId={contact.id}
              onAddNote={(content) =>
                addNote({
                  id: `note-${contact.id}-${Date.now()}`,
                  tenantId: contact.tenantId,
                  contactId: contact.id,
                  authorName: 'Admin',
                  content,
                  isPinned: false,
                  createdAt: new Date().toISOString(),
                })
              }
            />
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Audit log integration pending — no entries in mock data.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddCreditModal
        open={creditOpen}
        onOpenChange={setCreditOpen}
        onSubmit={(amount, reason) => {
          const entry = {
            id: `cl-${contact.id}-${Date.now()}`,
            tenantId: contact.tenantId,
            contactId: contact.id,
            transactionType: 'MANUAL_ADD' as const,
            creditsChange: amount,
            balanceAfter: 0,
            description: reason || 'Manual credit',
            createdAt: new Date().toISOString(),
          }
          addCredit(contact.id, entry)
          setCreditOpen(false)
        }}
      />

      <Dialog open={signDoc !== null} onOpenChange={() => setSignDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{signDoc?.title ?? 'Document'}</DialogTitle>
          </DialogHeader>
          {signDoc ? (
            <SignDocumentWidget
              documentTitle={signDoc.title}
              documentHtml={signDoc.description ?? ''}
              onSubmit={() => {
                signDocument(contact.id, signDoc.id)
                setSignDoc(null)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
