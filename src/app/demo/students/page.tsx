import type { Metadata } from 'next';
import { DemoStudentWorkspace } from '@/components/demo/demo-student-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell';

export const metadata: Metadata = {
  title: 'Demo Siswa | WASATIFY',
  description: 'Masuk ke ruang belajar siswa demo dan coba modul, kuis, refleksi, serta progress.',
};

export default function DemoStudentPage() {
  return (
    <DemoWorkspaceShell role="student">
      <DemoStudentWorkspace view="dashboard" />
    </DemoWorkspaceShell>
  );
}
