import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'
import { AdminAuthGuard } from '@/components/admin/admin-auth-guard'

export const metadata = {
  title: 'Admin Dashboard | Discovery Town Complex',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="bg-background min-h-screen">
        <AdminSidebar />
        <AdminHeader />
        <main className="ml-64 mt-16 p-8">{children}</main>
      </div>
    </AdminAuthGuard>
  )
}
