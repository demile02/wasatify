import type { AppRole, JsonValue } from '@/lib/types';

export type QuickAccessRole = Extract<AppRole, 'student' | 'teacher'>;

export type QuickAccessItem = {
  key: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: string;
};

export type QuickAccessPreferences = Partial<Record<QuickAccessRole, string[]>>;

export const quickAccessLimits = {
  min: 3,
  max: 5,
} as const;

export const studentQuickAccessItems: QuickAccessItem[] = [
  { key: 'dashboard', label: 'Beranda', shortLabel: 'Beranda', href: '/student/dashboard', icon: 'Home' },
  { key: 'modules', label: 'Modul', shortLabel: 'Modul', href: '/student/modules', icon: 'BookOpen' },
  { key: 'quizzes', label: 'Kuis', shortLabel: 'Kuis', href: '/student/quizzes', icon: 'ClipboardCheck' },
  { key: 'reflection', label: 'Refleksi', shortLabel: 'Refleksi', href: '/student/reflection', icon: 'MessageSquareText' },
  { key: 'progress', label: 'Progress', shortLabel: 'Progress', href: '/student/progress', icon: 'BarChart3' },
  { key: 'announcements', label: 'Pengumuman', shortLabel: 'Info', href: '/student/announcements', icon: 'Megaphone' },
  { key: 'messages', label: 'Pesan', shortLabel: 'Pesan', href: '/student/messages', icon: 'Mail' },
  { key: 'certificates', label: 'Sertifikat', shortLabel: 'Sertifikat', href: '/student/certificates', icon: 'Award' },
  { key: 'settings', label: 'Pengaturan', shortLabel: 'Atur', href: '/student/settings', icon: 'Settings' },
];

export const teacherQuickAccessItems: QuickAccessItem[] = [
  { key: 'dashboard', label: 'Beranda', shortLabel: 'Beranda', href: '/teacher/dashboard', icon: 'Home' },
  { key: 'classes', label: 'Kelas', shortLabel: 'Kelas', href: '/teacher/classes', icon: 'Users' },
  { key: 'modules', label: 'Modul', shortLabel: 'Modul', href: '/teacher/modules', icon: 'BookOpen' },
  { key: 'quizzes', label: 'Kuis', shortLabel: 'Kuis', href: '/teacher/quizzes', icon: 'ClipboardCheck' },
  { key: 'reports', label: 'Laporan', shortLabel: 'Laporan', href: '/teacher/reports', icon: 'BarChart3' },
  { key: 'reflections', label: 'Refleksi', shortLabel: 'Refleksi', href: '/teacher/reflections', icon: 'MessageSquareText' },
  { key: 'announcements', label: 'Pengumuman', shortLabel: 'Info', href: '/teacher/announcements', icon: 'Megaphone' },
  { key: 'media', label: 'Media', shortLabel: 'Media', href: '/teacher/media', icon: 'ImageIcon' },
  { key: 'messages', label: 'Pesan', shortLabel: 'Pesan', href: '/teacher/messages', icon: 'Mail' },
  { key: 'settings', label: 'Pengaturan', shortLabel: 'Atur', href: '/teacher/settings', icon: 'Settings' },
];

export const defaultStudentQuickAccess = ['dashboard', 'modules', 'quizzes', 'reflection', 'progress'];
export const defaultTeacherQuickAccess = ['dashboard', 'classes', 'modules', 'quizzes', 'reports'];

export function getQuickAccessItems(role: QuickAccessRole) {
  return role === 'student' ? studentQuickAccessItems : teacherQuickAccessItems;
}

export function getDefaultQuickAccessKeys(role: QuickAccessRole) {
  return role === 'student' ? defaultStudentQuickAccess : defaultTeacherQuickAccess;
}

export function getQuickAccessKeys(
  preferences: QuickAccessPreferences | JsonValue | null | undefined,
  role: QuickAccessRole,
) {
  const availableItems = getQuickAccessItems(role);
  const availableKeys = new Set(availableItems.map((item) => item.key));
  const fallback = getDefaultQuickAccessKeys(role);
  const rawKeys = isQuickAccessPreferences(preferences) ? preferences[role] : null;

  if (!Array.isArray(rawKeys)) return fallback;

  const sanitizedKeys = rawKeys.filter((key, index, keys): key is string =>
    typeof key === 'string' && availableKeys.has(key) && keys.indexOf(key) === index,
  );

  if (sanitizedKeys.length < quickAccessLimits.min || sanitizedKeys.length > quickAccessLimits.max) {
    return fallback;
  }

  return sanitizedKeys;
}

export function getQuickAccessNavItems(
  preferences: QuickAccessPreferences | JsonValue | null | undefined,
  role: QuickAccessRole,
) {
  const items = getQuickAccessItems(role);
  const itemMap = new Map(items.map((item) => [item.key, item]));
  return getQuickAccessKeys(preferences, role)
    .map((key) => itemMap.get(key))
    .filter((item): item is QuickAccessItem => Boolean(item));
}

export function mergeQuickAccessPreferences(
  current: QuickAccessPreferences | JsonValue | null | undefined,
  role: QuickAccessRole,
  keys: string[],
): QuickAccessPreferences {
  return {
    ...(isQuickAccessPreferences(current) ? current : {}),
    [role]: keys,
  };
}

function isQuickAccessPreferences(value: QuickAccessPreferences | JsonValue | null | undefined): value is QuickAccessPreferences {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
