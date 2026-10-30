import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { TeacherInviteCodesManager } from '@/components/teacher/teacher-invite-codes-manager';
import { requireRole } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

export default async function TeacherInvitesPage() {
  const profile = await requireRole('admin');
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('teacher_invite_codes')
    .select('id, code, teacher_name, created_at, expires_at, used_at, is_active')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        eyebrow="Administrasi"
        title="Kode Undangan Guru"
        description="Buat kode sekali pakai untuk guru baru dan pantau masa berlaku serta status penggunaannya."
      />

      {error ? (
        <SectionCard className="mt-8">
          <p role="alert" className="text-sm font-semibold text-red-800">
            Daftar kode guru belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.
          </p>
        </SectionCard>
      ) : (
        <TeacherInviteCodesManager initialInvites={data ?? []} />
      )}
    </div>
  );
}
