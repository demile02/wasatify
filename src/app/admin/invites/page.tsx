import { redirect } from 'next/navigation';
import { SectionCard } from '@/components/shared/section-card';
import { TeacherInviteCodesManager } from '@/components/teacher/teacher-invite-codes-manager';
import { Button } from '@/components/ui/button';
import { logoutAdminAction } from '@/lib/admin/auth-actions';
import { getCurrentProfile } from '@/lib/auth/server';
import type { TeacherInviteCodeRecord } from '@/lib/admin/teacher-invite-actions';
import { createClient } from '@/lib/supabase/server';

export default async function AdminInvitesPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') redirect('/admin/login');

  let data: TeacherInviteCodeRecord[] | null = null;
  let failed = false;

  try {
    const supabase = await createClient();
    const result = await supabase
      .from('teacher_invite_codes')
      .select('id, code, teacher_name, created_at, expires_at, used_at, is_active')
      .order('created_at', { ascending: false })
      .limit(50);
    data = result.data;
    failed = Boolean(result.error);
  } catch {
    failed = true;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-extrabold tracking-normal text-ink sm:text-3xl">Kode Undangan Guru</h1>
          <form action={logoutAdminAction} className="shrink-0 sm:pt-1">
            <Button type="submit" variant="outline" className="min-h-11 w-full sm:w-auto">Keluar admin</Button>
          </form>
        </header>

        {failed ? (
          <SectionCard>
            <p role="alert" className="text-sm font-semibold text-red-800">
              Daftar kode guru belum dapat dimuat. Periksa konfigurasi Supabase server, lalu muat ulang halaman.
            </p>
          </SectionCard>
        ) : (
          <TeacherInviteCodesManager initialInvites={data ?? []} />
        )}
      </div>
    </main>
  );
}
