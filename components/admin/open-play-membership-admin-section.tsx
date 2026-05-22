/** Open Play admin — membership / seasonal passes (plans), not scheduling services. */
'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Infinity } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useClients } from '@/lib/client-store'
import { filterMembershipPlansForPassKind } from '@/lib/open-play-pass-catalog'
import {
  OPEN_PLAY_MEMBERSHIP_OFFERS,
  resolveOfferDisplayPrice,
  type OpenPlayMembershipOffer,
} from '@/lib/open-play-membership-offers'
import { formatPrice } from '@/lib/utils'

const OPEN_PLAY_CATEGORY_ID = 'cat-open-play'

function AdminMembershipOfferCard({
  offer,
  planNames,
}: Readonly<{
  offer: OpenPlayMembershipOffer
  planNames: readonly string[]
}>) {
  const { membershipPlans } = useClients()
  const { price, suffix } = resolveOfferDisplayPrice(membershipPlans, offer.kind)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-32 bg-secondary">
          {offer.imageUrl ? (
            <Image
              src={offer.imageUrl}
              alt={offer.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{offer.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {offer.description}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/admin/memberships">Manage plans</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Infinity className="h-3 w-3" aria-hidden />
              Membership product
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              No slots
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              from {formatPrice(price)}
              {suffix}
            </span>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground">
              Plans on Play → Open Play ({planNames.length})
            </p>
            {planNames.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {planNames.map((name) => (
                  <li key={name} className="truncate">
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                No active plans placed here. Create or edit a plan in Memberships and set
                category to Play with sub-category Open Play.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export interface OpenPlayMembershipAdminSectionProps {
  readonly className?: string
}

export function OpenPlayMembershipAdminSection({
  className,
}: Readonly<OpenPlayMembershipAdminSectionProps>) {
  const { membershipPlans } = useClients()

  const plansByOffer = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const offer of OPEN_PLAY_MEMBERSHIP_OFFERS) {
      const names = filterMembershipPlansForPassKind(
        membershipPlans,
        offer.kind,
        'play',
        OPEN_PLAY_CATEGORY_ID,
      ).map((plan) => plan.name)
      map.set(offer.id, names)
    }
    return map
  }, [membershipPlans])

  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Membership passes</h3>
          <p className="text-xs text-muted-foreground">
            Shown on the customer Play → Open Play page. Managed as membership plans, not
            events or slots.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/memberships">Manage memberships</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPEN_PLAY_MEMBERSHIP_OFFERS.map((offer) => (
          <AdminMembershipOfferCard
            key={offer.id}
            offer={offer}
            planNames={plansByOffer.get(offer.id) ?? []}
          />
        ))}
      </div>
    </section>
  )
}
