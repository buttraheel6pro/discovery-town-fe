/** Redirect legacy scheduling calendar URL to unified admin calendar. */
import { redirect } from 'next/navigation'

export default function AdminSchedulingCalendarRedirectPage() {
  redirect('/admin/calendar')
}
