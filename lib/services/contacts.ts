/** Contacts API integration for admin CRM management. */
import { apiClient } from '@/lib/api/client'
import { extractListRows } from '@/lib/api/pagination'
import { API_PATHS } from '@/lib/constants/api'

export interface CreateContactPayload {
  contactType: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dob?: string
  address?: string
  marketingOptIn?: boolean
  preferredChannel?: string
  metadata?: Record<string, string | number | boolean | null>
  parentContactId?: string
}

export interface ApiContact {
  id: string
  tenantId: string
  contactType: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
}

export interface AddCreditPayload {
  amount: number
  reason: string
}

export interface AddRelationshipPayload {
  otherContactId: string
  relationshipType: string
}

export async function listContacts(params?: {
  q?: string
  page?: number
  limit?: number
  isActive?: boolean
}): Promise<ApiContact[]> {
  const response = await apiClient.get(API_PATHS.contacts, {
    params: { limit: 100, ...params },
  })
  return extractListRows<ApiContact>(response.data)
}

export async function createContact(payload: CreateContactPayload): Promise<ApiContact> {
  const response = await apiClient.post(API_PATHS.contacts, payload)
  return response.data as ApiContact
}

export async function updateContact(
  id: string,
  patch: Partial<CreateContactPayload> & { isActive?: boolean },
): Promise<ApiContact> {
  const response = await apiClient.patch(`${API_PATHS.contacts}/${id}`, patch)
  return response.data as ApiContact
}

export async function assignTagToContact(contactId: string, tagId: string): Promise<void> {
  await apiClient.post(`${API_PATHS.contacts}/${contactId}/tags`, { tagId })
}

export async function addContactCredit(
  contactId: string,
  payload: AddCreditPayload,
): Promise<void> {
  await apiClient.post(`${API_PATHS.contacts}/${contactId}/credits/add`, payload)
}

export async function addContactRelationship(
  contactId: string,
  payload: AddRelationshipPayload,
): Promise<void> {
  await apiClient.post(`${API_PATHS.contacts}/${contactId}/relationships`, payload)
}
