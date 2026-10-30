import type { LandingFeature, NavigationItem } from '@/lib/types';

export const publicNavigation: NavigationItem[] = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Untuk siapa', href: '#untuk-siapa' },
  { label: 'Tentang', href: '#tentang' },
];

export const studentNavigation: NavigationItem[] = [
  { label: 'Beranda', href: '/student/dashboard', icon: 'Home' },
  { label: 'Modul Belajar', href: '/student/modules', icon: 'BookOpen' },
  { label: 'Kuis', href: '/student/quizzes', icon: 'ClipboardCheck' },
  { label: 'Tugas', href: '/student/tasks', icon: 'ClipboardList' },
  { label: 'Refleksi Diri', href: '/student/reflection', icon: 'MessageSquareText' },
  { label: 'Progress', href: '/student/progress', icon: 'BarChart3' },
  { label: 'Pengumuman', href: '/student/announcements', icon: 'Megaphone' },
  { label: 'Pesan', href: '/student/messages', icon: 'Mail' },
  { label: 'Pengaturan', href: '/student/settings', icon: 'Settings' },
];

export const teacherNavigation: NavigationItem[] = [
  { label: 'Beranda', href: '/teacher/dashboard', icon: 'Home' },
  { label: 'Kelas Saya', href: '/teacher/classes', icon: 'Users' },
  { label: 'Modul', href: '/teacher/modules', icon: 'BookOpen' },
  { label: 'Kuis', href: '/teacher/quizzes', icon: 'ClipboardCheck' },
  { label: 'Tugas', href: '/teacher/tasks', icon: 'ClipboardList' },
  { label: 'Siswa', href: '/teacher/students', icon: 'GraduationCap' },
  { label: 'Refleksi', href: '/teacher/reflections', icon: 'MessageSquareText' },
  { label: 'Laporan', href: '/teacher/reports', icon: 'FileText' },
  { label: 'Pengumuman', href: '/teacher/announcements', icon: 'Megaphone' },
  { label: 'Media', href: '/teacher/media', icon: 'ImageIcon' },
  { label: 'Pesan', href: '/teacher/messages', icon: 'Mail' },
  { label: 'Pengaturan', href: '/teacher/settings', icon: 'Settings' },
];

export const landingFeatures: LandingFeature[] = [
  {
    title: 'Materi Ringkas',
    description: 'Konten pendek, terstruktur, dan mudah dipahami sesuai nilai Islam Wasathiyah.',
    icon: 'BookOpen',
  },
  {
    title: 'Kuis Interaktif',
    description: 'Uji pemahaman dengan pertanyaan singkat, skor, dan umpan balik langsung.',
    icon: 'CheckCircle2',
  },
  {
    title: 'Refleksi Diri',
    description: 'Bantu siswa menghubungkan pembelajaran dengan tindakan nyata sehari-hari.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Progress Belajar',
    description: 'Pantau capaian siswa dan kelas dengan data yang rapi dan mudah dibaca.',
    icon: 'BarChart3',
  },
];
