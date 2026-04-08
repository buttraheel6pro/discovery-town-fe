/** FamilyMemberCard — summary card for a related child/family member. */
'use client'

import { Phone } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactAvatar } from '@/components/customer/contact-avatar'
import { ContactTypeBadge } from '@/components/customer/contact-type-badge'
import { getContactAgeSuffix } from '@/lib/utils'
import type { CmContact } from '@/lib/types'

interface FamilyMemberCardProps {
  readonly contact: CmContact
  readonly emergencyContactName?: string
  readonly emergencyContactPhone?: string
}

export function FamilyMemberCard({
  contact,
  emergencyContactName,
  emergencyContactPhone,
}: Readonly<FamilyMemberCardProps>) {
  const ageSuffix = getContactAgeSuffix(contact.dateOfBirth)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <ContactAvatar
          firstName={contact.firstName}
          lastName={contact.lastName}
          imageUrl={contact.avatarUrl}
          contactType={contact.contactType}
        />
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-semibold">
            {contact.firstName} {contact.lastName}
            <span className="text-xs text-muted-foreground">{ageSuffix}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <ContactTypeBadge contactType={contact.contactType} />
            {contact.metadata?.allergies ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                Allergies: {contact.metadata.allergies}
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        {contact.metadata?.medicalNotes ? (
          <p className="leading-snug">{contact.metadata.medicalNotes}</p>
        ) : null}

        {emergencyContactName || emergencyContactPhone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-amber-600" />
            <span>
              Emergency: {emergencyContactName ?? 'Parent/guardian'}{' '}
              {emergencyContactPhone ? `· ${emergencyContactPhone}` : null}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

