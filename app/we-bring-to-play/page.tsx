/** Dedicated route for off-site mobile play service requests. */
import { Suspense } from 'react'

import { WeBringOffsitePage } from '@/components/customer/we-bring-offsite-page'
import { WE_BRING_PLAY_PRODUCT_IDS } from '@/lib/we-bring-play-offerings'

const PLAY_EVENT_TYPE_OPTIONS = [
  'Playdate',
  'School Event',
  'Community Activation',
  'Family Gathering',
]

export default function WeBringToPlayPage() {
  return (
    <Suspense fallback={null}>
      <WeBringOffsitePage
        pageEyebrow="We Bring Play To You"
        pageTitle="WE BRING PLAY TO YOU"
        pageDescription="Choose inflatables, games, entertainment, and party setup — we deliver to your venue."
        equipmentSectionTitle="We Bring Play To You"
        equipmentSectionDescription="Select the services you need, then complete your inquiry."
        bundleName="We Bring The Play To You Items"
        requestType="WE_BRING_PLAY"
        productIds={WE_BRING_PLAY_PRODUCT_IDS}
        eventTypeOptions={PLAY_EVENT_TYPE_OPTIONS}
      />
    </Suspense>
  )
}
