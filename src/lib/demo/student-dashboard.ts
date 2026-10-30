import type { StudentDashboardData } from '@/lib/student/data';
import { studentDemoModules } from '@/lib/demo/workspace-data';

export const demoStudentDashboardData: StudentDashboardData = {
  modules: studentDemoModules.map((module, index) => ({
    id: module.id,
    slug: module.id,
    title: module.title,
    description: module.description,
    status: index === 0 ? 'in_progress' : 'not_started',
    orderIndex: index + 1,
    lessonsCount: module.lessons.length,
    estimatedMinutes: module.lessons.reduce((total, lesson) => total + Number.parseInt(lesson.duration, 10), 0),
    duration: `${module.lessons.reduce((total, lesson) => total + Number.parseInt(lesson.duration, 10), 0)} menit`,
    progress: index === 0 ? 33 : 0,
    imageSrc: '/assets/wasatify-module-art.png',
  })),
  quizAttemptsCount: 1,
  streakDays: 3,
  points: 140,
  activities: [
    { title: 'Menyelesaikan materi Makna tawazun', time: 'Hari ini', type: 'module' },
    { title: 'Mengerjakan kuis Tawazun', time: 'Hari ini', type: 'quiz' },
  ],
  isDemo: true,
};
