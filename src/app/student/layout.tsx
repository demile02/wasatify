import type { ReactNode } from 'react';
import { StudentShell } from '@/components/student/student-shell';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentNotifications } from '@/lib/notifications';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const notifications = await getStudentNotifications(profile);

  return (
    <StudentShell profile={profile} notifications={notifications}>
      {children}
    </StudentShell>
  );
}
