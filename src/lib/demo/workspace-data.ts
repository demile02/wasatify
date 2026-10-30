export type DemoLesson = {
  id: string;
  title: string;
  duration: string;
  content: string;
};

export type DemoModule = {
  id: string;
  title: string;
  category: string;
  description: string;
  lessons: DemoLesson[];
};

export const studentDemoModules: DemoModule[] = [
  {
    id: 'tawazun',
    title: 'Tawazun dalam Keseharian',
    category: 'Akhlak',
    description: 'Belajar menjaga keseimbangan ibadah, belajar, keluarga, dan kehidupan sosial.',
    lessons: [
      {
        id: 'tawazun-meaning',
        title: 'Makna tawazun',
        duration: '5 menit',
        content: 'Tawazun berarti menjaga keseimbangan antara dunia dan akhirat, ibadah dan usaha, serta hak diri sendiri dan hak orang lain. Keseimbangan membantu kita mengambil keputusan tanpa berlebihan.',
      },
      {
        id: 'tawazun-study',
        title: 'Mengatur waktu dengan seimbang',
        duration: '4 menit',
        content: 'Membuat jadwal belajar yang baik juga memberi ruang untuk ibadah, istirahat, keluarga, dan tanggung jawab lain. Kebiasaan kecil yang dijalankan konsisten lebih mudah dipertahankan.',
      },
      {
        id: 'tawazun-practice',
        title: 'Latihan dalam kehidupan sehari-hari',
        duration: '3 menit',
        content: 'Pilih satu kegiatan yang perlu diseimbangkan minggu ini. Tentukan waktu yang realistis, jalankan dengan disiplin, lalu tinjau kembali apakah jadwal tersebut terasa adil bagi diri sendiri dan orang lain.',
      },
    ],
  },
  {
    id: 'wasathiyah',
    title: 'Islam Wasathiyah: Pengantar',
    category: 'Wasathiyah',
    description: 'Memahami sikap adil, seimbang, dan membawa rahmat dalam kehidupan.',
    lessons: [
      {
        id: 'wasathiyah-meaning',
        title: 'Makna Islam Wasathiyah',
        duration: '6 menit',
        content: 'Islam Wasathiyah mengajak umat untuk bersikap seimbang, adil, dan membawa rahmat. Pelajar dapat memahami agama dengan jernih, tidak berlebihan, serta menerapkan nilainya dalam kehidupan sehari-hari.',
      },
      {
        id: 'wasathiyah-principles',
        title: 'Adil dan menghargai perbedaan',
        duration: '5 menit',
        content: 'Sikap moderat menumbuhkan keadilan, toleransi, dan tanggung jawab. Kita dapat menghargai perbedaan sambil tetap berpegang pada prinsip yang diyakini.',
      },
    ],
  },
  {
    id: 'adab-digital',
    title: 'Adab Belajar Digital',
    category: 'Adab',
    description: 'Menerapkan tanggung jawab dan kesantunan saat belajar di ruang digital.',
    lessons: [
      {
        id: 'adab-digital-1',
        title: 'Bertanggung jawab di ruang digital',
        duration: '5 menit',
        content: 'Periksa kebenaran informasi sebelum membagikannya, gunakan bahasa yang santun, dan hargai karya orang lain. Sikap ini menjaga ruang belajar tetap aman dan bermanfaat.',
      },
      {
        id: 'adab-digital-2',
        title: 'Menjaga fokus saat belajar',
        duration: '4 menit',
        content: 'Tentukan tujuan sebelum membuka aplikasi belajar. Jauhkan gangguan yang tidak perlu dan gunakan waktu layar untuk kegiatan yang mendukung tujuan tersebut.',
      },
    ],
  },
];

export type DemoQuizQuestion = {
  prompt: string;
  options: { id: string; text: string }[];
  answer: string;
  explanation: string;
};

export const studentDemoQuiz: DemoQuizQuestion[] = [
  {
    prompt: 'Apa makna tawazun dalam kehidupan seorang muslim?',
    options: [
      { id: 'a', text: 'Mengutamakan urusan dunia saja.' },
      { id: 'b', text: 'Menjaga keseimbangan antara berbagai tanggung jawab.' },
      { id: 'c', text: 'Menghindari semua urusan sosial.' },
      { id: 'd', text: 'Melakukan segala hal secara berlebihan.' },
      { id: 'e', text: 'Menyerahkan semua tanggung jawab kepada orang lain.' },
    ],
    answer: 'b',
    explanation: 'Tawazun mengajarkan keseimbangan, misalnya antara ibadah dan usaha serta hak diri dan orang lain.',
  },
  {
    prompt: 'Contoh sikap adil saat berdiskusi dengan teman adalah ...',
    options: [
      { id: 'a', text: 'Mendengarkan pendapat teman sebelum menanggapi.' },
      { id: 'b', text: 'Memotong pembicaraan agar pendapat sendiri didengar.' },
      { id: 'c', text: 'Menyebarkan pendapat teman tanpa izin.' },
      { id: 'd', text: 'Menolak berbicara dengan orang yang berbeda pendapat.' },
      { id: 'e', text: 'Memilih teman hanya yang selalu setuju.' },
    ],
    answer: 'a',
    explanation: 'Mendengarkan dengan baik memberi kesempatan yang setara dan membantu memahami konteks pendapat orang lain.',
  },
  {
    prompt: 'Sikap yang tepat ketika menemui perbedaan pendapat adalah ...',
    options: [
      { id: 'a', text: 'Memaksa teman mengikuti pendapat kita.' },
      { id: 'b', text: 'Menghentikan diskusi dengan ejekan.' },
      { id: 'c', text: 'Menghargai perbedaan dan berdialog dengan santun.' },
      { id: 'd', text: 'Menyebarkan kesalahan teman di media sosial.' },
      { id: 'e', text: 'Menghindari semua orang yang berbeda.' },
    ],
    answer: 'c',
    explanation: 'Tasamuh mendorong sikap saling menghormati dan dialog yang santun tanpa merendahkan orang lain.',
  },
  {
    prompt: 'Jadwal harian yang mencerminkan tawazun sebaiknya ...',
    options: [
      { id: 'a', text: 'Hanya berisi kegiatan belajar tanpa istirahat.' },
      { id: 'b', text: 'Mengutamakan hiburan dan menunda kewajiban.' },
      { id: 'c', text: 'Mengabaikan waktu bersama keluarga.' },
      { id: 'd', text: 'Memberi ruang bagi belajar, ibadah, istirahat, dan tanggung jawab.' },
      { id: 'e', text: 'Berubah setiap saat tanpa mempertimbangkan kebutuhan.' },
    ],
    answer: 'd',
    explanation: 'Jadwal yang seimbang memberi ruang bagi beberapa tanggung jawab penting secara proporsional.',
  },
  {
    prompt: 'Sebelum membagikan informasi ke grup kelas, sebaiknya kita ...',
    options: [
      { id: 'a', text: 'Langsung membagikannya agar menjadi yang pertama.' },
      { id: 'b', text: 'Mengubah isi pesan agar lebih menarik.' },
      { id: 'c', text: 'Memastikan sumber dan kebenaran informasinya.' },
      { id: 'd', text: 'Menambahkan nama orang tanpa izin.' },
      { id: 'e', text: 'Mengirimnya berulang kali.' },
    ],
    answer: 'c',
    explanation: 'Memeriksa sumber sebelum membagikan informasi merupakan bentuk tanggung jawab di ruang digital.',
  },
];

export const teacherDemoClasses = [
  {
    id: 'vii-a',
    name: 'X MA A',
    students: 32,
    progress: 82,
    averageScore: 84,
    members: ['Alya R.', 'Bima P.', 'Citra N.', 'Daffa A.', 'Elma S.'],
  },
  {
    id: 'vii-b',
    name: 'X MA B',
    students: 30,
    progress: 64,
    averageScore: 79,
    members: ['Farhan M.', 'Gita A.', 'Hanif R.', 'Intan K.', 'Jihan P.'],
  },
  {
    id: 'viii-a',
    name: 'X MA C',
    students: 34,
    progress: 76,
    averageScore: 86,
    members: ['Kamal D.', 'Laila F.', 'Mika R.', 'Naufal S.', 'Putri A.'],
  },
];

export type TeacherDemoModule = {
  id: string;
  title: string;
  category: string;
  lessons: number;
  status: 'Diterbitkan' | 'Draf';
};

export const initialTeacherDemoModules: TeacherDemoModule[] = [
  { id: 'teacher-tawazun', title: 'Tawazun dalam Keseharian', category: 'Akhlak', lessons: 3, status: 'Diterbitkan' },
  { id: 'teacher-wasathiyah', title: 'Islam Wasathiyah: Pengantar', category: 'Wasathiyah', lessons: 2, status: 'Diterbitkan' },
  { id: 'teacher-adab-digital', title: 'Adab Belajar Digital', category: 'Adab', lessons: 2, status: 'Draf' },
];

export type TeacherDemoAnnouncement = {
  id: string;
  title: string;
  message: string;
  classId?: string | null;
  status?: 'draft' | 'published';
  createdAt?: string;
  publishedAt?: string | null;
};

export type TeacherDemoMessage = {
  id: string;
  title: string;
  body: string;
  classId: string;
  senderName: string;
  createdAt: string;
  readAt?: string | null;
};

export const initialTeacherDemoMessages: TeacherDemoMessage[] = [
  {
    id: 'demo-message-1',
    title: 'Persiapan kuis Tawazun',
    body: 'Silakan baca kembali materi Tawazun sebelum mengerjakan kuis. Catat satu contoh keseimbangan yang kamu terapkan sehari-hari.',
    classId: 'viii-a',
    senderName: 'Ahmad Fauzi',
    createdAt: '2026-10-27T08:00:00.000Z',
    readAt: null,
  },
  {
    id: 'demo-message-2',
    title: 'Pengingat refleksi belajar',
    body: 'Setelah menyelesaikan materi, tulis refleksi dan satu rencana aksi yang bisa kamu lakukan minggu ini.',
    classId: 'viii-a',
    senderName: 'Ahmad Fauzi',
    createdAt: '2026-10-25T08:00:00.000Z',
    readAt: null,
  },
];

export const initialTeacherDemoAnnouncements: TeacherDemoAnnouncement[] = [
  { id: 'announcement-1', title: 'Kuis pemahaman tersedia', message: 'Siswa dapat mencoba kuis Tawazun setelah membaca materi.', classId: 'vii-a', status: 'published', createdAt: '2026-10-27T08:00:00.000Z', publishedAt: '2026-10-27T08:00:00.000Z' },
];
