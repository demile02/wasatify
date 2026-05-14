import { Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';

export default function StudentAnnouncementsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Pengumuman"
        title="Pengumuman Kelas"
        description="Informasi terbaru dari guru dan platform WASATIFY."
      />
      <div className="mt-8 grid gap-4">
        {['Kuis Akhir Pekan', 'Modul Baru Tersedia'].map((title) => (
          <SectionCard key={title} as="article">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-primary">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-ink">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Informasi ini berasal dari data demo dan akan terhubung ke Supabase pada fase berikutnya.
                </p>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
