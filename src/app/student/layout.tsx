import type { ReactNode } from 'react';
import { StudentShell } from '@/components/student/student-shell';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const profile = (await requireStudent()) ?? demoStudentProfile;

  return <StudentShell profile={profile}>{children}</StudentShell>;
}
