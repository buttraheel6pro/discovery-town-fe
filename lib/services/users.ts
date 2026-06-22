/** User management API integration for admin. */
import { apiClient } from '@/lib/api/client'

const USERS = '/users'

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`${USERS}/${id}`)
}
