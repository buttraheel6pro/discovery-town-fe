/** Edit role page — update role name and menu permissions in memory. */
'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { RolePermissionsSelector } from '@/components/admin/role-permissions-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRole, updateRole } from '@/lib/roles-memory'

export default function AdminEditRolePage() {
  const params = useParams<{ roleId: string }>()
  const router = useRouter()
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const roleId = params.roleId
  const role = getRole(roleId)

  useEffect(() => {
    if (!role) {
      setIsLoaded(true)
      return
    }
    setName(role.name)
    setPermissions(role.permissions ?? [])
    setIsLoaded(true)
  }, [role])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!role || !name.trim()) {
      return
    }

    updateRole(role.id, name, permissions)
    router.push('/admin/scheduling/roles')
  }

  if (isLoaded && !role) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Role not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This role is unavailable in the current session.
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/scheduling/roles">Back to roles</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit role</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the selected role name.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter role name"
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <RolePermissionsSelector
              selectedPermissions={permissions}
              onChange={setPermissions}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/scheduling/roles">Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
