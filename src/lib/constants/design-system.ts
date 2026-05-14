import type { AppRole, ModuleStatus, StatusMeta } from '@/lib/types';

export const brandColors = {
  primaryEmerald: '#006B4F',
  darkEmerald: '#00483A',
  mint: '#E6F4ED',
  cream: '#FFF8EA',
  gold: '#C98A1A',
  textDark: '#102A2A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  surface: '#FFFFFF',
  background: '#F8FAF7',
} as const;

export const moduleStatuses: Record<ModuleStatus, StatusMeta> = {
  completed: {
    label: 'Selesai',
    description: 'Modul sudah dituntaskan.',
    className: 'border-primary/15 bg-mint text-primary',
  },
  in_progress: {
    label: 'In Progress',
    description: 'Modul sedang dipelajari.',
    className: 'border-gold/20 bg-cream text-gold',
  },
  not_started: {
    label: 'Belum Dimulai',
    description: 'Modul belum mulai dipelajari.',
    className: 'border-border bg-white text-muted-foreground',
  },
  locked: {
    label: 'Terkunci',
    description: 'Selesaikan modul sebelumnya untuk membuka.',
    className: 'border-border bg-muted text-muted-foreground',
  },
};

export const roleLabels: Record<AppRole, StatusMeta> = {
  student: {
    label: 'Siswa',
    className: 'border-primary/15 bg-mint text-primary',
  },
  teacher: {
    label: 'Guru',
    className: 'border-gold/20 bg-cream text-gold',
  },
  admin: {
    label: 'Admin',
    className: 'border-border bg-muted text-foreground',
  },
};
