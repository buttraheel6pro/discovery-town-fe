/** Schema and types for authenticated user profile (`/auth/me`). */
import { z } from 'zod'

import type {
  AuthPermission,
  AuthRole,
  AuthUserRolePermission,
  AuthUserSettings,
  CurrentUserProfile,
  MeResponse,
} from '@/lib/types'

const permissionSchema: z.ZodType<AuthPermission> = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  module: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  appComponentId: z.number().nullable(),
  roleId: z.number(),
})

const roleSchema: z.ZodType<AuthRole> = z.object({
  id: z.number(),
  tenantId: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  isSystemRole: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

const userRolePermissionSchema: z.ZodType<AuthUserRolePermission> = z.object({
  id: z.number(),
  userId: z.number(),
  roleId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  role: roleSchema,
})

const userSettingsSchema: z.ZodType<AuthUserSettings> = z.object({
  id: z.number(),
  isTwoFactorAuth: z.boolean(),
  userId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const meResponseSchema: z.ZodType<MeResponse> = z.object({
  id: z.number(),
  tenantId: z.string(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  salt: z.string(),
  isActive: z.boolean(),
  googleSocialId: z.string().nullable(),
  facebookSocialId: z.string().nullable(),
  storage_preference: z.string(),
  languagePreference: z.string(),
  loginAttempts: z.number(),
  lockedUntil: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  userSettings: userSettingsSchema,
  permissions: z.array(permissionSchema),
  userRolePermission: z.array(userRolePermissionSchema),
})

export const currentUserProfileSchema: z.ZodType<CurrentUserProfile> =
  meResponseSchema.transform((payload) => ({
    id: payload.id,
    tenantId: payload.tenantId,
    name: payload.name,
    email: payload.email,
    isActive: payload.isActive,
    storagePreference: payload.storage_preference,
    languagePreference: payload.languagePreference,
    loginAttempts: payload.loginAttempts,
    lockedUntil: payload.lockedUntil,
    lastLoginAt: payload.lastLoginAt,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    deletedAt: payload.deletedAt,
    userSettings: payload.userSettings,
    permissions: payload.permissions,
    userRolePermission: payload.userRolePermission,
  }))
