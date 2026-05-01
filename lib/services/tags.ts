/** Tags API service for listing contact tags. */
import { apiClient } from '@/lib/api/client'
import { API_PATHS } from '@/lib/constants/api'
import {
  apiTagSchema,
  createTagRequestSchema,
  tagsListSchema,
  type ApiTag,
  type TagsListResponse,
} from '@/lib/schemas/tags/list'
import type {
  ContactTag,
  CreateTagPayload,
  ListTagsParams,
  ListTagsResult,
  UpdateTagPayload,
} from '@/lib/types'

function normalizeParams(params: ListTagsParams): Required<ListTagsParams> {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }
}

function mapResponseToTags(parsed: TagsListResponse): ContactTag[] {
  const rows = Array.isArray(parsed) ? parsed : parsed.data
  return rows.map(mapApiTagToContactTag)
}

function mapApiTagToContactTag(row: ApiTag): ContactTag {
  return {
    id: row.id,
    tenantId: '',
    name: row.name,
    color: row.color,
    isAuto: row.isAuto,
    isSystem: row.isAuto,
    description: undefined,
    contactCount: row.contactCount ?? 0,
  }
}

export async function listTags(params: ListTagsParams = {}): Promise<ListTagsResult> {
  const normalized = normalizeParams(params)
  const response = await apiClient.get(API_PATHS.tags, {
    params: normalized,
  })
  const parsed = tagsListSchema.parse(response.data)

  return {
    tags: mapResponseToTags(parsed),
    meta: Array.isArray(parsed) ? null : (parsed.meta ?? null),
  }
}

export async function createTag(payload: CreateTagPayload): Promise<ContactTag> {
  const parsedPayload = createTagRequestSchema.parse(payload)
  const response = await apiClient.post(API_PATHS.tags, parsedPayload)

  const raw = response.data as unknown
  const parsed = apiTagSchema.safeParse(raw)
  if (parsed.success) {
    return mapApiTagToContactTag(parsed.data)
  }

  const wrapped = apiTagSchema.safeParse(
    typeof raw === 'object' && raw !== null && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw,
  )
  if (!wrapped.success) {
    throw new Error('Invalid create tag response')
  }

  return mapApiTagToContactTag(wrapped.data)
}

export async function updateTag(
  tagId: string,
  payload: UpdateTagPayload,
): Promise<ContactTag> {
  const parsedPayload = createTagRequestSchema.parse(payload)
  const response = await apiClient.patch(`${API_PATHS.tags}/${tagId}`, parsedPayload)

  const raw = response.data as unknown
  const parsed = apiTagSchema.safeParse(raw)
  if (parsed.success) {
    return mapApiTagToContactTag(parsed.data)
  }

  const wrapped = apiTagSchema.safeParse(
    typeof raw === 'object' && raw !== null && 'data' in raw
      ? (raw as { data: unknown }).data
      : raw,
  )
  if (!wrapped.success) {
    throw new Error('Invalid update tag response')
  }

  return mapApiTagToContactTag(wrapped.data)
}
