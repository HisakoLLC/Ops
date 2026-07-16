export type UserRole = 'admin' | 'editor' | 'writer' | 'member' | 'viewer';

export const PERMISSIONS = {
  // CMS Permissions
  CREATE_DOC: ['admin', 'editor', 'writer', 'member'] as UserRole[],
  EDIT_ANY_DOC: ['admin', 'editor'] as UserRole[],
  PUBLISH_DOC: ['admin', 'editor'] as UserRole[],
  DELETE_ANY_DOC: ['admin', 'editor'] as UserRole[],
  MANAGE_CATEGORIES: ['admin', 'editor'] as UserRole[],
  MANAGE_TAGS: ['admin', 'editor'] as UserRole[],
  MANAGE_NAVIGATION: ['admin', 'editor'] as UserRole[],
  MANAGE_FORMS: ['admin', 'editor'] as UserRole[],
  MANAGE_MEDIA: ['admin', 'editor', 'writer'] as UserRole[],
  VIEW_REVIEW_QUEUE: ['admin', 'editor'] as UserRole[],
  // Admin Permissions
  MANAGE_TEAM: ['admin'] as UserRole[],
  MANAGE_FINANCE: ['admin'] as UserRole[],
  ACCESS_SETTINGS: ['admin', 'editor'] as UserRole[],
};

export function can(role: string | undefined | null, permission: UserRole[]): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  return permission.includes(role as UserRole);
}
