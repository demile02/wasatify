'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Printer } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import type { StudentCertificate, StudentCertificatesData } from '@/lib/student/certificates';

type StudentCertificatesViewProps = StudentCertificatesData & {
  studentName: string;
  basePath?: string;
  modulesHref?: string;
};

export function StudentCertificatesView({
  certificates,
  page,
  hasNextPage,
  hasPreviousPage,
  studentName,
  basePath = '/student/certificates',
  modulesHref = '/student/modules',
}: StudentCertificatesViewProps) {
  const [printModuleId, setPrintModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!printModuleId) return;
    const finishPrinting = () => {
      document.body.classList.remove('certificate-printing');
      setPrintModuleId(null);
    };

    document.body.classList.add('certificate-printing');
    const onAfterPrint = () => finishPrinting();
    window.addEventListener('afterprint', onAfterPrint);
    const frame = window.requestAnimationFrame(() => window.print());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', onAfterPrint);
      document.body.classList.remove('certificate-printing');
    };
  }, [printModuleId]);

  return (
    <div>
      <PageHeader
        eyebrow="Sertifikat"
        title="Sertifikat Belajar"
        description="Sertifikat tersedia setelah status penyelesaian modul tercatat. Kuis wajib harus lulus."
      />

      {certificates.length ? (
        <div className="mt-8 space-y-6">
          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.moduleId}
                certificate={certificate}
                studentName={studentName}
                isPrintTarget={printModuleId === certificate.moduleId}
                onPrint={() => setPrintModuleId(certificate.moduleId)}
              />
            ))}
          </div>

          {(hasPreviousPage || hasNextPage) && (
            <nav aria-label="Navigasi halaman sertifikat" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {hasPreviousPage ? (
                <Button asChild variant="outline" className="min-h-11 justify-self-start">
                  <Link href={page === 2 ? basePath : `${basePath}?page=${page - 1}`}>Lebih baru</Link>
                </Button>
              ) : <span />}
              <span aria-current="page" className="text-center text-sm font-semibold text-muted-foreground">Halaman {page}</span>
              {hasNextPage ? (
                <Button asChild variant="outline" className="min-h-11 justify-self-end">
                  <Link href={`${basePath}?page=${page + 1}`}>Lebih lama</Link>
                </Button>
              ) : <span />}
            </nav>
          )}
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={Award}
          title="Belum ada sertifikat"
          description="Selesaikan materi modul dan lulus kuis wajib. Sertifikat akan muncul setelah modul tercatat selesai."
          action={<Button asChild variant="outline"><Link href={modulesHref}>Lihat Modul</Link></Button>}
        />
      )}
    </div>
  );
}

function CertificateCard({
  certificate,
  studentName,
  isPrintTarget,
  onPrint,
}: {
  certificate: StudentCertificate;
  studentName: string;
  isPrintTarget: boolean;
  onPrint: () => void;
}) {
  return (
    <SectionCard
      data-print-certificate={isPrintTarget ? 'true' : 'false'}
      className="min-w-0 border-gold/40 bg-gradient-to-br from-white via-white to-cream/70 p-4 sm:p-6 print:border-4 print:border-double print:border-gold print:bg-white"
    >
      <div className="grid min-h-72 place-items-center rounded-2xl border border-gold/35 bg-white px-5 py-8 text-center sm:min-h-80 sm:px-8">
        <div className="max-w-xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint text-primary print:hidden">
            <Award className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-gold">WASATIFY</p>
          <h2 className="mt-2 text-xl font-extrabold text-ink sm:text-2xl">Sertifikat Penyelesaian</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Diberikan kepada</p>
          <p className="mt-1 break-words text-xl font-extrabold text-primary sm:text-2xl">{studentName}</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">atas penyelesaian modul</p>
          <p className="mt-1 break-words text-lg font-bold text-ink">{certificate.moduleTitle}</p>
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            {certificate.completedAt ? `Selesai ${formatDateTime(certificate.completedAt)}` : 'Modul tercatat selesai'}
          </p>
        </div>
      </div>

      <div className="certificate-no-print mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Simpan sebagai PDF melalui menu cetak browser.</p>
        <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={onPrint}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Cetak / Simpan PDF
        </Button>
      </div>
    </SectionCard>
  );
}
