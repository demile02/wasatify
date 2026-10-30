import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
} from 'lucide-react';

export const features = [
  { title: 'Materi Singkat', text: 'Pembelajaran mikro yang fokus, padat, dan mudah dipahami.', icon: BookOpen, color: 'emerald' },
  { title: 'Interaktif', text: 'Quiz, refleksi, dan aktivitas ringan untuk pengalaman belajar aktif.', icon: Video, color: 'gold' },
  { title: 'Fleksibel', text: 'Belajar kapan saja dari dashboard web yang nyaman di mobile.', icon: CheckCircle2, color: 'sky' },
  { title: 'Berbasis Nilai', text: 'Konten menumbuhkan sikap moderat, toleran, dan berakhlak.', icon: HeartHandshake, color: 'violet' },
];

export const modules = [
  {
    id: 1,
    title: 'Apa Itu Islam Wasathiyah?',
    description: 'Memahami makna wasathiyah sebagai jalan tengah yang adil dan berimbang.',
    duration: '12 menit',
    progress: 100,
    locked: false,
    status: 'Selesai',
    accent: 'emerald',
  },
  {
    id: 2,
    title: 'Prinsip Moderasi Beragama',
    description: 'Mengenal tawazun, tasamuh, i’tidal, dan syura dalam kehidupan sehari-hari.',
    duration: '20 menit',
    progress: 60,
    locked: false,
    status: 'Berjalan',
    accent: 'gold',
  },
  {
    id: 3,
    title: 'Bahaya Ekstremisme Digital',
    description: 'Belajar memilah informasi keagamaan di media sosial secara kritis.',
    duration: '15 menit',
    progress: 0,
    locked: false,
    status: 'Belum mulai',
    accent: 'teal',
  },
  {
    id: 4,
    title: 'Islam dan Toleransi',
    description: 'Membangun adab berbeda pendapat dan hidup damai di masyarakat majemuk.',
    duration: '18 menit',
    progress: 0,
    locked: true,
    status: 'Terkunci',
    accent: 'slate',
  },
  {
    id: 5,
    title: 'Refleksi Nilai',
    description: 'Menulis pemahaman diri dan rencana aksi sebagai pribadi moderat.',
    duration: '10 menit',
    progress: 0,
    locked: true,
    status: 'Terkunci',
    accent: 'rose',
  },
  {
    id: 6,
    title: 'Quiz Pemahaman',
    description: 'Uji pemahaman nilai-nilai Islam Wasathiyah secara interaktif.',
    duration: '8 menit',
    progress: 0,
    locked: true,
    status: 'Terkunci',
    accent: 'purple',
  },
];

export const quizQuestions = [
  {
    question: 'Manakah yang termasuk contoh sikap tasamuh dalam kehidupan sehari-hari?',
    answers: [
      'Memaksakan pendapat kepada orang lain',
      'Menghargai perbedaan pendapat dan keyakinan',
      'Menganggap diri paling benar',
      'Menghindari diskusi dengan orang berbeda pendapat',
    ],
    correct: 1,
    explanation: 'Tasamuh berarti toleran, lapang dada, dan menghargai perbedaan dengan tetap memegang prinsip kebaikan.',
  },
  {
    question: 'Apa makna tawazun dalam prinsip moderasi beragama?',
    answers: [
      'Keseimbangan antara ilmu, amal, dunia, dan akhirat',
      'Mengikuti semua informasi tanpa memeriksa sumber',
      'Menolak semua perbedaan',
      'Mengutamakan emosi saat berdakwah',
    ],
    correct: 0,
    explanation: 'Tawazun menuntun seseorang bersikap seimbang dan tidak berlebihan.',
  },
];

export const studentStats = [
  { label: 'Modul', value: '6', hint: 'Total modul', icon: BookOpen },
  { label: 'Selesai', value: '3', hint: 'Modul tuntas', icon: CheckCircle2 },
  { label: 'Hari Streak', value: '12', hint: 'Pertahankan', icon: Flame },
  { label: 'XP', value: '1250', hint: 'Total poin', icon: Trophy },
];

export const teacherStats = [
  { label: 'Total Modul', value: '12', hint: 'Modul aktif', icon: BookOpen },
  { label: 'Total Siswa', value: '156', hint: 'Dalam 6 kelas', icon: Users },
  { label: 'Tingkat Penyelesaian', value: '78%', hint: 'Rata-rata kelas', icon: BarChart3 },
  { label: 'Kuis Dibuat', value: '24', hint: 'Total kuis', icon: ClipboardCheck },
];

export const achievements = [
  { title: 'Peacemaker', text: 'Menyelesaikan modul toleransi', icon: ShieldCheck },
  { title: '7 Hari Konsisten', text: 'Belajar satu pekan penuh', icon: Flame },
  { title: 'Reflektif', text: 'Menulis 3 refleksi bermakna', icon: Sparkles },
  { title: 'Quiz Master', text: 'Skor kuis di atas 80', icon: Award },
];

export const classProgress = [
  ['X IPA 1', 85, '32/38 siswa'],
  ['X IPS 1', 76, '28/37 siswa'],
  ['XI IPA 1', 72, '30/42 siswa'],
  ['XI IPS 2', 68, '25/37 siswa'],
  ['XII IPA 1', 81, '29/36 siswa'],
  ['XII IPS 1', 75, '24/32 siswa'],
];

export const activities = [
  'Aisyah Putri menyelesaikan kuis Prinsip Moderasi Beragama',
  'Fahri Ramadhan mengunggah refleksi Modul 1',
  'Modul Bahaya Ekstremisme Digital baru dipublikasikan',
  'Pengumuman diskusi kelas XI dibuat',
];
