/** ContactTypeBadge — colored badge per ContactType, mirroring ServiceTypeBadge. */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ContactType } from '@/lib/types'

const contactTypeStyles: Record<ContactType, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  CHILD: 'bg-emerald-100 text-emerald-700',
  CORPORATE: 'bg-violet-100 text-violet-700',
  LEAD: 'bg-amber-100 text-amber-700',
  VENDOR: 'bg-slate-100 text-slate-700',
  STAFF: 'bg-teal-100 text-teal-700',
}

const contactTypeLabels: Record<ContactType, string> = {
  CUSTOMER: 'Customer',
  CHILD: 'Child',
  CORPORATE: 'Corporate',
  LEAD: 'Lead',
  VENDOR: 'Vendor',
  STAFF: 'Staff',
}

export function ContactTypeBadge({
  contactType,
  className,
}: Readonly<{ contactType: ContactType; className?: string }>) {
  return (
    <Badge
      className={cn(
        'text-xs font-semibold',
        contactTypeStyles[contactType],
        className,
      )}
    >
      {contactTypeLabels[contactType]}
    </Badge>
  )
}

