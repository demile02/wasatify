import type { AppRole } from '@/lib/types';

export const roleDashboardPath: Record<AppRole, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/teacher/dashboard',
};

export function getRoleDashboardPath(role?: AppRole | null) {
  if (!role) return '/login';
  return roleDashboardPath[role] ?? '/login';
}

export function isAppRole(value: unknown): value is AppRole {
  return value === 'student' || value === 'teacher' || value === 'admin';
}
