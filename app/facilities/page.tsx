/** Legacy facilities route — redirects to the unified Play page. */
import { redirect } from 'next/navigation'

export default function FacilitiesPage() {
  redirect('/play')
}
