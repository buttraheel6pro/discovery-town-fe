/** Deep link to utilisation heatmap — unified calendar page. */
import { redirect } from 'next/navigation'

export default function AdminCalendarAvailabilityRedirectPage() {
  redirect('/admin/calendar?view=heatmap')
}
