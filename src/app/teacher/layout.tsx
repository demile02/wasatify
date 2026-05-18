import type { ReactNode } from 'react';
import { TeacherShell } from '@/components/teacher/teacher-shell';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherNotifications } from '@/lib/notifications';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;
  const notifications = await getTeacherNotifications(profile);

  return (
    <TeacherShell profile={profile} notifications={notifications}>
      {children}
    </TeacherShell>
  );
}
