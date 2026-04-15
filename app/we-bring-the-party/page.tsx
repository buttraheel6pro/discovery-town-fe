/** Dedicated route for off-site party service requests. */
import { WeBringOffsitePage } from '@/components/customer/we-bring-offsite-page'

const PARTY_EVENT_TYPE_OPTIONS = ['Birthday', 'School Fair', 'Community Event', 'Corporate Family Day']

export default function WeBringThePartyPage() {
  return (
    <WeBringOffsitePage
      pageEyebrow="Off-site Party Support"
      pageTitle="WE BRING THE PARTY"
      pageDescription="Select party-ready equipment and submit one complete off-site inquiry."
      equipmentSectionTitle="Party equipment options"
      equipmentSectionDescription="Choose your setup items first, then complete the event details."
      bundleName="We Bring The Party To You Items"
      requestType="WE_BRING_PARTY"
      productIds={[
        'prod-we-bring-bouncy-castle',
        'prod-we-bring-speaker-kit',
        'prod-takeout-balloon-bouquet',
        'prod-takeout-cupcakes',
      ]}
      eventTypeOptions={PARTY_EVENT_TYPE_OPTIONS}
    />
  )
}
