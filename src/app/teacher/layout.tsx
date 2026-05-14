import type { ReactNode } from 'react';
import { TeacherShell } from '@/components/teacher/teacher-shell';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;

  return <TeacherShell profile={profile}>{children}</TeacherShell>;
}
