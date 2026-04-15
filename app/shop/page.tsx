/** Legacy shop route — redirects to the new Store experience. */
import { redirect } from 'next/navigation'

export default function ShopPage() {
  redirect('/store/shop')
}
