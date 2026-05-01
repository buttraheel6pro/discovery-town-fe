/** Roles memory store — temporary in-memory records shared across roles pages. */

export interface RoleRecord {
  id: string
  name: string
  permissions: string[]
}

let rolesMemory: RoleRecord[] = []

export function listRoles(): RoleRecord[] {
  return rolesMemory
}

export function createRole(name: string, permissions: string[] = []): RoleRecord {
  const role: RoleRecord = {
    id: `role-${Math.random().toString(16).slice(2, 10)}`,
    name: name.trim(),
    permissions,
  }
  rolesMemory = [role, ...rolesMemory]
  return role
}

export function updateRole(
  roleId: string,
  name: string,
  permissions: string[] = [],
): RoleRecord | null {
  let updated: RoleRecord | null = null
  rolesMemory = rolesMemory.map((role) => {
    if (role.id !== roleId) {
      return role
    }
    updated = {
      ...role,
      name: name.trim(),
      permissions,
    }
    return updated
  })
  return updated
}

export function deleteRole(roleId: string): void {
  rolesMemory = rolesMemory.filter((role) => role.id !== roleId)
}

export function getRole(roleId: string): RoleRecord | null {
  return rolesMemory.find((role) => role.id === roleId) ?? null
}
