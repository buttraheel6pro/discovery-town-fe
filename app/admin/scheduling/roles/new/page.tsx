/** Create role page — name + menu permissions using in-memory role records. */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { RolePermissionsSelector } from '@/components/admin/role-permissions-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createRole } from '@/lib/roles-memory'

export default function AdminCreateRolePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!name.trim()) {
      return
    }

    createRole(name, permissions)
    router.push('/admin/scheduling/roles')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create role</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a role by entering its name.
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
            Create role
          </Button>
        </div>
      </form>
    </div>
  )
}
