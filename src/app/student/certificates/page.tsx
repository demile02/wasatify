import { StudentCertificatesView } from '@/components/student/student-certificates-view';
import { requireStudent } from '@/lib/auth/server';
import { demoStudentProfile } from '@/lib/demo/student';
import { getStudentCertificatesData } from '@/lib/student/certificates';

export default async function StudentCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const profile = (await requireStudent()) ?? demoStudentProfile;
  const params = await searchParams;
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(pageValue ?? '1', 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 1_000_000) : 1;
  const data = await getStudentCertificatesData(profile, page);

  return (
    <StudentCertificatesView {...data} studentName={profile.full_name} />
  );
}
