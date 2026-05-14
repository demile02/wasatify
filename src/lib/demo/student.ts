import type { Profile } from '@/lib/types';

export type StudentModule = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'locked';
  orderIndex?: number;
  lessonsCount: number;
  duration: string;
  progress: number;
  imageSrc?: string;
  completedAt?: string;
  lastAccessedAt?: string;
};

export type StudentActivity = {
  title: string;
  time: string;
  type: 'quiz' | 'reflection' | 'module';
};

export const demoStudentProfile: Profile = {
  id: 'demo-student',
  role: 'student',
  full_name: 'Ahmad Fauzan',
  email: 'siswa@wasatify.demo',
  class_name: 'VIII A',
};

export const demoStudentModules: StudentModule[] = [
  {
    id: 'islam-wasathiyah-pengantar',
    slug: 'islam-wasathiyah-pengantar',
    title: 'Islam Wasathiyah: Pengantar',
    description: 'Memahami konsep dasar Islam Wasathiyah dan relevansinya di zaman modern.',
    status: 'completed',
    orderIndex: 1,
    lessonsCount: 6,
    duration: '30 menit',
    progress: 100,
  },
  {
    id: 'alquran-dan-sunnah-sebagai-pedoman-hidup',
    slug: 'alquran-dan-sunnah-sebagai-pedoman-hidup',
    title: "Al-Qur'an dan Sunnah sebagai Pedoman Hidup",
    description: "Menjadikan Al-Qur'an dan Sunnah sebagai sumber utama dalam kehidupan.",
    status: 'in_progress',
    orderIndex: 2,
    lessonsCount: 8,
    duration: '40 menit',
    progress: 60,
  },
  {
    id: 'akhlak-dalam-islam',
    slug: 'akhlak-dalam-islam',
    title: 'Akhlak dalam Islam',
    description: 'Membangun karakter mulia berdasarkan nilai-nilai Islam sehari-hari.',
    status: 'not_started',
    orderIndex: 3,
    lessonsCount: 7,
    duration: '35 menit',
    progress: 0,
  },
  {
    id: 'fiqih-ibadah',
    slug: 'fiqih-ibadah',
    title: 'Fiqih Ibadah',
    description: 'Memahami aturan dan tata cara ibadah dalam Islam secara ringkas.',
    status: 'not_started',
    orderIndex: 4,
    lessonsCount: 10,
    duration: '50 menit',
    progress: 0,
  },
  {
    id: 'muamalah-dan-kehidupan-sosial',
    slug: 'muamalah-dan-kehidupan-sosial',
    title: 'Muamalah dan Kehidupan Sosial',
    description: 'Belajar bermuamalah dengan baik dalam kehidupan sosial sehari-hari.',
    status: 'locked',
    orderIndex: 5,
    lessonsCount: 9,
    duration: '45 menit',
    progress: 0,
  },
  {
    id: 'islam-dan-lingkungan',
    slug: 'islam-dan-lingkungan',
    title: 'Islam dan Lingkungan',
    description: 'Menjaga alam sebagai bagian dari ibadah dan amanah Allah SWT.',
    status: 'locked',
    orderIndex: 6,
    lessonsCount: 6,
    duration: '30 menit',
    progress: 0,
  },
];

export const demoStudentActivities: StudentActivity[] = [
  { title: 'Menyelesaikan kuis "Hikmah di Balik Perbedaan"', time: '2 jam lalu', type: 'quiz' },
  { title: 'Mengumpulkan refleksi harian', time: '5 jam lalu', type: 'reflection' },
  { title: 'Menyelesaikan materi "Islam Wasathiyah"', time: '1 hari lalu', type: 'module' },
];
