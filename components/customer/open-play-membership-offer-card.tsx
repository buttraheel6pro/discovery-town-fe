/** Open Play membership / seasonal offer card — matches ServiceScrollCard layout. */
'use client'

import { Clock3, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/customer/listing-card'
import {
  resolveOfferDisplayPrice,
  type OpenPlayMembershipOffer,
} from '@/lib/open-play-membership-offers'
import { useClients } from '@/lib/client-store'
export interface OpenPlayMembershipOfferCardProps {
  readonly offer: OpenPlayMembershipOffer
}

export function OpenPlayMembershipOfferCard({
  offer,
}: Readonly<OpenPlayMembershipOfferCardProps>) {
  const { membershipPlans } = useClients()
  const { price, suffix } = resolveOfferDisplayPrice(membershipPlans, offer.kind)

  return (
    <div className="flex w-[280px] shrink-0 snap-start self-stretch sm:w-[300px]">
      <ListingCard
        fillHeight
        className="w-full"
        href={`/facilities/${offer.id}`}
        title={offer.name}
        description={offer.description}
        imageUrl={offer.imageUrl}
        topLeft={
          <Badge className="bg-accent text-[10px] font-semibold text-accent-foreground">
            {offer.categoryName}
          </Badge>
        }
        bottomRight={
          <span className="rounded-md bg-black/70 px-2.5 py-1 text-sm font-bold text-white">
            ${price}
            {suffix}
          </span>
        }
        meta={
          <div className="flex min-h-[4.25rem] flex-col justify-start space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <span>Unlimited play — no slots</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>Household plans</span>
            </p>
          </div>
        }
        footer={
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            View details
          </Button>
        }
      />
    </div>
  )
}
