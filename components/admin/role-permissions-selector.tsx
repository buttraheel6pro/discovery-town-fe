/** IAM-style permissions selector — grouped menu permissions with checkbox controls. */
'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  ROLE_PERMISSION_GROUPS,
  type RolePermissionGroup,
} from '@/lib/constants/role-permissions'

interface RolePermissionsSelectorProps {
  readonly selectedPermissions: string[]
  readonly onChange: (nextPermissions: string[]) => void
}

function getGroupState(group: RolePermissionGroup, selected: Set<string>) {
  const total = group.permissions.length
  const selectedCount = group.permissions.filter((permission) => selected.has(permission.key)).length
  const allSelected = selectedCount === total
  const indeterminate = selectedCount > 0 && selectedCount < total
  return {
    allSelected,
    indeterminate,
  }
}

export function RolePermissionsSelector({
  selectedPermissions,
  onChange,
}: Readonly<RolePermissionsSelectorProps>) {
  const selectedSet = new Set(selectedPermissions)

  function togglePermission(permissionKey: string, checked: boolean): void {
    if (checked) {
      onChange(Array.from(new Set([...selectedPermissions, permissionKey])))
      return
    }
    onChange(selectedPermissions.filter((permission) => permission !== permissionKey))
  }

  function toggleGroup(group: RolePermissionGroup, checked: boolean): void {
    const keys = group.permissions.map((permission) => permission.key)
    if (checked) {
      onChange(Array.from(new Set([...selectedPermissions, ...keys])))
      return
    }
    onChange(selectedPermissions.filter((permission) => !keys.includes(permission)))
  }

  return (
    <div className="space-y-4">
      {ROLE_PERMISSION_GROUPS.map((group) => {
        const groupState = getGroupState(group, selectedSet)
        return (
          <div key={group.key} className="rounded-md border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Checkbox
                id={`group-${group.key}`}
                checked={groupState.indeterminate ? 'indeterminate' : groupState.allSelected}
                onCheckedChange={(checked) => toggleGroup(group, checked === true)}
              />
              <Label htmlFor={`group-${group.key}`} className="font-semibold text-foreground">
                {group.label}
              </Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.permissions.map((permission) => (
                <label key={permission.key} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={selectedSet.has(permission.key)}
                    onCheckedChange={(checked) => togglePermission(permission.key, checked === true)}
                  />
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
