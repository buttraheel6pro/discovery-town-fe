/** Roles page — list and delete roles with route-based create and edit. */
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'

import { CrudModal } from '@/components/admin/crud-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPermissionLabel } from '@/lib/constants/role-permissions'
import { deleteRole, listRoles, type RoleRecord } from '@/lib/roles-memory'

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [search, setSearch] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    setRoles(listRoles())
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return roles
    }
    return roles.filter((role) => {
      const nameMatches = role.name.toLowerCase().includes(query)
      if (nameMatches) {
        return true
      }
      return (role.permissions ?? []).some((permission) =>
        getPermissionLabel(permission).toLowerCase().includes(query),
      )
    })
  }, [roles, search])

  const selectedRole = useMemo(() => {
    if (!selectedRoleId) {
      return null
    }
    return roles.find((role) => role.id === selectedRoleId) ?? null
  }, [roles, selectedRoleId])

  function requestDelete(roleId: string): void {
    setSelectedRoleId(roleId)
    setDeleteOpen(true)
  }

  function confirmDelete(): void {
    if (!selectedRole) {
      return
    }
    deleteRole(selectedRole.id)
    setRoles(listRoles())
    setDeleteOpen(false)
    setSelectedRoleId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/scheduling"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Schedule Events
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Roles</h1>
          <p className="text-muted-foreground">Simple client-side role list and CRUD.</p>
        </div>
        <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
          <Link href="/admin/scheduling/roles/new">Create role</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full max-w-md">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles..."
                aria-label="Search roles"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'role' : 'roles'}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium text-foreground">{role.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(role.permissions ?? []).length === 0 ? (
                      'No permissions'
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span>{(role.permissions ?? []).length} selected</span>
                        <span className="text-xs">
                          {(role.permissions ?? [])
                            .slice(0, 2)
                            .map((permission) => getPermissionLabel(permission))
                            .join(', ')}
                          {(role.permissions ?? []).length > 2 ? ', ...' : ''}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link href={`/admin/scheduling/roles/${role.id}`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => requestDelete(role.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CrudModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) {
            setSelectedRoleId(null)
          }
        }}
        title="Delete role"
        description="This action cannot be undone."
        size="sm"
        variant="delete"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Delete <span className="font-semibold text-foreground">{selectedRole?.name ?? 'role'}</span>?
        </p>
      </CrudModal>
    </div>
  )
}
