import type { ReactNode } from 'react';
import { StudentShell } from '@/components/student/student-shell';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentNotifications } from '@/lib/notifications';
import { getStudentMessagesData, getUnreadMessageCount } from '@/lib/student/messages';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const [notifications, messages] = await Promise.all([
    getStudentNotifications(profile),
    getStudentMessagesData(profile),
  ]);

  return (
    <StudentShell profile={profile} notifications={notifications} messageUnreadCount={getUnreadMessageCount(messages)}>
      {children}
    </StudentShell>
  );
}
