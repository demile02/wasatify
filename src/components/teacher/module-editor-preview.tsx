import { BookOpen } from 'lucide-react';
import { CroppedImage } from '@/components/shared/cropped-image';
import { SectionCard } from '@/components/shared/section-card';
import type { FormState } from '@/components/teacher/module-editor-types';
import type { TeacherClassOption } from '@/lib/teacher/module-editor';

export function ModulePreview({
  form,
  coverPreview,
  selectedClass,
  tags,
}: {
  form: FormState;
  coverPreview: string;
  selectedClass?: TeacherClassOption;
  tags: string[];
}) {
  const displayedHero = form.imageCropConfig ? coverPreview : form.heroImagePath || coverPreview;
  return (
    <SectionCard variant="muted">
      <p className="font-bold text-ink">Preview Modul</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
        <div className="relative grid aspect-[16/9] place-items-center overflow-hidden bg-mint text-primary lg:aspect-[4/3]">
          {displayedHero && (form.imageCropConfig ? (
            <>
              <div className="absolute inset-0 lg:hidden">
                <CroppedImage src={displayedHero} crop={form.imageCropConfig.heroMobile} sizes="100vw" />
              </div>
              <div className="absolute inset-0 hidden lg:block">
                <CroppedImage src={displayedHero} crop={form.imageCropConfig.heroDesktop} sizes="45vw" />
              </div>
            </>
          ) : (
            <CroppedImage src={displayedHero} sizes="100vw" />
          ))}
          {!displayedHero && <BookOpen className="h-12 w-12" />}
        </div>
        <div className="p-4">
          <p className="text-xs font-bold text-primary">{selectedClass?.gradeLevel ?? selectedClass?.name ?? 'Umum'}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-extrabold text-ink">
            {form.title || 'Judul Modul'}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink">
            {form.description || 'Deskripsi modul akan tampil di sini.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.length ? (
              tags.map((tag) => (
                <span key={tag} className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-primary">
                  {tag}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-muted-foreground">
                Tanpa tag
              </span>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

