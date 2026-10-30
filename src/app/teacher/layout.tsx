import { Suspense, type ReactNode } from 'react';
import { TeacherShell } from '@/components/teacher/teacher-shell';
import { NotificationBell } from '@/components/shared/notification-bell';
import { NotificationBellFallback } from '@/components/shared/notification-bell-fallback';
import { requireTeacher } from '@/lib/auth/server';
import { demoTeacherProfile } from '@/lib/demo/teacher';
import { getTeacherNotifications } from '@/lib/notifications';
import type { Profile } from '@/lib/types';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const profile = (await requireTeacher()) ?? demoTeacherProfile;

  return (
    <TeacherShell
      profile={profile}
      notificationSlot={
        <Suspense fallback={<NotificationBellFallback />}>
          <TeacherNotifications profile={profile} />
        </Suspense>
      }
    >
      {children}
    </TeacherShell>
  );
}

async function TeacherNotifications({ profile }: { profile: Profile }) {
  const notifications = await getTeacherNotifications(profile);
  return <NotificationBell items={notifications} />;
}
