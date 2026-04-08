/** ContactAvatar — avatar with initials and contact-type-based color. */
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getContactInitials } from '@/lib/utils'
import type { ContactType } from '@/lib/types'

interface ContactAvatarProps {
  readonly firstName?: string
  readonly lastName?: string
  readonly imageUrl?: string
  readonly contactType: ContactType
  readonly className?: string
}

const contactTypeBg: Record<ContactType, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  CHILD: 'bg-emerald-100 text-emerald-800',
  CORPORATE: 'bg-violet-100 text-violet-800',
  LEAD: 'bg-amber-100 text-amber-800',
  VENDOR: 'bg-slate-100 text-slate-800',
  STAFF: 'bg-teal-100 text-teal-800',
}

export function ContactAvatar({
  firstName,
  lastName,
  imageUrl,
  contactType,
  className,
}: Readonly<ContactAvatarProps>) {
  const initials = getContactInitials(firstName, lastName)

  return (
    <Avatar className={cn('h-10 w-10 border border-border', className)}>
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={initials || `${firstName} ${lastName}`} />
      ) : null}
      <AvatarFallback
        className={cn(
          'text-xs font-semibold uppercase',
          contactTypeBg[contactType],
        )}
      >
        {initials || 'CT'}
      </AvatarFallback>
    </Avatar>
  )
}

