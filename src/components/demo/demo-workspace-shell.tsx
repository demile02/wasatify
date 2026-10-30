import type { ReactNode } from 'react';
import { StudentShell } from '@/components/student/student-shell';
import { TeacherShell } from '@/components/teacher/teacher-shell';
import { NotificationBell } from '@/components/shared/notification-bell';
import { demoStudentProfile } from '@/lib/demo/student';
import { demoTeacherProfile } from '@/lib/demo/teacher';

export type DemoRole = 'student' | 'teacher';

export function DemoWorkspaceShell({ role, children }: { role: DemoRole; children: ReactNode }) {
  if (role === 'student') {
    return (
      <StudentShell
        profile={demoStudentProfile}
        notificationSlot={<NotificationBell items={[]} />}
        messageBadge={null}
        demoMode
      >
        {children}
      </StudentShell>
    );
  }

  return (
    <TeacherShell profile={demoTeacherProfile} notificationSlot={<NotificationBell items={[]} />} demoMode>
      {children}
    </TeacherShell>
  );
}
