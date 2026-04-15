/** Backward-compatible route redirect for old party URL. */
import { redirect } from 'next/navigation'

export default function LegacyWeBringThePartyPage() {
  redirect('/we-bring-the-party')
}
