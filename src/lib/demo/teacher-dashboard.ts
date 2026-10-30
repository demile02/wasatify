import { initialTeacherDemoAnnouncements, initialTeacherDemoModules, teacherDemoClasses } from '@/lib/demo/workspace-data';
import type { TeacherDashboardData } from '@/lib/teacher/data';

export function getDemoTeacherDashboardData(): TeacherDashboardData {
  const averageProgress = Math.round(teacherDemoClasses.reduce((sum, item) => sum + item.progress, 0) / teacherDemoClasses.length);
  const now = new Date().toISOString();
  const moduleProgress = [82, 64, 76];

  return {
    classesCount: teacherDemoClasses.length,
    studentsCount: teacherDemoClasses.reduce((sum, item) => sum + item.students, 0),
    quizzesCount: 1,
    completionRate: averageProgress,
    classProgress: teacherDemoClasses.map((item) => ({
      id: item.id,
      name: `Kelas ${item.name}`,
      studentsCount: item.students,
      progress: item.progress,
    })),
    activities: [
      { id: 'demo-activity-quiz', title: 'Kuis Tawazun dikerjakan', description: 'Nilai rata-rata kelas 84', date: now, type: 'quiz' },
      { id: 'demo-activity-module', title: 'Modul demo diperbarui', description: 'Data ini hanya contoh.', date: now, type: 'module' },
    ],
    moduleCompletion: initialTeacherDemoModules
      .filter((module) => module.status === 'Diterbitkan')
      .map((module, index) => ({
        id: module.id,
        title: module.title,
        completionRate: moduleProgress[index % moduleProgress.length],
        completedCount: Math.round(teacherDemoClasses[0].students * (moduleProgress[index % moduleProgress.length] / 100)),
        studentsCount: teacherDemoClasses[0].students,
      })),
    announcements: initialTeacherDemoAnnouncements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.message,
      priority: 'normal',
      publishedAt: now,
      createdAt: now,
    })),
    isDemo: true,
  };
}
