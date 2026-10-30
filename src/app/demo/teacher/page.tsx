import type { Metadata } from 'next';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell';
import { TeacherDashboardView } from '@/components/teacher/teacher-dashboard-view';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getDemoTeacherDashboardData } from '@/lib/demo/teacher-dashboard';

export const metadata: Metadata = {
  title: 'Demo Guru | WASATIFY',
  description: 'Masuk ke ruang kerja guru demo dan coba contoh pengelolaan kelas, modul, kuis, serta laporan.',
};

export default function DemoTeacherPage() {
  return (
    <DemoWorkspaceShell role="teacher">
      <TeacherDashboardView profile={demoTeacherProfile} dashboard={getDemoTeacherDashboardData()} basePath="/demo/teacher" />
    </DemoWorkspaceShell>
  );
}
