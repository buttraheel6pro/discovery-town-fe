/** Admin new contact — multi-section CRM create form. */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ContactSearchCombobox } from '@/components/admin/contact-search-combobox'
import { TagSelector } from '@/components/admin/tag-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useClients } from '@/lib/client-store'
import type { CmContact, ContactType, RelationshipType } from '@/lib/types'

export default function AdminNewClientPage() {
  const router = useRouter()
  const { addContact, assignTag, addRelationship, contacts, tags } = useClients()

  const [contactType, setContactType] = useState<ContactType>('CUSTOMER')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(true)
  const [preferredChannel, setPreferredChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP'>('EMAIL')
  const [allergies, setAllergies] = useState('')
  const [medicalNotes, setMedicalNotes] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [yearGroup, setYearGroup] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [relatedContactId, setRelatedContactId] = useState<string | undefined>()
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType>('PARENT_CHILD')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    const now = new Date().toISOString()
    const id = `cm-${Date.now()}`
    const contact: CmContact = {
      id,
      tenantId: 'tenant-1',
      contactType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dateOfBirth: dob || undefined,
      addressLine1: addressLine1.trim() || undefined,
      city: city.trim() || undefined,
      postcode: postcode.trim() || undefined,
      metadata: {
        marketingOptIn,
        preferredChannel,
        notes: notes.trim() || undefined,
        allergies: contactType === 'CHILD' ? allergies.trim() || undefined : undefined,
        medicalNotes:
          contactType === 'CHILD' ? medicalNotes.trim() || undefined : undefined,
        schoolName: contactType === 'CHILD' ? schoolName.trim() || undefined : undefined,
        yearGroup: contactType === 'CHILD' ? yearGroup.trim() || undefined : undefined,
      },
      tags: [],
      relationships: [],
      subscriptions: [],
      creditPacks: [],
      creditLedger: [],
      documents: [],
      createdAt: now,
      updatedAt: now,
    }

    addContact(contact)
    selectedTagIds.forEach((tagId) => assignTag(id, tagId))

    if (relatedContactId) {
      const rel = {
        id: `rel-${id}-${relatedContactId}-${Date.now()}`,
        tenantId: 'tenant-1',
        contactId: relatedContactId,
        relatedContactId: id,
        relationshipType,
        createdAt: now,
      }
      addRelationship(rel)
    }

    router.push(`/admin/clients/${id}`)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-barlow)' }}
          >
            New contact
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a client record and optionally link to an existing contact.
          </p>
        </div>
        <Link href="/admin/clients">
          <Button type="button" variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={contactType}
              onValueChange={(v) => setContactType(v as ContactType)}
              className="grid gap-2 sm:grid-cols-2"
            >
              {(
                [
                  'CUSTOMER',
                  'CHILD',
                  'CORPORATE',
                  'LEAD',
                ] as ContactType[]
              ).map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer"
                >
                  <RadioGroupItem value={t} id={`type-${t}`} />
                  <span className="text-sm font-medium">{t}</span>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="fn">First name</Label>
              <Input
                id="fn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ln">Last name</Label>
              <Input
                id="ln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="addr">Address</Label>
              <Input
                id="addr"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="post">Postcode</Label>
              <Input
                id="post"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {contactType === 'CHILD' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Child metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="med">Medical notes</Label>
                <Textarea
                  id="med"
                  rows={3}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="yr">Year group</Label>
                <Input
                  id="yr"
                  value={yearGroup}
                  onChange={(e) => setYearGroup(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="mkt"
                checked={marketingOptIn}
                onCheckedChange={(v) => setMarketingOptIn(v === true)}
              />
              <Label htmlFor="mkt">Marketing opt-in</Label>
            </div>
            <div className="space-y-1 max-w-xs">
              <Label>Preferred channel</Label>
              <Select
                value={preferredChannel}
                onValueChange={(v) =>
                  setPreferredChannel(v as 'EMAIL' | 'SMS' | 'WHATSAPP')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <TagSelector
              allTags={tags}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optional relationship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Link this new profile to an existing contact (e.g. parent for a child).
            </p>
            <ContactSearchCombobox
              contacts={contacts}
              value={relatedContactId}
              onChange={setRelatedContactId}
            />
            <div className="space-y-1 max-w-xs">
              <Label>Relationship</Label>
              <Select
                value={relationshipType}
                onValueChange={(v) => setRelationshipType(v as RelationshipType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARENT_CHILD">Parent / child</SelectItem>
                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                  <SelectItem value="EMERGENCY_CONTACT">Emergency contact</SelectItem>
                  <SelectItem value="CORPORATE_MEMBER">Corporate member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-2">
          <Link href="/admin/clients">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit">Create contact</Button>
        </div>
      </form>
    </div>
  )
}
