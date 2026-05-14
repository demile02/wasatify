import type { LandingFeature, LandingStat, NavigationItem } from '@/lib/types';

export const publicNavigation: NavigationItem[] = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Fitur', href: '#fitur' },
  { label: 'Modul', href: '#modul' },
  { label: 'Tentang', href: '#tentang' },
  { label: 'Testimoni', href: '#testimoni' },
  { label: 'Kontak', href: '#kontak' },
];

export const studentNavigation: NavigationItem[] = [
  { label: 'Beranda', href: '/student/dashboard', icon: 'Home' },
  { label: 'Modul Belajar', href: '/student/modules', icon: 'BookOpen' },
  { label: 'Kuis', href: '/student/modules/islam-wasathiyah-pengantar/quiz', icon: 'ClipboardCheck' },
  { label: 'Tugas', href: '/student/tasks', icon: 'ClipboardList' },
  { label: 'Refleksi Diri', href: '/student/reflection', icon: 'MessageSquareText' },
  { label: 'Progress', href: '/student/progress', icon: 'BarChart3' },
  { label: 'Sertifikat', href: '/student/certificates', icon: 'Award' },
  { label: 'Pengumuman', href: '/student/announcements', icon: 'Megaphone' },
  { label: 'Pesan', href: '/student/messages', icon: 'Mail' },
  { label: 'Pengaturan', href: '/student/profile', icon: 'Settings' },
];

export const teacherNavigation: NavigationItem[] = [
  { label: 'Beranda', href: '/teacher/dashboard', icon: 'Home' },
  { label: 'Kelas Saya', href: '/teacher/classes', icon: 'Users' },
  { label: 'Modul', href: '/teacher/modules', icon: 'BookOpen' },
  { label: 'Kuis', href: '/teacher/quizzes', icon: 'ClipboardCheck' },
  { label: 'Siswa', href: '/teacher/students', icon: 'GraduationCap' },
  { label: 'Laporan', href: '/teacher/reports', icon: 'FileText' },
  { label: 'Pengumuman', href: '/teacher/announcements', icon: 'Megaphone' },
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

export const landingStats: LandingStat[] = [
  { value: '120+', label: 'Modul Pembelajaran' },
  { value: '25.000+', label: 'Siswa Aktif' },
  { value: '80.000+', label: 'Kuis Dikerjakan' },
  { value: '87%', label: 'Tingkat Penyelesaian' },
];
