/** Dedicated route for off-site mobile play service requests. */
import { WeBringOffsitePage } from '@/components/customer/we-bring-offsite-page'

const PLAY_EVENT_TYPE_OPTIONS = ['Playdate', 'School Event', 'Community Activation', 'Family Gathering']

export default function WeBringToPlayPage() {
  return (
    <WeBringOffsitePage
      pageEyebrow="Mobile Play Experiences"
      pageTitle="WE BRING THE PLAY"
      pageDescription="Build a portable play experience with activity-focused rentals for your location."
      equipmentSectionTitle="Play experience options"
      equipmentSectionDescription="Pick your play setup, then share details so our team can plan delivery."
      bundleName="We Bring The Play To You Items"
      requestType="WE_BRING_PLAY"
      productIds={[
        'prod-2',
        'prod-3',
        'prod-kids-furniture-set',
        'prod-takeout-pizza-tray',
      ]}
      eventTypeOptions={PLAY_EVENT_TYPE_OPTIONS}
    />
  )
}
