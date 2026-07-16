'use client'

import { useUser } from '@/lib/auth-context'
import { can, PERMISSIONS, UserRole } from '@/lib/permissions'

export function useRole() {
  const { profile } = useUser()
  const role = (profile?.role as UserRole) || 'viewer'

  return {
    role,
    loading: false,
    isAdmin: role === 'admin',
    isEditor: role === 'editor' || role === 'admin',
    isWriter: role === 'writer' || role === 'editor' || role === 'admin',
    canCreateDoc: can(role, PERMISSIONS.CREATE_DOC),
    canPublishDoc: can(role, PERMISSIONS.PUBLISH_DOC),
    canDeleteAnyDoc: can(role, PERMISSIONS.DELETE_ANY_DOC),
    canManageCategories: can(role, PERMISSIONS.MANAGE_CATEGORIES),
    canManageTags: can(role, PERMISSIONS.MANAGE_TAGS),
    canManageNavigation: can(role, PERMISSIONS.MANAGE_NAVIGATION),
    canManageForms: can(role, PERMISSIONS.MANAGE_FORMS),
    canManageMedia: can(role, PERMISSIONS.MANAGE_MEDIA),
    canViewReviewQueue: can(role, PERMISSIONS.VIEW_REVIEW_QUEUE),
  }
}
