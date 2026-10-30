import { Suspense, type ReactNode } from 'react';
import { StudentShell } from '@/components/student/student-shell';
import { NotificationBell } from '@/components/shared/notification-bell';
import { NotificationBellFallback } from '@/components/shared/notification-bell-fallback';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentNotifications } from '@/lib/notifications';
import { getStudentUnreadMessageCount } from '@/lib/student/messages';
import type { Profile } from '@/lib/types';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const profile = (await requireStudent()) ?? demoStudentProfile;

  return (
    <StudentShell
      profile={profile}
      notificationSlot={
        <Suspense fallback={<NotificationBellFallback />}>
          <StudentNotifications profile={profile} />
        </Suspense>
      }
      messageBadge={
        <Suspense fallback={null}>
          <StudentMessageBadge profile={profile} />
        </Suspense>
      }
    >
      {children}
    </StudentShell>
  );
}

async function StudentNotifications({ profile }: { profile: Profile }) {
  const notifications = await getStudentNotifications(profile);
  return <NotificationBell items={notifications} />;
}

async function StudentMessageBadge({ profile }: { profile: Profile }) {
  const unreadCount = await getStudentUnreadMessageCount(profile);
  if (!unreadCount) return null;

  return (
    <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-extrabold text-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
