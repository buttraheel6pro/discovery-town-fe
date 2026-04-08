/** Account family page — manage child and family member profiles. */
'use client'

import { useState } from 'react'
import Link from 'next/link'

import { CrudModal } from '@/components/admin/crud-modal'
import { CustomerNavbar } from '@/components/customer/navbar'
import { CustomerFooter } from '@/components/customer/footer'
import { FamilyMemberCard } from '@/components/customer/family-member-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClients } from '@/lib/client-store'
import type { CmContact } from '@/lib/types'

export default function AccountFamilyPage() {
  const { contacts, addContact } = useClients()
  const children = contacts.filter((c) => c.contactType === 'CHILD')

  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medicalNotes, setMedicalNotes] = useState('')

  function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!firstName || !lastName) return

    const nowIso = new Date().toISOString()
    const newContact: CmContact = {
      id: `cm-family-${Date.now()}`,
      tenantId: 'tenant-1',
      contactType: 'CHILD',
      firstName,
      lastName,
      dateOfBirth: dob || undefined,
      gender: 'OTHER',
      metadata: {
        marketingOptIn: false,
        allergies: allergies || undefined,
        medicalNotes: medicalNotes || undefined,
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

    addContact(newContact)
    setFirstName('')
    setLastName('')
    setDob('')
    setAllergies('')
    setMedicalNotes('')
    setOpen(false)
  }

  return (
    <>
      <CustomerNavbar />
      <main className="py-10">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: 'var(--font-barlow)' }}
              >
                Family
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage children and family members that you book activities for.
              </p>
            </div>
            <Link href="/account">
              <Button variant="ghost" size="sm">
                Back to dashboard
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Add each child so we can track ages, allergies, and the right activities.
            </p>
            <Button type="button" size="sm" onClick={() => setOpen(true)}>
              Add family member
            </Button>
          </div>

          <CrudModal
            open={open}
            onOpenChange={setOpen}
            title="Add family member"
            description="We use this for age-appropriate activities and safety."
            size="md"
            variant="create"
            footer={
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" form="account-family-add-form">
                  Save
                </Button>
              </>
            }
          >
            <form id="account-family-add-form" onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(event) => setDob(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  value={allergies}
                  onChange={(event) => setAllergies(event.target.value)}
                  placeholder="e.g. Peanuts, dairy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalNotes">Medical notes</Label>
                <Textarea
                  id="medicalNotes"
                  rows={3}
                  value={medicalNotes}
                  onChange={(event) => setMedicalNotes(event.target.value)}
                />
              </div>
            </form>
          </CrudModal>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Family members</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have not added any family members yet. Use &quot;Add family member&quot; to
                  create a child profile.
                </p>
              ) : (
                children.map((child) => (
                  <FamilyMemberCard
                    key={child.id}
                    contact={child}
                    emergencyContactName={undefined}
                    emergencyContactPhone={undefined}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <CustomerFooter />
    </>
  )
}
